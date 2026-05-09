package com.mawared.dawliah.ui.screens.order

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.mawared.dawliah.ui.components.*
import com.mawared.dawliah.ui.theme.*

/**
 * Order success screen with animation, order number, and navigation options.
 */
@Composable
fun OrderSuccessScreen(
    orderId: String,
    onTrackOrder: () -> Unit,
    onGoHome: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceWhite)
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        // Success animation placeholder
        Text(text = "✅", style = MaterialTheme.typography.displayLarge)

        Spacer(Modifier.height(24.dp))

        Text(
            text = "تم إرسال طلبك بنجاح! 🎉",
            style = MaterialTheme.typography.headlineLarge,
            color = TextPrimary,
            textAlign = TextAlign.Center,
        )

        Spacer(Modifier.height(12.dp))

        Text(
            text = "رقم الطلب: $orderId",
            style = MaterialTheme.typography.titleLarge,
            color = AccentGold,
            textAlign = TextAlign.Center,
        )

        Spacer(Modifier.height(8.dp))

        Text(
            text = "سيتصل بك فريقنا خلال 24 ساعة لتأكيد الطلب",
            style = MaterialTheme.typography.bodyLarge,
            color = TextSecondary,
            textAlign = TextAlign.Center,
        )

        Spacer(Modifier.height(40.dp))

        PrimaryButton(
            text = "تتبع طلبي",
            onClick = onTrackOrder,
        )

        Spacer(Modifier.height(12.dp))

        SecondaryButton(
            text = "العودة للرئيسية",
            onClick = onGoHome,
        )
    }
}
