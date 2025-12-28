package com.example.analytics

object EventQueue {

    private val events = mutableListOf<AnalyticsEvent>()

    fun enqueue(event: AnalyticsEvent) {
        events.add(event)
    }

    fun drain(): List<AnalyticsEvent> {
        val snapshot = events.toList()
        events.clear()
        return snapshot
    }

    fun size(): Int = events.size
}