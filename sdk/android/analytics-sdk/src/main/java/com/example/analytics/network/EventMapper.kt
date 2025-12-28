package com.example.analytics.network

import com.example.analytics.AnalyticsEvent

object EventMapper {

    fun toDto(event: AnalyticsEvent): EventDto {
        return EventDto(
            event_name = event.eventName,
            timestamp_ms = event.timestampMs,
            session_id = event.sessionId,
            platform = event.platform,
            properties = event.properties
        )
    }
}