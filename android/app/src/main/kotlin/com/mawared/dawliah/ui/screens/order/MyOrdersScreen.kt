package com.mawared.dawliah.ui.screens.order

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.mawared.dawliah.data.model.Order
import com.mawared.dawliah.data.model.OrderStatus
import com.mawared.dawliah.ui.components.*
import com.mawared.dawliah.ui.theme.*
import com.mawared.dawliah.viewmodel.OrderViewModel

@Composable
fun MyOrdersScreen(
    viewModel: OrderViewModel,
    onOrderClick: (String) -> Unit,
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedTab by remember { mutableIntStateOf(0) }

    val tabs = listOf("الكل", "جاري", "مكتمل", "ملغى")

    val filteredOrders = when (selectedTab) {
        1 -> uiState.orders.filter {
            it.status != OrderStatus.COMPLETED && it.status != OrderStatus.CANCELLED
        }
        2 -> uiState.orders.filter { it.status == OrderStatus.COMPLETED }
        3 -> uiState.orders.filter { it.status == OrderStatus.CANCELLED }
        else -> uiState.orders
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundWarm),
    ) {
        MawaredTopBar(title = "طلباتي")

        // Filter tabs
        ScrollableTabRow(
            selectedTabIndex = selectedTab,
            containerColor = SurfaceWhite,
            contentColor = PrimaryGreen,
            edgePadding = 16.dp,
        ) {
            tabs.forEachIndexed { index, tab ->
                Tab(
                    selected = selectedTab == index,
                    onClick = { selectedTab = index },
                ) {
                    Text(
                        text = tab,
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(12.dp),
                    )
                }
            }
        }

        if (filteredOrders.isEmpty()) {
            EmptyState(
                title = "لا يوجد طلبات",
                subtitle = "ابدأ بطلب خدمة جديدة",
            )
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(filteredOrders) { order ->
                    OrderCard(
                        order = order,
                        onClick = { onOrderClick(order.id) },
                    )
                }
            }
        }
    }
}

@Composable
private fun OrderCard(
    order: Order,
    onClick: () -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(CornerMedium),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = order.orderNumber,
                    style = MaterialTheme.typography.labelMedium,
                    color = TextHint,
                )
                OrderStatusChip(status = order.status)
            }

            Spacer(Modifier.height(8.dp))

            Text(
                text = "${order.service.nameAr} — ${order.selectedPackage.nameAr}",
                style = MaterialTheme.typography.titleMedium,
                color = TextPrimary,
                fontWeight = FontWeight.SemiBold,
            )

            Spacer(Modifier.height(4.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(
                    text = order.placedAt,
                    style = MaterialTheme.typography.labelMedium,
                    color = TextSecondary,
                )
                Text(
                    text = "${"%,d".format(order.totalPrice)} ريال",
                    style = MaterialTheme.typography.titleMedium,
                    color = PrimaryGreen,
                    fontWeight = FontWeight.Bold,
                )
            }

            Spacer(Modifier.height(8.dp))

            TextButton(onClick = onClick) {
                Text("عرض التفاصيل", color = PrimaryGreen, style = MaterialTheme.typography.labelLarge)
            }
        }
    }
}
