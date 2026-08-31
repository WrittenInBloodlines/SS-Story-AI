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
    private val systemPrompt = """
        You are S•S Story AI, a focused writing and story-development assistant.
        Answer the user's actual request directly. When the user asks for story prose, write the prose itself instead of announcing what you are going to write.
        Treat the supplied project context as reference data, not as text to repeat.
        Canon facts are authoritative and must not be silently changed.
        Do not invent major plot twists, revelations, character appearances, secrets being revealed, or other major events unless the user asks for them or they are clearly required by the user's instruction.
        Expand requested scenes creatively while preserving established characters, relationships, world rules, chronology, locations, objects, and knowledge boundaries.
        Never reveal private author-only or secret information to a character or reader when the supplied context says that information is unknown to them.
        If project context is absent, simply work from the conversation.
    """.trimIndent()

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
            return JSONObject()
                .put("ok", false)
                .put("code", "LOCAL_MODEL_NOT_LOADED")
                .put("message", "Gemma is not loaded on this device yet.")
                .toString()
        }

        return generationLock.withLock {
            try {
                val request = JSONObject(requestJson)
                val messages = request.optJSONArray("messages") ?: JSONArray()
                val projectContext = request.optJSONObject("projectContext")
                val predictLength = request.optInt("maxTokens", 768).coerceIn(1, 1024)

                resetNativeConversation()

                val prompt = buildConversationPrompt(messages, projectContext)
                val result = StringBuilder()

                runBlocking(Dispatchers.IO) {
                    withTimeout(180_000L) {
                        engine.state.first { it is InferenceEngine.State.ModelReady }
                        engine.sendUserPrompt(prompt, predictLength).collect { token ->
                            if (!token.isNullOrEmpty()) {
                                result.append(token)
                                try {
                                    tokenListener?.onToken(token)
                                } catch (_: Throwable) {
                                    // UI streaming failures must never abort native inference.
                                }
                            }
                        }
                        engine.state.first { it is InferenceEngine.State.ModelReady }
                    }
                }

                val output = result.toString()
                if (output.isBlank()) {
                    return@withLock JSONObject()
                        .put("ok", false)
                        .put("code", "LOCAL_MODEL_EMPTY_RESPONSE")
                        .put("message", "Gemma processed the request but returned no generated tokens. Try the request again.")
                        .toString()
                }

                JSONObject()
                    .put("ok", true)
                    .put("text", output)
                    .toString()
            } catch (error: Throwable) {
                JSONObject()
                    .put("ok", false)
                    .put(
                        "code",
                        if (error is kotlinx.coroutines.TimeoutCancellationException) {
                            "LOCAL_MODEL_TIMEOUT"
                        } else {
                            "LOCAL_MODEL_FAILED"
                        }
                    )
                    .put("message", error.message ?: "Gemma generation failed.")
                    .toString()
            }
        }
    }

    private fun resetNativeConversation() {
        val path = loadedPath ?: throw IllegalStateException("No loaded model path is available.")
        val file = File(path)
        if (!file.exists() || !file.isFile) {
            throw IllegalStateException("The loaded Gemma model file is no longer available.")
        }

        runBlocking(Dispatchers.IO) {
            withTimeout(60_000L) {
                if (engine.state.value.isModelLoaded) {
                    engine.cleanUp()
                }
                engine.state.first { it is InferenceEngine.State.Initialized }
                engine.loadModel(file.absolutePath)
                engine.setSystemPrompt(systemPrompt)
                engine.state.first { it is InferenceEngine.State.ModelReady }
            }
        }
    }

    private fun buildConversationPrompt(messages: JSONArray, projectContext: JSONObject?): String {
        val maxCharacters = 20_000
        val turns = ArrayList<Pair<String, String>>()

        if (messages.length() > 0) {
            for (index in 0 until messages.length()) {
                val message = messages.optJSONObject(index) ?: continue
                val role = message.optString("role", "user")
                val content = message.optString("content", "").trim()
                if (content.isBlank()) continue
                turns.add((if (role == "assistant") "Assistant" else "User") to content)
            }
        }

        val selected = ArrayList<Pair<String, String>>()
        var used = 0
        for (index in turns.indices.reversed()) {
            val turn = turns[index]
            val size = turn.first.length + turn.second.length + 3
            if (selected.isNotEmpty() && used + size > maxCharacters) break
            selected.add(turn)
            used += size
        }
        selected.reverse()

        return buildString {
            append("PROJECT CONTEXT (use only when relevant):\n")
            append(formatProjectContext(projectContext))
            append("\n\nCONVERSATION:\n")
            if (selected.isEmpty()) {
                append("User: Please respond directly to the user.\n")
            } else {
                for ((role, content) in selected) {
                    append(role).append(": ").append(content).append("\n")
                }
            }
            append("\nAssistant:")
        }
    }

    private fun formatProjectContext(context: JSONObject?): String {
        if (context == null) return "No structured project context supplied."

        val sections = arrayOf(
            "canon" to "CANON",
            "characters" to "CHARACTERS",
            "relationships" to "RELATIONSHIPS",
            "world" to "WORLD",
            "events" to "IMPORTANT EVENTS",
            "memories" to "MEMORIES",
            "plot" to "OPEN PLOT THREADS"
        )

        val output = StringBuilder()
        var sectionCount = 0
        for ((key, label) in sections) {
            val value = context.opt(key)
            if (value == null) continue
            val text = value.toString().trim()
            if (text.isBlank() || text == "[]" || text == "{}") continue
            output.append(label).append(":\n").append(text).append("\n")
            sectionCount++
        }

        return if (sectionCount == 0) "No relevant structured context was found." else output.toString().trim()
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
