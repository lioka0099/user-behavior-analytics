package com.example.analytics

import android.content.Context
import java.util.UUID

object AnalyticsSDK {

    private var initialized = false
    private lateinit var appContext: Context
    private lateinit var apiKey: String

    private var sessionId: String = generateSessionId()

    fun init(
        context: Context,
        apiKey: String
    ) {
        if (initialized) return

        this.appContext = context.applicationContext
        this.apiKey = apiKey
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
        if (!initialized) return
        EventQueue.drain()
    }

    fun getSessionId(): String = sessionId

    fun startNewSession() {
        sessionId = generateSessionId()
    }

    private fun generateSessionId(): String {
        return UUID.randomUUID().toString()
    }
}
