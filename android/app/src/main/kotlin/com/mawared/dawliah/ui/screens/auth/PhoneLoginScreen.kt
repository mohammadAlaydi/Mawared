package com.mawared.dawliah.ui.screens.auth

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.mawared.dawliah.R
import com.mawared.dawliah.ui.components.PhoneTextField
import com.mawared.dawliah.ui.components.PrimaryButton
import com.mawared.dawliah.ui.theme.*
import com.mawared.dawliah.viewmodel.AuthViewModel
import kotlinx.coroutines.launch

@Composable
fun PhoneLoginScreen(
    viewModel: AuthViewModel,
    onOtpSent: (String) -> Unit,
) {
    val uiState by viewModel.uiState.collectAsState()
    var phone by remember { mutableStateOf("") }
    val isValid = phone.length == 9

    // Entrance animations
    val logoAlpha = remember { Animatable(0f) }
    val logoTranslateY = remember { Animatable(-40f) }
    val contentAlpha = remember { Animatable(0f) }
    val contentTranslateY = remember { Animatable(30f) }

    LaunchedEffect(Unit) {
        // Logo drops in
        launch {
            logoAlpha.animateTo(1f, tween(600, easing = EaseOutCubic))
        }
        logoTranslateY.animateTo(
            0f,
            spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMediumLow),
        )

        // Content slides up
        launch {
            contentAlpha.animateTo(1f, tween(500, easing = EaseOutCubic))
        }
        contentTranslateY.animateTo(
            0f,
            tween(500, easing = EaseOutCubic),
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceWhite)
            .padding(horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(modifier = Modifier.height(60.dp))

        // Brand logo image with entrance animation
        Image(
            painter = painterResource(id = R.drawable.mawared_logo_clean),
            contentDescription = "شعار موارد الدولية",
            contentScale = ContentScale.Fit,
            modifier = Modifier
                .width(240.dp)
                .height(130.dp)
                .graphicsLayer {
                    translationY = logoTranslateY.value
                    alpha = logoAlpha.value
                },
        )

        Spacer(modifier = Modifier.height(40.dp))

        // Content with slide-up entrance
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.graphicsLayer {
                translationY = contentTranslateY.value
                alpha = contentAlpha.value
            },
        ) {
            // Title
            Text(
                text = "أدخل رقم جوالك",
                style = MaterialTheme.typography.headlineLarge,
                color = TextPrimary,
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "سنرسل لك رمز التحقق عبر SMS",
                style = MaterialTheme.typography.bodyLarge,
                color = TextSecondary,
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Phone input
            PhoneTextField(
                value = phone,
                onValueChange = { phone = it },
                isError = uiState.error != null,
                errorMessage = uiState.error,
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Send OTP button with animated visibility
            AnimatedVisibility(
                visible = true,
                enter = fadeIn() + slideInVertically { it / 2 },
            ) {
                PrimaryButton(
                    text = "إرسال رمز التحقق",
                    onClick = {
                        viewModel.updatePhone(phone)
                        viewModel.sendOtp()
                        onOtpSent(phone)
                    },
                    enabled = isValid,
                    isLoading = uiState.isVerifying,
                )
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        // Terms footer
        Text(
            text = "بالمتابعة، أنت توافق على شروط الاستخدام وسياسة الخصوصية",
            style = MaterialTheme.typography.labelMedium,
            color = TextHint,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(bottom = 32.dp),
        )
    }
}
