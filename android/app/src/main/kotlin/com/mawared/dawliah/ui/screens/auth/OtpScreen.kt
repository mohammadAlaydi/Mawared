package com.mawared.dawliah.ui.screens.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.mawared.dawliah.ui.components.OtpTextField
import com.mawared.dawliah.ui.components.PrimaryButton
import com.mawared.dawliah.ui.theme.*
import com.mawared.dawliah.viewmodel.AuthViewModel
import kotlinx.coroutines.delay

@Composable
fun OtpScreen(
    phone: String,
    viewModel: AuthViewModel,
    onVerified: () -> Unit,
    onBack: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsState()
    var timerSeconds by remember { mutableIntStateOf(59) }
    var canResend by remember { mutableStateOf(false) }

    // Countdown timer
    LaunchedEffect(Unit) {
        while (timerSeconds > 0) {
            delay(1000)
            timerSeconds--
        }
        canResend = true
    }

    // Navigate on verification
    LaunchedEffect(uiState.isVerified) {
        if (uiState.isVerified) {
            delay(500)
            onVerified()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceWhite)
            .padding(horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        // Back button
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 48.dp),
            horizontalArrangement = Arrangement.Start,
        ) {
            IconButton(onClick = onBack) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                    contentDescription = "رجوع",
                    tint = TextPrimary,
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // OTP illustration
        Text(text = "🔐", style = MaterialTheme.typography.displayLarge)

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "رمز التحقق",
            style = MaterialTheme.typography.headlineLarge,
            color = TextPrimary,
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "أدخل الرمز المرسل إلى +966 $phone",
            style = MaterialTheme.typography.bodyLarge,
            color = TextSecondary,
            textAlign = TextAlign.Center,
        )

        Spacer(modifier = Modifier.height(32.dp))

        // OTP input boxes
        OtpTextField(
            onOtpComplete = { code ->
                viewModel.verifyOtp(code)
            },
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Loading indicator
        if (uiState.isVerifying) {
            CircularProgressIndicator(
                color = PrimaryGreen,
                modifier = Modifier.size(32.dp),
                strokeWidth = 3.dp,
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Resend section
        Text(
            text = "لم يصلك الرمز؟",
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
        )

        Spacer(modifier = Modifier.height(8.dp))

        if (canResend) {
            TextButton(onClick = {
                canResend = false
                timerSeconds = 59
                viewModel.sendOtp()
            }) {
                Text(
                    text = "إعادة إرسال الرمز",
                    style = MaterialTheme.typography.labelLarge,
                    color = AccentGold,
                )
            }
        } else {
            Text(
                text = "إعادة الإرسال خلال 00:${String.format("%02d", timerSeconds)}",
                style = MaterialTheme.typography.bodyMedium,
                color = TextHint,
            )
        }
    }
}
