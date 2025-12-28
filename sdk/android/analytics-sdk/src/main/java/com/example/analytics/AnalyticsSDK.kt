package com.example.analytics

import android.content.Context
import android.util.Log
import java.util.UUID
import com.example.analytics.network.EventBatchDto
import com.example.analytics.network.EventMapper
import com.example.analytics.network.RetrofitClient

object AnalyticsSDK {

    private var initialized = false
    private lateinit var appContext: Context
    private lateinit var apiKey: String

    private var sessionId: String = generateSessionId()
    private var endpoint: String = "http://10.0.2.2:8000/"

    fun init(
        context: Context,
        apiKey: String,
        endpoint: String = "http://10.0.2.2:8000/"
    ) {
        if (initialized) return

        this.appContext = context.applicationContext
        this.apiKey = apiKey
        this.endpoint = endpoint
        this.sessionId = generateSessionId()

        initialized = true
    }

    fun track(
        eventName: String,
        properties: Map<String, Any?> = emptyMap()
    ) {
        if (!initialized) return
        if (eventName.isBlank()) return

        val event = AnalyticsEvent(
            eventName = eventName,
            sessionId = sessionId,
            properties = properties
        )

        EventQueue.enqueue(event)
    }

    fun flush() {
        if (!initialized) {
            Log.d("AnalyticsSDK", "flush() called but SDK not initialized")
            return
        }

        val events = EventQueue.drain()
        Log.d("AnalyticsSDK", "Flushing ${events.size} events")
        if (events.isEmpty()) return

        val api = RetrofitClient.getApi(endpoint)

        val batch = EventBatchDto(
            api_key = apiKey,
            sent_at_ms = System.currentTimeMillis(),
            events = events.map { EventMapper.toDto(it) }
        )

        api.sendEvents(batch).enqueue(object : retrofit2.Callback<Unit> {
            override fun onResponse(
                call: retrofit2.Call<Unit>,
                response: retrofit2.Response<Unit>
            ) {
                Log.d("AnalyticsSDK", "Sent events successfully: ${response.code()}")
            }

            override fun onFailure(
                call: retrofit2.Call<Unit>,
                t: Throwable
            ) {
                Log.e("AnalyticsSDK", "Failed to send events", t)
            }
        })
    }

    fun getSessionId(): String = sessionId

    fun startNewSession() {
        sessionId = generateSessionId()
    }

    private fun generateSessionId(): String {
        return UUID.randomUUID().toString()
    }
}
