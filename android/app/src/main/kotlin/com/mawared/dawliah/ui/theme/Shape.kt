package com.mawared.dawliah.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

// ===== Corner Radii Tokens =====
val CornerSmall = 8.dp
val CornerMedium = 12.dp
val CornerLarge = 16.dp
val CornerXLarge = 24.dp
val CornerPill = 50.dp

// ===== Elevation Tokens =====
val ElevationCard = 2.dp
val ElevationSheet = 8.dp

// ===== Material3 Shapes =====
val MawaredShapes = Shapes(
    small = RoundedCornerShape(CornerSmall),
    medium = RoundedCornerShape(CornerMedium),
    large = RoundedCornerShape(CornerLarge),
    extraLarge = RoundedCornerShape(CornerXLarge),
)

// ===== Spacing Tokens =====
object Spacing {
    val xs = 4.dp
    val sm = 8.dp
    val md = 12.dp
    val lg = 16.dp
    val xl = 20.dp
    val xxl = 24.dp
    val xxxl = 32.dp
    val huge = 40.dp
    val massive = 48.dp
}
