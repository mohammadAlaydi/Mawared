package com.mawared.dawliah.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.mawared.dawliah.data.model.ServicePackage
import com.mawared.dawliah.ui.theme.*

/**
 * Package card for service package selection.
 */
@Composable
fun PackageCard(
    pkg: ServicePackage,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CornerLarge))
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(CornerLarge),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) PrimaryGreen.copy(alpha = 0.05f) else SurfaceWhite,
        ),
        border = if (isSelected) {
            androidx.compose.foundation.BorderStroke(2.dp, PrimaryGreen)
        } else {
            androidx.compose.foundation.BorderStroke(1.dp, TextHint.copy(alpha = 0.3f))
        },
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = pkg.nameAr,
                    style = MaterialTheme.typography.headlineMedium,
                    color = TextPrimary,
                )
                if (pkg.isPopular) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(CornerPill))
                            .background(AccentGold)
                            .padding(horizontal = 10.dp, vertical = 4.dp),
                    ) {
                        Text(
                            text = "الأكثر طلباً",
                            style = MaterialTheme.typography.labelSmall,
                            color = SurfaceWhite,
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = pkg.descriptionAr,
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary,
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Price
            Row(verticalAlignment = Alignment.Bottom) {
                Text(
                    text = "${"%,d".format(pkg.price)}",
                    style = MaterialTheme.typography.displayMedium,
                    color = PrimaryGreen,
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "ريال / ${pkg.durationValue} ${pkg.durationUnit}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary,
                    modifier = Modifier.padding(bottom = 4.dp),
                )
            }

            Spacer(modifier = Modifier.height(12.dp))
            HorizontalDivider(color = TextHint.copy(alpha = 0.2f))
            Spacer(modifier = Modifier.height(12.dp))

            // Features
            pkg.features.forEach { feature ->
                Row(
                    modifier = Modifier.padding(vertical = 3.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(
                        imageVector = Icons.Filled.Check,
                        contentDescription = null,
                        tint = StatusSuccess,
                        modifier = Modifier.size(16.dp),
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = feature,
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            PrimaryButton(
                text = if (isSelected) "تم الاختيار ✓" else "اختر الباقة",
                onClick = onClick,
                enabled = !isSelected,
            )
        }
    }
}
