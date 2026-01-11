package com.example.shopflow

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.analytics.AnalyticsSDK
import com.example.shopflow.ui.screens.CartScreen
import com.example.shopflow.ui.screens.CheckoutScreen
import com.example.shopflow.ui.screens.HomeScreen
import com.example.shopflow.ui.screens.ProductDetailScreen
import com.example.shopflow.ui.theme.ShopFlowTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        // Initialize the Analytics SDK with your API key and backend URL
        AnalyticsSDK.init(
            context = this,
            apiKey = "shopflow_demo", // Your API key
            endpoint = "https://user-behavior-analytics-production.up.railway.app/"
        )
        
        // Track app open event
        AnalyticsSDK.track("app_open", mapOf("launch_source" to "direct"))
        
        setContent {
            ShopFlowTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    ShopFlowApp()
                }
            }
        }
    }
    
    override fun onStop() {
        super.onStop()
        // Flush any pending events when app goes to background
        AnalyticsSDK.flush()
    }
}

@Composable
fun ShopFlowApp() {
    val navController = rememberNavController()
    
    NavHost(
        navController = navController,
        startDestination = "home"
    ) {
        composable("home") {
            HomeScreen(
                onProductClick = { productId ->
                    navController.navigate("product/$productId")
                },
                onCartClick = {
                    navController.navigate("cart")
                }
            )
        }
        
        composable("product/{productId}") { backStackEntry ->
            val productId = backStackEntry.arguments?.getString("productId") ?: ""
            ProductDetailScreen(
                productId = productId,
                onBackClick = { navController.popBackStack() },
                onCartClick = { navController.navigate("cart") }
            )
        }
        
        composable("cart") {
            CartScreen(
                onBackClick = { navController.popBackStack() },
                onCheckoutClick = { navController.navigate("checkout") }
            )
        }
        
        composable("checkout") {
            CheckoutScreen(
                onBackClick = { navController.popBackStack() },
                onOrderComplete = {
                    // Navigate back to home and clear the back stack
                    navController.navigate("home") {
                        popUpTo("home") { inclusive = true }
                    }
                }
            )
        }
    }
}
