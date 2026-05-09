package com.mawared.dawliah.ui.screens.verification

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
import com.mawared.dawliah.viewmodel.ProfileViewModel
import com.mawared.dawliah.viewmodel.VerificationStatus

@Composable
fun VerificationScreen(
    viewModel: ProfileViewModel,
    onBack: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier.fillMaxSize().background(SurfaceWhite),
    ) {
        MawaredTopBar(title = "تحقق من الهوية", onBackClick = onBack)

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            when (uiState.verificationStatus) {
                VerificationStatus.NOT_VERIFIED -> {
                    Text("🪪", style = MaterialTheme.typography.displayLarge)
                    Spacer(Modifier.height(24.dp))
                    Text("لم يتم التحقق من هويتك", style = MaterialTheme.typography.headlineLarge, color = TextPrimary, textAlign = TextAlign.Center)
                    Spacer(Modifier.height(12.dp))
                    Text("يجب التحقق من هويتك قبل تقديم أول طلب عبر منصة Signit.sa", style = MaterialTheme.typography.bodyLarge, color = TextSecondary, textAlign = TextAlign.Center)
                    Spacer(Modifier.height(32.dp))
                    PrimaryButton(text = "ابدأ التحقق الآن", onClick = { viewModel.startVerification() })
                }
                VerificationStatus.PENDING -> {
                    Text("⏳", style = MaterialTheme.typography.displayLarge)
                    Spacer(Modifier.height(24.dp))
                    Text("التحقق قيد المعالجة", style = MaterialTheme.typography.headlineLarge, color = TextPrimary, textAlign = TextAlign.Center)
                    Spacer(Modifier.height(12.dp))
                    Text("نحن نراجع معلوماتك، عادةً ما تستغرق هذه العملية من دقائق إلى ساعات", style = MaterialTheme.typography.bodyLarge, color = TextSecondary, textAlign = TextAlign.Center)
                    Spacer(Modifier.height(32.dp))
                    SecondaryButton(text = "تحديث الحالة", onClick = { viewModel.setVerified() })
                }
                VerificationStatus.VERIFIED -> {
                    Text("✅", style = MaterialTheme.typography.displayLarge)
                    Spacer(Modifier.height(24.dp))
                    Text("تم التحقق من هويتك ✓", style = MaterialTheme.typography.headlineLarge, color = StatusSuccess, textAlign = TextAlign.Center)
                    Spacer(Modifier.height(12.dp))
                    AssistChip(
                        onClick = {},
                        label = { Text("تم التحقق", style = MaterialTheme.typography.labelLarge) },
                        leadingIcon = { Text("✓") },
                    )
                }
                VerificationStatus.FAILED -> {
                    Text("❌", style = MaterialTheme.typography.displayLarge)
                    Spacer(Modifier.height(24.dp))
                    Text("فشل التحقق", style = MaterialTheme.typography.headlineLarge, color = StatusError, textAlign = TextAlign.Center)
                    Spacer(Modifier.height(12.dp))
                    Text("يرجى المحاولة مجدداً أو التواصل مع الدعم", style = MaterialTheme.typography.bodyLarge, color = TextSecondary, textAlign = TextAlign.Center)
                    Spacer(Modifier.height(32.dp))
                    PrimaryButton(text = "إعادة المحاولة", onClick = { viewModel.startVerification() })
                }
            }
        }
    }
}
