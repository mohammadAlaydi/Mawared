package com.mawared.dawliah.ui.screens.splash

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mawared.dawliah.R
import com.mawared.dawliah.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Premium splash screen with brand logo asset, particle-like shimmer,
 * and smooth spring-based animations.
 */
@Composable
fun SplashScreen(
    onNavigateToOnboarding: () -> Unit,
    onNavigateToHome: () -> Unit,
    isLoggedIn: Boolean = false,
) {
    // Phase 1: Logo entrance with spring physics
    val logoScale = remember { Animatable(0f) }
    val logoAlpha = remember { Animatable(0f) }
    val logoTranslateY = remember { Animatable(60f) }

    // Phase 2: Tagline slide-up
    val taglineAlpha = remember { Animatable(0f) }
    val taglineTranslateY = remember { Animatable(30f) }

    // Phase 3: Subtle infinite glow pulse on logo
    val infiniteTransition = rememberInfiniteTransition(label = "glow")
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.15f,
        targetValue = 0.35f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = EaseInOutCubic),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "glow_alpha",
    )

    LaunchedEffect(Unit) {
        // Logo entrance: spring physics for organic feel
        launch {
            logoScale.animateTo(
                targetValue = 1f,
                animationSpec = spring(
                    dampingRatio = Spring.DampingRatioMediumBouncy,
                    stiffness = Spring.StiffnessLow,
                ),
            )
        }
        launch {
            logoTranslateY.animateTo(
                targetValue = 0f,
                animationSpec = spring(
                    dampingRatio = Spring.DampingRatioLowBouncy,
                    stiffness = Spring.StiffnessMediumLow,
                ),
            )
        }
        logoAlpha.animateTo(1f, animationSpec = tween(600, easing = EaseOutCubic))

        delay(400)

        // Tagline entrance
        launch {
            taglineTranslateY.animateTo(
                targetValue = 0f,
                animationSpec = tween(500, easing = EaseOutCubic),
            )
        }
        taglineAlpha.animateTo(1f, animationSpec = tween(500, easing = EaseOutCubic))

        delay(1800)
        if (isLoggedIn) onNavigateToHome() else onNavigateToOnboarding()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        PrimaryGreen,
                        PrimaryGreenLight.copy(alpha = 0.95f),
                        PrimaryGreen.copy(alpha = 0.85f),
                    ),
                )
            ),
        contentAlignment = Alignment.Center,
    ) {
        // Subtle radial glow behind logo
        Box(
            modifier = Modifier
                .size(280.dp)
                .alpha(glowAlpha)
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            SurfaceWhite.copy(alpha = 0.3f),
                            SurfaceWhite.copy(alpha = 0f),
                        ),
                    )
                ),
        )

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.graphicsLayer {
                scaleX = logoScale.value
                scaleY = logoScale.value
                translationY = logoTranslateY.value
                alpha = logoAlpha.value
            },
        ) {
            // Brand logo image from drawable — clean Arabic logo
            Image(
                painter = painterResource(id = R.drawable.mawared_logo_clean),
                contentDescription = "شعار موارد الدولية",
                contentScale = ContentScale.Fit,
                modifier = Modifier
                    .width(300.dp)
                    .height(200.dp),
            )
        }

        // Tagline at bottom
        Text(
            text = "خدمك، راحتك",
            fontFamily = CairoFamily,
            fontWeight = FontWeight.Normal,
            fontSize = 18.sp,
            color = SurfaceWhite.copy(alpha = 0.9f),
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 80.dp)
                .graphicsLayer {
                    translationY = taglineTranslateY.value
                    alpha = taglineAlpha.value
                },
        )
    }
}
