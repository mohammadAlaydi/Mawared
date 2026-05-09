package com.mawared.dawliah.ui.screens.offers

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mawared.dawliah.data.mock.MockOffers
import com.mawared.dawliah.data.model.Offer
import com.mawared.dawliah.ui.components.MawaredTopBar
import com.mawared.dawliah.ui.theme.*

@Composable
fun OffersScreen() {
    val offers = MockOffers.all
    val activeOffers = offers.filter { it.isActive }
    val expiredOffers = offers.filter { !it.isActive }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundWarm),
    ) {
        MawaredTopBar(title = "العروض والخصومات")

        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            // Active offers header
            item {
                Text(
                    text = "العروض النشطة (${activeOffers.size})",
                    style = MaterialTheme.typography.headlineMedium,
                    color = TextPrimary,
                )
            }

            items(activeOffers) { offer ->
                OfferCard(offer = offer)
            }

            // Expired offers
            if (expiredOffers.isNotEmpty()) {
                item {
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = "عروض منتهية",
                        style = MaterialTheme.typography.titleMedium,
                        color = TextHint,
                    )
                }
                items(expiredOffers) { offer ->
                    OfferCard(offer = offer)
                }
            }
        }
    }
}

@Composable
private fun OfferCard(offer: Offer) {
    val clipboardManager = LocalClipboardManager.current
    var showCopied by remember { mutableStateOf(false) }

    val gradientColors = if (offer.isActive) {
        listOf(PrimaryGreen, PrimaryGreenLight)
    } else {
        listOf(TextHint, TextSecondary)
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(CornerLarge),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
    ) {
        Column {
            // Gradient header
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Brush.linearGradient(gradientColors))
                    .padding(20.dp),
            ) {
                Column {
                    // Badge
                    if (offer.badgeText != null) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(CornerPill))
                                .background(AccentGold)
                                .padding(horizontal = 10.dp, vertical = 3.dp),
                        ) {
                            Text(
                                text = offer.badgeText,
                                style = MaterialTheme.typography.labelSmall,
                                color = TextPrimary,
                                fontWeight = FontWeight.Bold,
                            )
                        }
                        Spacer(Modifier.height(8.dp))
                    }

                    // Discount percentage
                    Text(
                        text = "${offer.discountPercent}%",
                        style = MaterialTheme.typography.displayMedium,
                        color = SurfaceWhite,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = offer.titleAr,
                        style = MaterialTheme.typography.titleLarge,
                        color = SurfaceWhite,
                        lineHeight = 26.sp,
                    )
                }
            }

            // Details section
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = offer.descriptionAr,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary,
                )

                Spacer(Modifier.height(12.dp))

                // Promo code chip
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    // Code display
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(CornerMedium))
                            .background(PrimaryGreen.copy(alpha = 0.08f))
                            .padding(horizontal = 16.dp, vertical = 10.dp),
                    ) {
                        Text(
                            text = offer.promoCode,
                            style = MaterialTheme.typography.titleMedium,
                            color = PrimaryGreen,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 2.sp,
                        )
                    }

                    // Copy button
                    OutlinedButton(
                        onClick = {
                            clipboardManager.setText(AnnotatedString(offer.promoCode))
                            showCopied = true
                        },
                        shape = RoundedCornerShape(CornerMedium),
                        enabled = offer.isActive,
                    ) {
                        Icon(
                            Icons.Filled.ContentCopy,
                            contentDescription = "نسخ",
                            modifier = Modifier.size(16.dp),
                        )
                        Spacer(Modifier.width(4.dp))
                        Text(if (showCopied) "تم النسخ ✓" else "نسخ الكود")
                    }
                }

                Spacer(Modifier.height(8.dp))

                // Expiry date
                Text(
                    text = if (offer.isActive) "صالح حتى: ${offer.expiryDate}" else "انتهى بتاريخ: ${offer.expiryDate}",
                    style = MaterialTheme.typography.labelSmall,
                    color = if (offer.isActive) TextHint else StatusError,
                )
            }
        }
    }
}
