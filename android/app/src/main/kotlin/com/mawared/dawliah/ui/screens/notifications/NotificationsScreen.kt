package com.mawared.dawliah.ui.screens.notifications

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.LocalOffer
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.mawared.dawliah.data.model.Notification
import com.mawared.dawliah.data.model.NotificationType
import com.mawared.dawliah.ui.components.*
import com.mawared.dawliah.ui.theme.*
import com.mawared.dawliah.viewmodel.ProfileViewModel

@Composable
fun NotificationsScreen(
    viewModel: ProfileViewModel,
    onBack: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier.fillMaxSize().background(BackgroundWarm),
    ) {
        MawaredTopBar(
            title = "الإشعارات",
            onBackClick = onBack,
            actions = {
                TextButton(onClick = { viewModel.markAllRead() }) {
                    Text("تحديد الكل كمقروء", style = MaterialTheme.typography.labelMedium, color = PrimaryGreen)
                }
            },
        )

        if (uiState.notifications.isEmpty()) {
            EmptyState(title = "لا يوجد إشعارات", subtitle = "ستظهر الإشعارات هنا عندما يتوفر لديك تحديثات جديدة")
        } else {
            val grouped = uiState.notifications.groupBy { it.timeGroup }

            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                grouped.forEach { (group, notifications) ->
                    item {
                        Text(
                            text = group,
                            style = MaterialTheme.typography.labelLarge,
                            color = TextSecondary,
                            modifier = Modifier.padding(vertical = 8.dp),
                        )
                    }
                    items(notifications) { notification ->
                        NotificationItem(notification = notification)
                    }
                }
            }
        }
    }
}

@Composable
private fun NotificationItem(notification: Notification) {
    val (icon, color) = when (notification.type) {
        NotificationType.ORDER_UPDATE -> Icons.Filled.Info to PrimaryGreen
        NotificationType.PROMOTION -> Icons.Filled.LocalOffer to AccentGold
        NotificationType.SYSTEM -> Icons.Filled.Warning to StatusWarning
        NotificationType.SUCCESS -> Icons.Filled.CheckCircle to StatusSuccess
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(CornerMedium),
        colors = CardDefaults.cardColors(
            containerColor = if (notification.isRead) SurfaceWhite else PrimaryGreen.copy(alpha = 0.05f)
        ),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.Top,
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(color.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, null, tint = color, modifier = Modifier.size(20.dp))
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = notification.title,
                    style = MaterialTheme.typography.titleMedium,
                    color = TextPrimary,
                    fontWeight = if (!notification.isRead) FontWeight.Bold else FontWeight.Normal,
                )
                Spacer(Modifier.height(2.dp))
                Text(notification.body, style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                Spacer(Modifier.height(4.dp))
                Text(notification.time, style = MaterialTheme.typography.labelSmall, color = TextHint)
            }
            if (!notification.isRead) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(PrimaryGreen)
                )
            }
        }
    }
}
