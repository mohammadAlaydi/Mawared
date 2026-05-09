package com.mawared.dawliah.ui.screens.order

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.mawared.dawliah.ui.components.*
import com.mawared.dawliah.ui.theme.*
import com.mawared.dawliah.viewmodel.OrderViewModel

/** Order Step Progress Indicator. */
@Composable
fun OrderStepIndicator(currentStep: Int) {
    val steps = listOf("الخدمة", "العنوان", "المراجعة", "الدفع")
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(SurfaceWhite)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        steps.forEachIndexed { index, step ->
            val isCompleted = index < currentStep
            val isCurrent = index == currentStep
            val color = when {
                isCompleted -> StatusSuccess
                isCurrent -> PrimaryGreen
                else -> TextHint
            }

            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(RoundedCornerShape(50))
                        .background(if (isCompleted || isCurrent) color else color.copy(alpha = 0.3f)),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        text = if (isCompleted) "✓" else "${index + 1}",
                        style = MaterialTheme.typography.labelMedium,
                        color = SurfaceWhite,
                    )
                }
                Text(
                    text = step,
                    style = MaterialTheme.typography.labelSmall,
                    color = color,
                    modifier = Modifier.padding(top = 4.dp),
                )
            }
        }
    }
}

/** Step 1 — Service Summary. */
@Composable
fun OrderStep1Screen(
    orderViewModel: OrderViewModel,
    onNext: () -> Unit,
    onBack: () -> Unit,
) {
    val uiState by orderViewModel.uiState.collectAsState()

    Column(modifier = Modifier.fillMaxSize().background(BackgroundWarm)) {
        MawaredTopBar(title = "تأكيد الخدمة", onBackClick = onBack)
        OrderStepIndicator(currentStep = 0)

        Column(modifier = Modifier.padding(16.dp).weight(1f)) {
            // Service card
            Card(
                shape = RoundedCornerShape(CornerMedium),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("الخدمة المختارة", style = MaterialTheme.typography.labelLarge, color = TextSecondary)
                    Text(uiState.selectedService?.nameAr ?: "-", style = MaterialTheme.typography.headlineMedium, color = TextPrimary)
                }
            }

            Spacer(Modifier.height(12.dp))

            // Package card
            Card(
                shape = RoundedCornerShape(CornerMedium),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("الباقة", style = MaterialTheme.typography.labelLarge, color = TextSecondary)
                    Text(uiState.selectedPackage?.nameAr ?: "-", style = MaterialTheme.typography.headlineMedium, color = TextPrimary)
                    Spacer(Modifier.height(4.dp))
                    Text("${"%,d".format(uiState.selectedPackage?.price ?: 0)} ريال", style = MaterialTheme.typography.titleLarge, color = PrimaryGreen)
                }
            }

            Spacer(Modifier.height(12.dp))

            // Worker info
            Card(
                shape = RoundedCornerShape(CornerMedium),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("العامل", style = MaterialTheme.typography.labelLarge, color = TextSecondary)
                    Text(
                        uiState.selectedWorker?.nameAr ?: "سيتم اختيار العامل لاحقاً",
                        style = MaterialTheme.typography.titleMedium,
                        color = if (uiState.selectedWorker != null) TextPrimary else TextHint,
                    )
                }
            }
        }

        PrimaryButton(
            text = "التالي",
            onClick = { orderViewModel.setStep(1); onNext() },
            modifier = Modifier.padding(16.dp),
        )
    }
}

/** Step 2 — Address Selection. */
@Composable
fun OrderStep2Screen(
    orderViewModel: OrderViewModel,
    onNext: () -> Unit,
    onBack: () -> Unit,
) {
    val uiState by orderViewModel.uiState.collectAsState()

    Column(modifier = Modifier.fillMaxSize().background(BackgroundWarm)) {
        MawaredTopBar(title = "اختر العنوان", onBackClick = onBack)
        OrderStepIndicator(currentStep = 1)

        Column(modifier = Modifier.padding(16.dp).weight(1f)) {
            uiState.savedAddresses.forEach { address ->
                val isSelected = uiState.selectedAddress?.id == address.id
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 6.dp),
                    shape = RoundedCornerShape(CornerMedium),
                    border = if (isSelected) androidx.compose.foundation.BorderStroke(2.dp, PrimaryGreen) else null,
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    onClick = { orderViewModel.selectAddress(address) },
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        RadioButton(
                            selected = isSelected,
                            onClick = { orderViewModel.selectAddress(address) },
                            colors = RadioButtonDefaults.colors(selectedColor = PrimaryGreen),
                        )
                        Spacer(Modifier.width(8.dp))
                        Column {
                            Text(address.label, style = MaterialTheme.typography.titleMedium, color = TextPrimary, fontWeight = FontWeight.SemiBold)
                            Text("${address.district}، ${address.street}", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                            Text(address.city, style = MaterialTheme.typography.labelMedium, color = TextHint)
                        }
                    }
                }
            }

            Spacer(Modifier.height(12.dp))

            // Notes field
            OutlinedTextField(
                value = uiState.notes,
                onValueChange = { orderViewModel.updateNotes(it) },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("ملاحظات إضافية للعامل") },
                shape = RoundedCornerShape(CornerMedium),
                minLines = 3,
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PrimaryGreen, cursorColor = PrimaryGreen),
            )
        }

        PrimaryButton(
            text = "التالي",
            onClick = { orderViewModel.setStep(2); onNext() },
            enabled = uiState.selectedAddress != null,
            modifier = Modifier.padding(16.dp),
        )
    }
}

/** Step 3 — Order Review. */
@Composable
fun OrderStep3Screen(
    orderViewModel: OrderViewModel,
    onNext: () -> Unit,
    onBack: () -> Unit,
) {
    val uiState by orderViewModel.uiState.collectAsState()
    var promoInput by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize().background(BackgroundWarm)) {
        MawaredTopBar(title = "مراجعة الطلب", onBackClick = onBack)
        OrderStepIndicator(currentStep = 2)

        Column(modifier = Modifier.padding(16.dp).weight(1f)) {
            // Summary card
            Card(
                shape = RoundedCornerShape(CornerMedium),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    SummaryRow("الخدمة", uiState.selectedService?.nameAr ?: "-")
                    SummaryRow("الباقة", uiState.selectedPackage?.nameAr ?: "-")
                    SummaryRow("العامل", uiState.selectedWorker?.nameAr ?: "سيتم الاختيار")
                    SummaryRow("العنوان", "${uiState.selectedAddress?.label ?: "-"} - ${uiState.selectedAddress?.city ?: ""}")
                    if (uiState.notes.isNotBlank()) {
                        SummaryRow("ملاحظات", uiState.notes)
                    }
                }
            }

            Spacer(Modifier.height(12.dp))

            // Promo code
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                OutlinedTextField(
                    value = promoInput,
                    onValueChange = { promoInput = it },
                    modifier = Modifier.weight(1f),
                    label = { Text("كود الخصم") },
                    singleLine = true,
                    shape = RoundedCornerShape(CornerMedium),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PrimaryGreen),
                )
                Button(
                    onClick = { orderViewModel.applyPromo(promoInput) },
                    shape = RoundedCornerShape(CornerMedium),
                    colors = ButtonDefaults.buttonColors(containerColor = AccentGold),
                    modifier = Modifier.height(56.dp),
                ) {
                    Text("تطبيق")
                }
            }

            Spacer(Modifier.height(16.dp))

            // Price breakdown
            Card(
                shape = RoundedCornerShape(CornerMedium),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    PriceRow("سعر الباقة", "${"%,d".format(uiState.selectedPackage?.price ?: 0)} ريال")
                    PriceRow("رسوم الخدمة", "${uiState.serviceFee} ريال")
                    if (uiState.promoDiscount > 0) {
                        PriceRow("خصم الكود", "-${uiState.promoDiscount}%", color = StatusSuccess)
                    }
                    HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("الإجمالي", style = MaterialTheme.typography.headlineMedium, color = TextPrimary)
                        Text("${"%,d".format(orderViewModel.totalPrice)} ريال", style = MaterialTheme.typography.headlineMedium, color = PrimaryGreen, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(Modifier.height(12.dp))

            // Terms checkbox
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(
                    checked = uiState.agreedToTerms,
                    onCheckedChange = { orderViewModel.toggleTerms() },
                    colors = CheckboxDefaults.colors(checkedColor = PrimaryGreen),
                )
                Text("أوافق على الشروط والأحكام", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
            }
        }

        PrimaryButton(
            text = "تأكيد الطلب",
            onClick = { orderViewModel.setStep(3); onNext() },
            enabled = uiState.agreedToTerms,
            modifier = Modifier.padding(16.dp),
        )
    }
}

/** Step 4 — Payment. */
@Composable
fun OrderStep4Screen(
    orderViewModel: OrderViewModel,
    onPaymentComplete: () -> Unit,
    onBack: () -> Unit,
) {
    val uiState by orderViewModel.uiState.collectAsState()

    val paymentOptions = listOf(
        Triple("card", "💳 بطاقة بنكية", true),
        Triple("apple_pay", "📱 Apple Pay", false),
        Triple("tabby", "💰 التقسيط — 4 أقساط بدون فوائد", true),
    )

    Column(modifier = Modifier.fillMaxSize().background(BackgroundWarm)) {
        MawaredTopBar(title = "طريقة الدفع", onBackClick = onBack)
        OrderStepIndicator(currentStep = 3)

        Column(modifier = Modifier.padding(16.dp).weight(1f)) {
            paymentOptions.forEach { (key, label, enabled) ->
                val isSelected = uiState.selectedPayment == key
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 6.dp),
                    shape = RoundedCornerShape(CornerMedium),
                    border = if (isSelected) androidx.compose.foundation.BorderStroke(2.dp, PrimaryGreen) else null,
                    colors = CardDefaults.cardColors(
                        containerColor = if (enabled) SurfaceWhite else SurfaceCard,
                    ),
                    onClick = { if (enabled) orderViewModel.selectPayment(key) },
                    enabled = enabled,
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        RadioButton(
                            selected = isSelected,
                            onClick = { if (enabled) orderViewModel.selectPayment(key) },
                            enabled = enabled,
                            colors = RadioButtonDefaults.colors(selectedColor = PrimaryGreen),
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(
                            text = label,
                            style = MaterialTheme.typography.titleMedium,
                            color = if (enabled) TextPrimary else TextHint,
                        )
                        if (!enabled) {
                            Spacer(Modifier.width(8.dp))
                            Text("قريباً", style = MaterialTheme.typography.labelSmall, color = TextHint)
                        }
                    }
                }
            }
        }

        PrimaryButton(
            text = "ادفع الآن — ${"%,d".format(orderViewModel.totalPrice)} ريال",
            onClick = {
                orderViewModel.placeOrder()
                onPaymentComplete()
            },
            isLoading = uiState.isProcessing,
            modifier = Modifier.padding(16.dp),
        )
    }
}

@Composable
private fun SummaryRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
        Text(value, style = MaterialTheme.typography.bodyMedium, color = TextPrimary, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun PriceRow(label: String, value: String, color: androidx.compose.ui.graphics.Color = TextPrimary) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
        Text(value, style = MaterialTheme.typography.bodyMedium, color = color)
    }
}
