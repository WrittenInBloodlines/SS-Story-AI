package com.ssstoryai.app

import android.content.Context
import com.arm.aichat.AiChat
import com.arm.aichat.InferenceEngine
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock

class GemmaRuntime(context: Context) {
    interface TokenListener {
        fun onToken(token: String)
    }

    private val engine: InferenceEngine = AiChat.getInferenceEngine(context)
    private var loadedPath: String? = null
    private val generationLock = ReentrantLock()
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
            loadModelFile(file)
            loadedPath = file.absolutePath
            "OK"
        } catch (error: Throwable) {
            loadedPath = null
            "${error.javaClass.simpleName}: ${error.message ?: "unknown GGUF model error"}"
        }
    }

    private fun loadModelFile(file: File) {
        runBlocking(Dispatchers.IO) {
            withTimeout(60_000L) {
                engine.state.first { it is InferenceEngine.State.Initialized }
                engine.loadModel(file.absolutePath)
                engine.setSystemPrompt(systemPrompt)
                engine.state.first { it is InferenceEngine.State.ModelReady }
            }
        }
    }

    fun isLoaded(): Boolean = loadedPath != null && engine.state.value.isModelLoaded

    fun generate(requestJson: String): String = generate(requestJson, null)

    fun generate(requestJson: String, tokenListener: TokenListener?): String {
        if (!isLoaded()) {
            return JSONObject().put("ok", false).put("code", "LOCAL_MODEL_NOT_LOADED")
                .put("message", "Gemma is not loaded on this device yet.").toString()
        }

        return generationLock.withLock {
            try {
                val request = JSONObject(requestJson)
                val messages = request.optJSONArray("messages") ?: JSONArray()
                val predictLength = request.optInt("maxTokens", 48).coerceIn(1, 64)

                // The Android llama.cpp wrapper keeps native conversation state.
                // Rebuild that state when a real chat history is supplied so a
                // second user message cannot be interpreted as another turn in
                // the old native conversation.
                if (messages.length() > 1) {
                    resetNativeConversation()
                } else {
                    // Flow.first is suspend, so this readiness check must run
                    // inside a coroutine even though generate() itself is synchronous.
                    runBlocking(Dispatchers.IO) {
                        withTimeout(10_000L) {
                            engine.state.first { it is InferenceEngine.State.ModelReady }
                        }
                    }
                }

                val prompt = buildSingleTurnPrompt(messages)
                val result = StringBuilder()

                runBlocking(Dispatchers.IO) {
                    withTimeout(180_000L) {
                        engine.state.first { it is InferenceEngine.State.ModelReady }
                        engine.sendUserPrompt(prompt, predictLength).collect { token ->
                            result.append(token)
                            if (!token.isNullOrEmpty()) {
                                try {
                                    tokenListener?.onToken(token)
                                } catch (_: Throwable) {
                                    // UI streaming must never cancel inference.
                                }
                            }
                        }
                        engine.state.first { it is InferenceEngine.State.ModelReady }
                    }
                }

                val output = result.toString()
                if (output.isBlank()) {
                    return@withLock JSONObject().put("ok", false).put("code", "LOCAL_MODEL_EMPTY_RESPONSE")
                        .put("message", "Gemma processed the request but returned no generated tokens.").toString()
                }

                JSONObject().put("ok", true).put("text", output).toString()
            } catch (error: Throwable) {
                JSONObject().put("ok", false).put(
                    "code",
                    if (error is kotlinx.coroutines.TimeoutCancellationException) "LOCAL_MODEL_TIMEOUT" else "LOCAL_MODEL_FAILED"
                ).put("message", error.message ?: "Gemma generation failed.").toString()
            }
        }
    }

    private fun resetNativeConversation() {
        val path = loadedPath ?: throw IllegalStateException("No loaded model path is available.")
        val file = File(path)
        if (!file.exists() || !file.isFile) throw IllegalStateException("The loaded Gemma model file is no longer available.")

        runBlocking(Dispatchers.IO) {
            withTimeout(60_000L) {
                if (engine.state.value.isModelLoaded) engine.cleanUp()
                engine.state.first { it is InferenceEngine.State.Initialized }
                engine.loadModel(file.absolutePath)
                engine.setSystemPrompt(systemPrompt)
                engine.state.first { it is InferenceEngine.State.ModelReady }
            }
        }
    }

    private fun buildSingleTurnPrompt(messages: JSONArray): String {
        if (messages.length() == 0) return "Please respond directly to the user."

        val transcript = StringBuilder()
        for (index in 0 until messages.length()) {
            val message = messages.optJSONObject(index) ?: continue
            val role = message.optString("role", "user")
            val content = message.optString("content", "").trim()
            if (content.isBlank()) continue
            transcript.append(if (role == "assistant") "Assistant: " else "User: ")
                .append(content).append("\n")
        }
        transcript.append("\nAssistant:")
        return transcript.toString()
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
