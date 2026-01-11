package com.example.sdkhost

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import com.example.analytics.AnalyticsSDK


class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        Log.d("SDK_TEST", "MainActivity started")

//        AnalyticsSDK.init(
//            context = this,
//            apiKey = "pk_test_123",
//            endpoint = "http://192.168.1.202:8000/"
//        )

//        AnalyticsSDK.track(
//            "sdk_integration_test",
//            mapOf("from" to "host_app")
//        )
//        AnalyticsSDK.track(
//            "puk",
//            mapOf("from" to "host_app")
//        )


        AnalyticsSDK.flush()
    }
}