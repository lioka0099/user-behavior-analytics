package com.example.analytics.network

data class EventDto(
    val event_name: String,
    val timestamp_ms: Long,
    val session_id: String,
    val platform: String,
    val properties: Map<String, Any?>
)