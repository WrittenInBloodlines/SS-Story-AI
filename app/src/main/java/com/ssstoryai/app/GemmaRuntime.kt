package com.ssstoryai.app

import android.content.Context
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Content
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.Conversation
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.SamplerConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File

/**
 * Small native bridge for the first real local Gemma milestone.
 *
 * The web application remains responsible for projects, conversations,
 * story memory and prompts. LiteRT-LM only performs the actual generation.
 */
class GemmaRuntime(private val context: Context) {
    private var engine: Engine? = null
    private var conversation: Conversation? = null
    private var loadedPath: String? = null

    @Synchronized
    fun loadModel(modelPath: String): String {
        val file = File(modelPath)
        if (!file.exists()) return "Model file was not found."
        if (!file.canRead()) return "Model file cannot be read."
        if (file.length() <= 0L) return "Model file is empty."

        close()

        return try {
            val candidate = Engine(
                EngineConfig(
                    modelPath = file.absolutePath,
                    backend = Backend.CPU(),
                    cacheDir = context.cacheDir.absolutePath
                )
            )
            candidate.initialize()
            engine = candidate
            conversation = candidate.createConversation(
                ConversationConfig(
                    samplerConfig = SamplerConfig(
                        temperature = 0.8,
                        topK = 40,
                        topP = 0.9
                    )
                )
            )
            loadedPath = file.absolutePath
            "OK"
        } catch (error: Throwable) {
            close()
            "${error.javaClass.simpleName}: ${error.message ?: "unknown model error"}"
        }
    }

    fun isLoaded(): Boolean = engine != null && conversation != null && loadedPath != null

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
            val prompt = buildPrompt(request)
            val output = runBlocking(Dispatchers.IO) {
                val result = StringBuilder()
                conversation!!.sendMessageAsync(prompt).collect { chunk ->
                    result.append(chunk.toString())
                }
                result.toString()
            }

            JSONObject()
                .put("ok", true)
                .put("text", output)
                .toString()
        } catch (error: Throwable) {
            JSONObject()
                .put("ok", false)
                .put("code", "LOCAL_MODEL_FAILED")
                .put("message", error.message ?: "Gemma generation failed.")
                .toString()
        }
    }

    private fun buildPrompt(request: JSONObject): String {
        val system = request.optString("system", "").trim()
        val messages = request.optJSONArray("messages")
        val builder = StringBuilder()

        if (system.isNotEmpty()) {
            builder.append("System instructions:\n")
                .append(system)
                .append("\n\n")
        }

        if (messages != null) {
            for (index in 0 until messages.length()) {
                val message = messages.optJSONObject(index) ?: continue
                val role = message.optString("role", "user")
                val content = message.optString("content", "")
                if (content.isBlank()) continue
                builder.append(role.replaceFirstChar { it.uppercase() })
                    .append(": ")
                    .append(content)
                    .append("\n")
            }
        }

        builder.append("Assistant:")
        return builder.toString()
    }

    @Synchronized
    fun close() {
        try {
            conversation?.close()
        } catch (_: Throwable) {
        }
        conversation = null

        try {
            engine?.close()
        } catch (_: Throwable) {
        }
        engine = null
        loadedPath = null
    }
}
