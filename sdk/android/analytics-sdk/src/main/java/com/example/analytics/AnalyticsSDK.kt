package com.example.analytics

import android.content.Context
import android.util.Log
import java.util.UUID
import com.example.analytics.network.EventBatchDto
import com.example.analytics.network.EventMapper
import com.example.analytics.network.IngestResponseDto
import com.example.analytics.network.RetrofitClient

object AnalyticsSDK {

    private const val TAG = "AnalyticsSDK"
    
    private var initialized = false
    private lateinit var appContext: Context
    private lateinit var apiKey: String

    private var sessionId: String = generateSessionId()
    private var endpoint: String = "http://10.0.2.2:8000/"
    
    // Auto-flush after this many events (0 = flush immediately after each event)
    private var flushThreshold: Int = 0

    fun init(
        context: Context,
        apiKey: String,
        endpoint: String = "http://10.0.2.2:8000/",
        flushThreshold: Int = 0  // Default: flush immediately
    ) {
        if (initialized) {
            Log.d(TAG, "SDK already initialized")
            return
        }

        this.appContext = context.applicationContext
        this.apiKey = apiKey
        this.endpoint = if (endpoint.endsWith("/")) endpoint else "$endpoint/"
        this.sessionId = generateSessionId()
        this.flushThreshold = flushThreshold

        initialized = true
        Log.d(TAG, "SDK initialized with endpoint: ${this.endpoint}, apiKey: $apiKey")
    }

    fun track(
        eventName: String,
        properties: Map<String, Any?> = emptyMap()
    ) {
        if (!initialized) {
            Log.w(TAG, "track() called but SDK not initialized")
            return
        }
        if (eventName.isBlank()) {
            Log.w(TAG, "track() called with blank event name")
            return
        }

        val event = AnalyticsEvent(
            eventName = eventName,
            sessionId = sessionId,
            properties = properties
        )

        EventQueue.enqueue(event)
        Log.d(TAG, "Event queued: $eventName (queue size: ${EventQueue.size()})")
        
        // Auto-flush if threshold reached (0 means flush immediately)
        if (flushThreshold == 0 || EventQueue.size() >= flushThreshold) {
            flush()
        }
    }

    fun flush() {
        if (!initialized) {
            Log.d(TAG, "flush() called but SDK not initialized")
            return
        }

        val events = EventQueue.drain()
        if (events.isEmpty()) {
            Log.d(TAG, "flush() called but no events to send")
            return
        }
        
        Log.d(TAG, "Flushing ${events.size} events to $endpoint")

        val api = RetrofitClient.getApi(endpoint)

        val batch = EventBatchDto(
            api_key = apiKey,
            sent_at_ms = System.currentTimeMillis(),
            events = events.map { EventMapper.toDto(it) }
        )

        api.sendEvents(batch).enqueue(object : retrofit2.Callback<IngestResponseDto> {
            override fun onResponse(
                call: retrofit2.Call<IngestResponseDto>,
                response: retrofit2.Response<IngestResponseDto>
            ) {
                if (response.isSuccessful) {
                    val body = response.body()
                    if (body != null) {
                        Log.d(TAG, "✓ Events sent successfully (${response.code()}), ingested=${body.ingested}")
                    } else {
                        Log.d(TAG, "✓ Events sent successfully (${response.code()})")
                    }
                } else {
                    Log.e(TAG, "✗ Server returned error: ${response.code()} - ${response.errorBody()?.string()}")
                }
            }

            override fun onFailure(
                call: retrofit2.Call<IngestResponseDto>,
                t: Throwable
            ) {
                Log.e(TAG, "✗ Failed to send events: ${t.message}", t)
            }
        })
    }

    fun getSessionId(): String = sessionId

    fun startNewSession() {
        sessionId = generateSessionId()
        Log.d(TAG, "New session started: $sessionId")
    }

    private fun generateSessionId(): String {
        return UUID.randomUUID().toString()
    }
}
