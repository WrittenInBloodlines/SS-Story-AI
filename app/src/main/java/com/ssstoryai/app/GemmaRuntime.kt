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

                    // IMPORTANT: this must happen directly after loadModel().
                    engine.setSystemPrompt(systemPrompt)

                    // Do not allow a generation request to race with native
                    // system-prompt processing.
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

        // The native llama.cpp engine is stateful. Only one request may touch
        // it at a time, and the next request must wait until the previous one
        // has fully returned to ModelReady. This prevents the every-second-
        // message native crash caused by overlapping generations.
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

                // 64 tokens is enough for a real short answer while still
                // keeping Gemma 3 1B practical on a phone. The UI can request
                // another value, but we cap it so one message cannot consume
                // the whole device's memory/time budget.
                val predictLength = request.optInt("maxTokens", 64).coerceIn(1, 96)

                val output = runBlocking(Dispatchers.IO) {
                    withTimeout(180_000L) {
                        // Always start from a clean native state.
                        engine.state.first { it is InferenceEngine.State.ModelReady }

                        val result = StringBuilder()
                        engine.sendUserPrompt(latestUserMessage, predictLength).collect { token ->
                            result.append(token)
                        }

                        // IMPORTANT: collect() can finish just before the
                        // native state has transitioned back to ModelReady.
                        // Wait for that transition before releasing the lock,
                        // so the next message cannot hit the native engine too
                        // early.
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
