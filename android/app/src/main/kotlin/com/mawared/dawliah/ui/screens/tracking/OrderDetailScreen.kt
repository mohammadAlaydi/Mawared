package com.mawared.dawliah.ui.screens.tracking

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.mawared.dawliah.data.model.Order
import com.mawared.dawliah.data.model.OrderStatus
import com.mawared.dawliah.ui.components.*
import com.mawared.dawliah.ui.theme.*
import com.mawared.dawliah.viewmodel.OrderViewModel

@Composable
fun OrderDetailScreen(
    orderId: String,
    orderViewModel: OrderViewModel,
    onBack: () -> Unit,
) {
    val order = orderViewModel.getOrderById(orderId)
    var selectedTab by remember { mutableIntStateOf(0) }

    if (order == null) {
        EmptyState(title = "لم يتم العثور على الطلب")
        return
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundWarm),
    ) {
        MawaredTopBar(
            title = "تفاصيل الطلب",
            onBackClick = onBack,
        )

        // Status header card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(CornerLarge),
            colors = CardDefaults.cardColors(containerColor = order.status.color.copy(alpha = 0.1f)),
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                OrderStatusChip(status = order.status)
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(order.orderNumber, style = MaterialTheme.typography.titleMedium, color = TextPrimary)
                    Text(order.placedAt, style = MaterialTheme.typography.labelMedium, color = TextSecondary)
                }
            }
        }

        // Tabs
        TabRow(
            selectedTabIndex = selectedTab,
            containerColor = SurfaceWhite,
            contentColor = PrimaryGreen,
        ) {
            Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }) {
                Text("تفاصيل", modifier = Modifier.padding(12.dp))
            }
            Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }) {
                Text("تتبع الطلب", modifier = Modifier.padding(12.dp))
            }
        }

        when (selectedTab) {
            0 -> OrderDetailsTab(order)
            1 -> OrderTrackingTab(order)
        }
    }
}

@Composable
private fun OrderDetailsTab(order: Order) {
    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            DetailCard("الخدمة", order.service.nameAr)
        }
        item {
            DetailCard("الباقة", "${order.selectedPackage.nameAr} — ${"%,d".format(order.selectedPackage.price)} ريال")
        }
        item {
            DetailCard("العامل", order.worker?.nameAr ?: "لم يتم التعيين بعد")
        }
        item {
            DetailCard("العنوان", "${order.address.label} — ${order.address.district}، ${order.address.city}")
        }
        if (order.notes.isNotBlank()) {
            item {
                DetailCard("ملاحظات", order.notes)
            }
        }
        item {
            Card(
                shape = RoundedCornerShape(CornerMedium),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween) {
                        Text("الإجمالي", style = MaterialTheme.typography.headlineMedium, color = TextPrimary)
                        Text("${"%,d".format(order.totalPrice)} ريال", style = MaterialTheme.typography.headlineMedium, color = PrimaryGreen, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Cancel button for cancellable statuses
        if (order.status != OrderStatus.COMPLETED && order.status != OrderStatus.CANCELLED) {
            item {
                Spacer(Modifier.height(8.dp))
                OutlinedButton(
                    onClick = { /* mock cancel */ },
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(CornerLarge),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = StatusError),
                    border = androidx.compose.foundation.BorderStroke(1.dp, StatusError),
                ) {
                    Text("إلغاء الطلب", style = MaterialTheme.typography.titleMedium)
                }
            }
        }
    }
}

@Composable
private fun OrderTrackingTab(order: Order) {
    // Pulsing animation for current status
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.4f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "pulse_scale"
    )

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
    ) {
        val allStatuses = OrderStatus.entries
        val currentIndex = allStatuses.indexOf(order.status)

        items(allStatuses.size) { index ->
            val status = allStatuses[index]
            val historyEntry = order.statusHistory.find { it.status == status }
            val isCompleted = index <= currentIndex && historyEntry != null
            val isCurrent = status == order.status

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
            ) {
                // Timeline column
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.width(40.dp),
                ) {
                    Box(
                        modifier = Modifier
                            .size(if (isCurrent) 16.dp else 12.dp)
                            .scale(if (isCurrent) pulseScale else 1f)
                            .clip(CircleShape)
                            .background(
                                when {
                                    isCompleted -> PrimaryGreen
                                    isCurrent -> PrimaryGreen
                                    else -> TextHint.copy(alpha = 0.3f)
                                }
                            )
                    )
                    if (index < allStatuses.size - 1) {
                        Box(
                            modifier = Modifier
                                .width(2.dp)
                                .height(40.dp)
                                .background(
                                    if (isCompleted) PrimaryGreen else TextHint.copy(alpha = 0.2f)
                                )
                        )
                    }
                }

                Spacer(Modifier.width(12.dp))

                // Status info
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = status.labelAr,
                        style = MaterialTheme.typography.titleMedium,
                        color = if (isCompleted || isCurrent) TextPrimary else TextHint,
                        fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Normal,
                    )
                    if (historyEntry != null) {
                        Text(
                            text = historyEntry.timestamp,
                            style = MaterialTheme.typography.labelSmall,
                            color = TextHint,
                        )
                        if (historyEntry.note.isNotBlank()) {
                            Text(
                                text = historyEntry.note,
                                style = MaterialTheme.typography.labelSmall,
                                color = TextSecondary,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DetailCard(label: String, value: String) {
    Card(
        shape = RoundedCornerShape(CornerMedium),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(label, style = MaterialTheme.typography.labelLarge, color = TextSecondary)
            Spacer(Modifier.height(4.dp))
            Text(value, style = MaterialTheme.typography.titleMedium, color = TextPrimary)
        }
    }
}
