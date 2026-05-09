package com.mawared.dawliah.ui.screens.support

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.mawared.dawliah.ui.components.*
import com.mawared.dawliah.ui.theme.*

data class FaqItem(val question: String, val answer: String)

private val faqItems = listOf(
    FaqItem("كيف أطلب عاملة منزلية؟", "افتح التطبيق، اختر خدمة عاملة منزلية، حدد الباقة المناسبة، ثم أكمل بيانات الطلب والدفع."),
    FaqItem("هل يمكنني إلغاء الطلب؟", "نعم، يمكنك إلغاء الطلب خلال 24 ساعة من تقديمه بدون أي رسوم. بعد ذلك قد تطبق رسوم إلغاء."),
    FaqItem("كم تستغرق عملية التحقق؟", "عادةً ما تستغرق عملية التحقق من الهوية من دقائق إلى ساعات عبر منصة Signit.sa."),
    FaqItem("ما هي طرق الدفع المتاحة؟", "نقبل الدفع عبر البطاقات البنكية (فيزا/ماستركارد) وقريباً Apple Pay والتقسيط عبر تابي."),
    FaqItem("هل العمالة مدربة ومعتمدة؟", "نعم، جميع العمال يخضعون لعملية فحص شاملة وتدريب مهني قبل إدراجهم في المنصة."),
)

@Composable
fun SupportScreen(
    onBack: () -> Unit,
) {
    var showComplaintForm by remember { mutableStateOf(false) }
    var complaintSent by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier.fillMaxSize().background(BackgroundWarm),
    ) {
        MawaredTopBar(title = "الدعم والمساعدة", onBackClick = onBack)

        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            // Contact options
            item {
                Text("تواصل معنا", style = MaterialTheme.typography.headlineMedium, color = TextPrimary)
            }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    ContactCard(icon = Icons.Filled.Phone, label = "اتصال", value = "920012345", modifier = Modifier.weight(1f))
                    ContactCard(icon = Icons.Filled.Email, label = "بريد", value = "info@mawared.sa", modifier = Modifier.weight(1f))
                }
            }

            // FAQ
            item {
                Spacer(Modifier.height(8.dp))
                Text("الأسئلة الشائعة", style = MaterialTheme.typography.headlineMedium, color = TextPrimary)
            }
            items(faqItems) { faq ->
                FaqCard(faq)
            }

            // Complaint
            item {
                Spacer(Modifier.height(16.dp))
                PrimaryButton(
                    text = if (complaintSent) "تم إرسال شكواك ✓" else "إرسال شكوى",
                    onClick = { showComplaintForm = true },
                    enabled = !complaintSent,
                )
            }
        }
    }

    if (showComplaintForm) {
        ComplaintDialog(
            onDismiss = { showComplaintForm = false },
            onSubmit = { showComplaintForm = false; complaintSent = true },
        )
    }
}

@Composable
private fun ContactCard(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, value: String, modifier: Modifier = Modifier) {
    Card(
        shape = RoundedCornerShape(CornerMedium),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        modifier = modifier,
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Icon(icon, null, tint = PrimaryGreen, modifier = Modifier.size(28.dp))
            Spacer(Modifier.height(8.dp))
            Text(label, style = MaterialTheme.typography.titleMedium, color = TextPrimary)
            Text(value, style = MaterialTheme.typography.labelSmall, color = TextSecondary)
        }
    }
}

@Composable
private fun FaqCard(faq: FaqItem) {
    var isExpanded by remember { mutableStateOf(false) }

    Card(
        shape = RoundedCornerShape(CornerMedium),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        modifier = Modifier.fillMaxWidth().clickable { isExpanded = !isExpanded },
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(faq.question, style = MaterialTheme.typography.titleMedium, color = TextPrimary, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                Icon(
                    imageVector = if (isExpanded) Icons.Filled.ExpandLess else Icons.Filled.ExpandMore,
                    contentDescription = null,
                    tint = PrimaryGreen,
                )
            }
            AnimatedVisibility(visible = isExpanded) {
                Text(
                    faq.answer,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary,
                    modifier = Modifier.padding(top = 8.dp),
                )
            }
        }
    }
}

@Composable
private fun ComplaintDialog(onDismiss: () -> Unit, onSubmit: () -> Unit) {
    var type by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("إرسال شكوى") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = type, onValueChange = { type = it }, label = { Text("نوع الشكوى") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = description, onValueChange = { description = it }, label = { Text("وصف الشكوى") }, minLines = 3, modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = {
            TextButton(onClick = onSubmit, enabled = type.isNotBlank() && description.isNotBlank()) {
                Text("إرسال", color = PrimaryGreen)
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("إلغاء", color = TextSecondary) } },
    )
}
