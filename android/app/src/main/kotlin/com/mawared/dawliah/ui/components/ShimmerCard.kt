package com.mawared.dawliah.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.mawared.dawliah.ui.theme.ShimmerBase
import com.valentinilk.shimmer.shimmer

/**
 * Shimmer skeleton card matching worker card layout.
 */
@Composable
fun ShimmerWorkerCard(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .shimmer()
            .clip(RoundedCornerShape(16.dp))
            .background(androidx.compose.ui.graphics.Color.White)
    ) {
        // Photo placeholder
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(140.dp)
                .background(ShimmerBase)
        )
        Column(modifier = Modifier.padding(12.dp)) {
            // Name
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.7f)
                    .height(16.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(ShimmerBase)
            )
            Spacer(modifier = Modifier.height(8.dp))
            // Profession chip
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.5f)
                    .height(12.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(ShimmerBase)
            )
            Spacer(modifier = Modifier.height(8.dp))
            // Salary
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.4f)
                    .height(14.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(ShimmerBase)
            )
        }
    }
}

/**
 * Shimmer skeleton for nationality flag card.
 */
@Composable
fun ShimmerNationalityCard(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .shimmer()
            .size(100.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(ShimmerBase)
    )
}

/**
 * Shimmer for order card.
 */
@Composable
fun ShimmerOrderCard(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .shimmer()
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(androidx.compose.ui.graphics.Color.White)
            .padding(16.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(0.5f)
                .height(14.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(ShimmerBase)
        )
        Spacer(modifier = Modifier.height(12.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth(0.8f)
                .height(16.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(ShimmerBase)
        )
        Spacer(modifier = Modifier.height(12.dp))
        Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
            Box(
                modifier = Modifier
                    .width(80.dp)
                    .height(12.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(ShimmerBase)
            )
            Box(
                modifier = Modifier
                    .width(60.dp)
                    .height(24.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(ShimmerBase)
            )
        }
    }
}
