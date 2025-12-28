package com.example.analytics.network

data class EventBatchDto(
    val api_key: String,
    val sent_at_ms: Long,
    val events: List<EventDto>
)