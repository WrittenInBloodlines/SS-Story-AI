package com.ssstoryai.app

import android.content.Context
import com.arm.aichat.AiChat
import com.arm.aichat.InferenceEngine
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.json.JSONObject
import java.io.File
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock

/**
 * Local GGUF runtime for the first real Gemma milestone.
 *
 * The Android app uses llama.cpp for GGUF models. The web application remains
 * responsible for projects, conversations, story memory and prompts.
 */
class GemmaRuntime(context: Context) {
    private val engine: InferenceEngine = AiChat.getInferenceEngine(context)
    private var loadedPath: String? = null
    private val generationLock = ReentrantLock()

    // llama.cpp requires the system prompt to be set immediately after the
    // model is loaded. Keep it short because Gemma 3 1B has to process this
    // prompt on-device before the first user token can be generated.
    private val systemPrompt = "You are S•S Story AI, a helpful writing assistant. Follow the user's instructions and answer directly."

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
                withTimeout(60_000L) {
                    engine.state.first { it is InferenceEngine.State.Initialized }
                    engine.loadModel(file.absolutePath)

                    // IMPORTANT: this must happen directly after loadModel().
                    engine.setSystemPrompt(systemPrompt)

                    // Wait until native system-prompt processing is complete.
                    engine.state.first { it is InferenceEngine.State.ModelReady }
                }
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

        return generationLock.withLock {
            try {
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
                    return@withLock JSONObject()
                        .put("ok", false)
                        .put("code", "EMPTY_USER_MESSAGE")
                        .put("message", "No user message was supplied.")
                        .toString()
                }

                // Start with a deliberately tiny response for the on-device
                // smoke test. If Gemma can emit even a few tokens, we know the
                // native inference path is alive. The web UI can request up to
                // 16 tokens for this first milestone.
                val predictLength = request.optInt("maxTokens", 8).coerceIn(1, 16)

                val output = runBlocking(Dispatchers.IO) {
                    // IMPORTANT: keep this timeout longer than the web UI's
                    // 180-second safety timeout. The native llama.cpp call is
                    // synchronous while each token is generated, so cancelling
                    // too early can leave the native worker busy after Kotlin
                    // has already reported a timeout.
                    withTimeout(180_000L) {
                        engine.state.first { it is InferenceEngine.State.ModelReady }

                        val result = StringBuilder()
                        engine.sendUserPrompt(latestUserMessage, predictLength).collect { token ->
                            result.append(token)
                        }
                        result.toString()
                    }
                }

                if (output.isBlank()) {
                    return@withLock JSONObject()
                        .put("ok", false)
                        .put("code", "LOCAL_MODEL_EMPTY_RESPONSE")
                        .put("message", "Gemma processed the request but returned no generated tokens.")
                        .toString()
                }

                JSONObject()
                    .put("ok", true)
                    .put("text", output)
                    .toString()
            } catch (error: Throwable) {
                JSONObject()
                    .put(
                        "code",
                        if (error is kotlinx.coroutines.TimeoutCancellationException) {
                            "LOCAL_MODEL_TIMEOUT"
                        } else {
                            "LOCAL_MODEL_FAILED"
                        }
                    )
                    .put("ok", false)
                    .put("message", error.message ?: "Gemma generation failed.")
                    .toString()
            }
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
