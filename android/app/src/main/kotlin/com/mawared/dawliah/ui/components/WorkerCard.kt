package com.mawared.dawliah.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.automirrored.filled.StarHalf
import androidx.compose.material.icons.outlined.StarOutline
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.mawared.dawliah.data.model.Worker
import com.mawared.dawliah.ui.theme.*

/**
 * Worker card — photo, name, nationality flag, rating stars, salary, availability.
 * Used in worker grids and home featured section.
 */
@Composable
fun WorkerCard(
    worker: Worker,
    isFavorite: Boolean,
    onFavoriteToggle: () -> Unit,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val favScale by animateFloatAsState(
        targetValue = if (isFavorite) 1.2f else 1f,
        label = "fav_scale"
    )

    Card(
        modifier = modifier
            .clip(RoundedCornerShape(CornerLarge))
            .clickable(onClick = onClick)
            .shadow(elevation = ElevationCard, shape = RoundedCornerShape(CornerLarge)),
        shape = RoundedCornerShape(CornerLarge),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
    ) {
        Column {
            // Photo section
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp)
            ) {
                AsyncImage(
                    model = worker.photoUrl,
                    contentDescription = worker.nameAr,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize(),
                )
                // Bookmark icon
                IconButton(
                    onClick = onFavoriteToggle,
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(4.dp)
                        .scale(favScale),
                ) {
                    Icon(
                        imageVector = if (isFavorite) Icons.Filled.Bookmark else Icons.Filled.BookmarkBorder,
                        contentDescription = "حفظ",
                        tint = if (isFavorite) AccentGold else SurfaceWhite,
                    )
                }
                // Availability badge
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(8.dp)
                        .clip(RoundedCornerShape(CornerPill))
                        .background(if (worker.isAvailable) StatusSuccess.copy(alpha = 0.9f) else StatusNeutral.copy(alpha = 0.9f))
                        .padding(horizontal = 8.dp, vertical = 3.dp),
                ) {
                    Text(
                        text = if (worker.isAvailable) "متاح" else "غير متاح",
                        style = MaterialTheme.typography.labelSmall,
                        color = SurfaceWhite,
                    )
                }
            }

            // Info section
            Column(modifier = Modifier.padding(12.dp)) {
                // Name
                Text(
                    text = worker.nameAr,
                    style = MaterialTheme.typography.titleMedium,
                    color = TextPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )

                Spacer(modifier = Modifier.height(4.dp))

                // Nationality + flag
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = worker.nationalityFlagEmoji,
                        style = MaterialTheme.typography.bodyMedium,
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = worker.nationality,
                        style = MaterialTheme.typography.labelMedium,
                        color = TextSecondary,
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                // Star rating
                RatingStars(rating = worker.rating)

                Spacer(modifier = Modifier.height(6.dp))

                // Profession chip
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(CornerPill))
                        .background(PrimaryGreen.copy(alpha = 0.1f))
                        .padding(horizontal = 8.dp, vertical = 2.dp),
                ) {
                    Text(
                        text = worker.profession.labelAr,
                        style = MaterialTheme.typography.labelSmall,
                        color = PrimaryGreen,
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))

                // Salary
                Text(
                    text = "${"%,d".format(worker.monthlySalary)} ريال/شهر",
                    style = MaterialTheme.typography.labelLarge,
                    color = PrimaryGreen,
                )
            }
        }
    }
}

/**
 * Star rating display with filled, half, and empty stars.
 */
@Composable
fun RatingStars(
    rating: Float,
    modifier: Modifier = Modifier,
    starSize: Int = 14,
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        for (i in 1..5) {
            val icon = when {
                i <= rating.toInt() -> Icons.Filled.Star
                i - 0.5f <= rating -> Icons.AutoMirrored.Filled.StarHalf
                else -> Icons.Outlined.StarOutline
            }
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = AccentGold,
                modifier = Modifier.size(starSize.dp),
            )
        }
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = String.format("%.1f", rating),
            style = MaterialTheme.typography.labelSmall,
            color = TextSecondary,
        )
    }
}
