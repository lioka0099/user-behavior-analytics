package com.example.analytics.network

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {

    private var retrofit: Retrofit? = null
    private var currentBaseUrl: String? = null

    fun getApi(baseUrl: String): AnalyticsApi {
        // Rebuild Retrofit if base URL changes (e.g., switching from local → prod).
        if (retrofit == null || currentBaseUrl != baseUrl) {
            retrofit = Retrofit.Builder()
                .baseUrl(baseUrl)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
            currentBaseUrl = baseUrl
        }
        return retrofit!!.create(AnalyticsApi::class.java)
    }
}