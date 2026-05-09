package com.mawared.dawliah.ui.screens.more

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.automirrored.filled.NoteAdd
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.mawared.dawliah.R
import com.mawared.dawliah.ui.theme.*
import com.mawared.dawliah.viewmodel.AuthViewModel
import com.mawared.dawliah.viewmodel.ProfileViewModel
import com.mawared.dawliah.viewmodel.VerificationStatus

/**
 * "المزيد" (More) screen — consolidation of profile + settings.
 * Replaces old Profile tab to match عون's bottom nav pattern.
 */
@Composable
fun MoreScreen(
    profileViewModel: ProfileViewModel,
    authViewModel: AuthViewModel,
    onEditProfile: () -> Unit,
    onSaveList: () -> Unit,
    onSavedAddresses: () -> Unit,
    onNotifications: () -> Unit,
    onWorkers: () -> Unit,
    onVerification: () -> Unit,
    onServiceRequest: () -> Unit,
    onSupport: () -> Unit,
    onTerms: () -> Unit,
    onPrivacy: () -> Unit,
    onLogout: () -> Unit,
) {
    val profileState by profileViewModel.uiState.collectAsState()
    var showLogoutDialog by remember { mutableStateOf(false) }
    var showRatingDialog by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundWarm),
    ) {
        // Profile header
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(PrimaryGreen, PrimaryGreenLight)
                        )
                    )
                    .padding(top = 48.dp, bottom = 24.dp),
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    // Brand logo
                    Image(
                        painter = androidx.compose.ui.res.painterResource(id = R.drawable.mawared_logo_clean),
                        contentDescription = "موارد",
                        contentScale = ContentScale.Fit,
                        modifier = Modifier
                            .height(40.dp)
                            .padding(bottom = 12.dp),
                    )

                    Box {
                        AsyncImage(
                            model = profileState.avatarUrl,
                            contentDescription = "الصورة الشخصية",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .size(80.dp)
                                .clip(CircleShape),
                        )
                        Icon(
                            imageVector = Icons.Filled.CameraAlt,
                            contentDescription = "تعديل الصورة",
                            tint = SurfaceWhite,
                            modifier = Modifier
                                .size(24.dp)
                                .align(Alignment.BottomEnd)
                                .clip(CircleShape)
                                .background(AccentGold)
                                .padding(4.dp),
                        )
                    }

                    Spacer(Modifier.height(12.dp))

                    Text(
                        text = profileState.userName,
                        style = MaterialTheme.typography.headlineMedium,
                        color = SurfaceWhite,
                    )
                    Text(
                        text = profileState.phoneNumber,
                        style = MaterialTheme.typography.bodyMedium,
                        color = SurfaceWhite.copy(alpha = 0.8f),
                    )

                    Spacer(Modifier.height(12.dp))

                    OutlinedButton(
                        onClick = onEditProfile,
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = SurfaceWhite),
                        border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceWhite.copy(alpha = 0.5f)),
                    ) {
                        Text("تعديل الملف الشخصي", style = MaterialTheme.typography.labelLarge)
                    }
                }
            }
        }

        // الحساب section
        item {
            Spacer(Modifier.height(16.dp))
            SectionLabel("الحساب")
        }
        item { MoreMenuItem(Icons.Filled.Bookmark, "قائمة الحفظ", onClick = onSaveList) }
        item { MoreMenuItem(Icons.Filled.LocationOn, "عناويني المحفوظة", onClick = onSavedAddresses) }
        item { MoreMenuItem(Icons.Filled.Notifications, "إشعاراتي", onClick = onNotifications) }

        // الخدمات section
        item {
            Spacer(Modifier.height(8.dp))
            SectionLabel("الخدمات")
        }
        item { MoreMenuItem(Icons.Filled.People, "العمالة", onClick = onWorkers) }
        item { MoreMenuItem(Icons.AutoMirrored.Filled.NoteAdd, "طلب خدمة مقيمة", onClick = onServiceRequest) }
        item {
            MoreMenuItem(
                icon = Icons.Filled.Verified,
                title = "تحقق من الهوية",
                onClick = onVerification,
                trailing = {
                    val status = profileState.verificationStatus
                    val (text, color) = when (status) {
                        VerificationStatus.VERIFIED -> "تم التحقق ✓" to StatusSuccess
                        VerificationStatus.PENDING -> "قيد المعالجة" to StatusWarning
                        VerificationStatus.FAILED -> "فشل التحقق" to StatusError
                        VerificationStatus.NOT_VERIFIED -> "غير محقق" to TextHint
                    }
                    Text(text, style = MaterialTheme.typography.labelSmall, color = color)
                },
            )
        }

        // الدعم section
        item {
            Spacer(Modifier.height(8.dp))
            SectionLabel("الدعم")
        }
        item { MoreMenuItem(Icons.Filled.Headphones, "تواصل معنا", onClick = onSupport) }
        item { MoreMenuItem(Icons.Filled.Description, "الشروط والأحكام", onClick = onTerms) }
        item { MoreMenuItem(Icons.Filled.PrivacyTip, "سياسة الخصوصية", onClick = onPrivacy) }
        item { MoreMenuItem(Icons.Filled.Star, "تقييم التطبيق", onClick = { showRatingDialog = true }) }

        // Logout
        item {
            Spacer(Modifier.height(16.dp))
            OutlinedButton(
                onClick = { showLogoutDialog = true },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .height(52.dp),
                shape = RoundedCornerShape(CornerLarge),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = StatusError),
                border = androidx.compose.foundation.BorderStroke(1.dp, StatusError),
            ) {
                Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("تسجيل الخروج", style = MaterialTheme.typography.titleMedium)
            }
            Spacer(Modifier.height(32.dp))
        }
    }

    // Logout dialog
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text("تسجيل الخروج") },
            text = { Text("هل تريد تسجيل الخروج؟") },
            confirmButton = {
                TextButton(onClick = { showLogoutDialog = false; onLogout() }) {
                    Text("نعم", color = StatusError)
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text("لا", color = PrimaryGreen)
                }
            },
        )
    }

    // Rating dialog
    if (showRatingDialog) {
        AlertDialog(
            onDismissRequest = { showRatingDialog = false },
            title = { Text("شكراً لتقييمك! ⭐") },
            text = { Text("نقدر رأيك ونسعى دائماً لتحسين خدماتنا") },
            confirmButton = {
                TextButton(onClick = { showRatingDialog = false }) {
                    Text("حسناً", color = PrimaryGreen)
                }
            },
        )
    }
}

@Composable
private fun SectionLabel(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.labelLarge,
        color = TextSecondary,
        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
    )
}

@Composable
private fun MoreMenuItem(
    icon: ImageVector,
    title: String,
    onClick: () -> Unit,
    trailing: @Composable (() -> Unit)? = null,
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        color = SurfaceWhite,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                tint = PrimaryGreen,
                modifier = Modifier.size(22.dp),
            )
            Spacer(Modifier.width(16.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge,
                color = TextPrimary,
                modifier = Modifier.weight(1f),
            )
            if (trailing != null) {
                trailing()
                Spacer(Modifier.width(8.dp))
            }
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                contentDescription = null,
                tint = TextHint,
                modifier = Modifier.size(18.dp),
            )
        }
    }
    HorizontalDivider(color = TextHint.copy(alpha = 0.1f))
}
