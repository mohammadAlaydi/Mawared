package com.mawared.dawliah.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CleaningServices
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.ElderlyWoman
import androidx.compose.material.icons.filled.ChildCare
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.mawared.dawliah.R
import com.mawared.dawliah.data.model.ServiceCategory
import com.mawared.dawliah.ui.theme.*

/**
 * Service category card with real photograph background, gradient overlay,
 * icon, and title. Uses brand images (caregiver, driver, nanny, worker).
 */
@Composable
fun ServiceCard(
    service: ServiceCategory,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val (bgColor, icon, imageRes) = getServiceVisuals(service.iconName)

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(CornerLarge))
            .clickable(onClick = onClick),
    ) {
        // Real photo background
        Image(
            painter = painterResource(id = imageRes),
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize(),
        )

        // Gradient overlay for readability
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            bgColor.copy(alpha = 0.4f),
                            bgColor.copy(alpha = 0.85f),
                        )
                    )
                ),
        )

        // Content
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            Icon(
                imageVector = icon,
                contentDescription = service.nameAr,
                tint = SurfaceWhite.copy(alpha = 0.9f),
                modifier = Modifier.size(40.dp),
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = service.nameAr,
                style = MaterialTheme.typography.titleLarge,
                color = SurfaceWhite,
            )
            Text(
                text = service.descriptionAr,
                style = MaterialTheme.typography.labelSmall,
                color = SurfaceWhite.copy(alpha = 0.8f),
                maxLines = 2,
            )
        }
    }
}

private data class ServiceVisuals(val color: Color, val icon: ImageVector, val imageRes: Int)

private fun getServiceVisuals(iconName: String): ServiceVisuals {
    return when (iconName) {
        "cleaning_services" -> ServiceVisuals(ServiceCardTeal, Icons.Filled.CleaningServices, R.drawable.img_hero_worker)
        "directions_car" -> ServiceVisuals(ServiceCardAmber, Icons.Filled.DirectionsCar, R.drawable.img_driver)
        "elderly" -> ServiceVisuals(ServiceCardGreen, Icons.Filled.ElderlyWoman, R.drawable.img_caregiver)
        "child_care" -> ServiceVisuals(ServiceCardBlue, Icons.Filled.ChildCare, R.drawable.img_nanny)
        else -> ServiceVisuals(PrimaryGreen, Icons.Filled.CleaningServices, R.drawable.img_hero_worker)
    }
}
