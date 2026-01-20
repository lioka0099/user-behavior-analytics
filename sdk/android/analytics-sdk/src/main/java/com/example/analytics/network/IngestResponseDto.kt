package com.example.analytics.network

/**
 * Response shape from backend `POST /events`.
 *
 * Backend returns:
 *   { "status": "ok", "ingested": <number> }
 */
data class IngestResponseDto(
    val status: String,
    val ingested: Int
)

