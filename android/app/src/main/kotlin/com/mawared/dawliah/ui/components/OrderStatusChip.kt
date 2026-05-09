package com.mawared.dawliah.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.mawared.dawliah.data.model.OrderStatus

/**
 * Colored status pill chip for order status display.
 */
@Composable
fun OrderStatusChip(
    status: OrderStatus,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(50.dp))
            .background(status.color.copy(alpha = 0.15f))
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center,
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(status.color)
        )
        Spacer(modifier = Modifier.width(6.dp))
        Text(
            text = status.labelAr,
            style = MaterialTheme.typography.labelLarge,
            color = status.color,
        )
    }
}
