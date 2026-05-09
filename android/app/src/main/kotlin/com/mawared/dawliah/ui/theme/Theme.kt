package com.mawared.dawliah.ui.theme

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.LayoutDirection
import androidx.core.view.WindowCompat

/**
 * Mawared Al Dawliah — Light-only color scheme.
 * Premium Saudi brand: deep teal + warm gold.
 */
private val MawaredColorScheme = lightColorScheme(
    primary = PrimaryGreen,
    onPrimary = SurfaceWhite,
    primaryContainer = PrimaryGreenLight,
    onPrimaryContainer = SurfaceWhite,
    secondary = AccentGold,
    onSecondary = TextPrimary,
    secondaryContainer = AccentGoldLight,
    onSecondaryContainer = TextPrimary,
    tertiary = StatusInfo,
    onTertiary = SurfaceWhite,
    background = BackgroundWarm,
    onBackground = TextPrimary,
    surface = SurfaceWhite,
    onSurface = TextPrimary,
    surfaceVariant = SurfaceCard,
    onSurfaceVariant = TextSecondary,
    error = StatusError,
    onError = SurfaceWhite,
    outline = TextHint,
    outlineVariant = ShimmerBase,
)

@Composable
fun MawaredTheme(
    content: @Composable () -> Unit
) {
    val colorScheme = MawaredColorScheme
    val view = LocalView.current

    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            @Suppress("DEPRECATION")
            window.statusBarColor = PrimaryGreenDark.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }

    // Force RTL layout direction globally for Arabic-first app
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = MawaredTypography,
            shapes = MawaredShapes,
            content = content,
        )
    }
}
