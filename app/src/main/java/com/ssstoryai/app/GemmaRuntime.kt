package com.ssstoryai.app

import android.content.Context
import com.arm.aichat.AiChat
import com.arm.aichat.InferenceEngine
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import java.io.File

/**
 * Local GGUF runtime for the first real Gemma milestone.
 *
 * The Android app uses llama.cpp for GGUF models. The web application remains
 * responsible for projects, conversations, story memory and prompts.
 */
class GemmaRuntime(context: Context) {
    private val engine: InferenceEngine = AiChat.getInferenceEngine(context)
    private var loadedPath: String? = null

    @Synchronized
    fun loadModel(modelPath: String): String {
        val file = File(modelPath)
        if (!file.exists()) return "Model file was not found."
        if (!file.isFile) return "Selected model is not a file."
        if (!file.canRead()) return "Model file cannot be read."
        if (file.length() <= 0L) return "Model file is empty."
        if (!file.name.lowercase().endsWith(".gguf")) return "Please choose a GGUF model file."

        return try {
            runBlocking(Dispatchers.IO) {
                engine.state.first { it is InferenceEngine.State.Initialized }
                engine.loadModel(file.absolutePath)
            }
            loadedPath = file.absolutePath
            "OK"
        } catch (error: Throwable) {
            loadedPath = null
            "${error.javaClass.simpleName}: ${error.message ?: "unknown GGUF model error"}"
        }
    }

    fun isLoaded(): Boolean = loadedPath != null && engine.state.value.isModelLoaded

    fun generate(requestJson: String): String {
        if (!isLoaded()) {
            return JSONObject()
                .put("ok", false)
                .put("code", "LOCAL_MODEL_NOT_LOADED")
                .put("message", "Gemma is not loaded on this device yet.")
                .toString()
        }

        return try {
            val request = JSONObject(requestJson)
            val messages = request.optJSONArray("messages")
            var latestUserMessage = ""
            if (messages != null) {
                for (index in 0 until messages.length()) {
                    val message = messages.optJSONObject(index) ?: continue
                    if (message.optString("role", "user") == "user") {
                        val content = message.optString("content", "").trim()
                        if (content.isNotEmpty()) latestUserMessage = content
                    }
                }
            }

            if (latestUserMessage.isBlank()) {
                return JSONObject()
                    .put("ok", false)
                    .put("code", "EMPTY_USER_MESSAGE")
                    .put("message", "No user message was supplied.")
                    .toString()
            }

            /*
             * Keep the first native Gemma path deliberately minimal.
             * The upstream llama.android sample sends the user prompt directly
             * after loading the GGUF model. In particular, do not call
             * setSystemPrompt() here: the native Android runtime requires a
             * system prompt to be processed immediately after loadModel(), and
             * doing it from this later request path can leave the native engine
             * in ProcessingSystemPrompt/ProcessingUserPrompt when generation
             * fails, which makes the WebView appear to be generating forever.
             *
             * The web layer can still send the full conversation, while the
             * native runtime uses the newest user message for this milestone.
             */
            val output = runBlocking(Dispatchers.IO) {
                val result = StringBuilder()
                engine.sendUserPrompt(latestUserMessage, 1024).collect { token ->
                    result.append(token)
                }
                result.toString()
            }

            if (output.isBlank()) {
                return JSONObject()
                    .put("ok", false)
                    .put("code", "LOCAL_MODEL_EMPTY_RESPONSE")
                    .put("message", "Gemma processed the request but returned no generated tokens. The native inference path rejected the prompt or stopped before emitting a response.")
                    .toString()
            }

            JSONObject().put("ok", true).put("text", output).toString()
        } catch (error: Throwable) {
            JSONObject()
                .put("ok", false)
                .put("code", "LOCAL_MODEL_FAILED")
                .put("message", error.message ?: "Gemma generation failed.")
                .toString()
        }
    }

    @Synchronized
    fun close() {
        try {
            if (engine.state.value.isModelLoaded) engine.cleanUp()
        } catch (_: Throwable) {
        }
        loadedPath = null
    }
}

private val InferenceEngine.State.isModelLoaded: Boolean
    get() = when (this) {
        is InferenceEngine.State.ModelReady,
        is InferenceEngine.State.Benchmarking,
        is InferenceEngine.State.ProcessingSystemPrompt,
        is InferenceEngine.State.ProcessingUserPrompt,
        is InferenceEngine.State.Generating -> true
        else -> false
    }
