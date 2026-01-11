package com.example.shopflow.ui.theme

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

// Modern dark theme with violet accent
private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF8B5CF6),        // Violet
    onPrimary = Color.White,
    secondary = Color(0xFF6366F1),      // Indigo
    onSecondary = Color.White,
    tertiary = Color(0xFF10B981),       // Emerald for success
    background = Color(0xFF0F172A),     // Slate 900
    surface = Color(0xFF1E293B),        // Slate 800
    surfaceVariant = Color(0xFF334155), // Slate 700
    onBackground = Color.White,
    onSurface = Color.White,
    onSurfaceVariant = Color(0xFF94A3B8), // Slate 400
    error = Color(0xFFEF4444),          // Red
)

@Composable
fun ShopFlowTheme(
    content: @Composable () -> Unit
) {
    val colorScheme = DarkColorScheme
    val view = LocalView.current
    
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}

