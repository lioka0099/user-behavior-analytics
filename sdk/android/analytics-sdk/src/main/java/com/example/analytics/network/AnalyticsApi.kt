package com.example.analytics.network

import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.POST

interface AnalyticsApi {

    @POST("/events")
    fun sendEvents(
        @Body batch: EventBatchDto
    ): Call<Unit>
}