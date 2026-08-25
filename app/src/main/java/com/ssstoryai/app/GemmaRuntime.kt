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
    interface TokenListener {
        fun onToken(token: String)
    }

    private val engine: InferenceEngine = AiChat.getInferenceEngine(context)
    private var loadedPath: String? = null
    private val generationLock = ReentrantLock()

    // llama.cpp requires the system prompt to be set immediately after the
    // model is loaded. Keep it short so Gemma 3 1B can start generating quickly.
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
                    // IMPORTANT: llama.cpp requires this directly after loading.
                    engine.setSystemPrompt(systemPrompt)
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

    fun generate(requestJson: String): String = generate(requestJson, null)

    fun generate(requestJson: String, tokenListener: TokenListener?): String {
        if (!isLoaded()) {
            return JSONObject()
                .put("ok", false)
                .put("code", "LOCAL_MODEL_NOT_LOADED")
                .put("message", "Gemma is not loaded on this device yet.")
                .toString()
        }

        // The native engine is stateful. Serialize generations so a second
        // message cannot enter llama.cpp while the previous request is still
        // returning to ModelReady.
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

                // Keep the completion bounded, but no longer at the old 8-token
                // test value. 96 tokens gives Gemma enough room to finish normal
                // short chat replies without making the phone chew through a huge
                // completion.
                val predictLength = request.optInt("maxTokens", 96).coerceIn(1, 128)

                val output = runBlocking(Dispatchers.IO) {
                    withTimeout(180_000L) {
                        engine.state.first { it is InferenceEngine.State.ModelReady }

                        val result = StringBuilder()
                        engine.sendUserPrompt(latestUserMessage, predictLength).collect { token ->
                            result.append(token)
                            if (!token.isNullOrEmpty()) {
                                try {
                                    tokenListener?.onToken(token)
                                } catch (_: Throwable) {
                                    // UI streaming must never be able to break
                                    // native inference if the WebView disappears.
                                }
                            }
                        }

                        // Do not release the native-engine lock until llama.cpp
                        // has actually returned to its reusable state.
                        engine.state.first { it is InferenceEngine.State.ModelReady }
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
            generationLock.withLock {
                if (engine.state.value.isModelLoaded) engine.cleanUp()
                loadedPath = null
            }
        } catch (_: Throwable) {
            loadedPath = null
        }
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
