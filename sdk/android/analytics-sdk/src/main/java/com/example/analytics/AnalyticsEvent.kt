package com.example.analytics

data class AnalyticsEvent(
    val eventName: String,
    val timestampMs: Long = System.currentTimeMillis(),
    val sessionId: String,
    val platform: String = "android",
    val properties: Map<String, Any?> = emptyMap()
)