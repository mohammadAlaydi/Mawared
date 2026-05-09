package com.mawared.dawliah.ui.screens.workers

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.mawared.dawliah.data.mock.MockWorkers
import com.mawared.dawliah.data.model.Worker
import com.mawared.dawliah.ui.components.*
import com.mawared.dawliah.ui.theme.*
import com.mawared.dawliah.viewmodel.WorkersViewModel

/**
 * Worker CV detail screen with large photo, stats, skills, and order CTA.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkerDetailScreen(
    workerId: String,
    viewModel: WorkersViewModel,
    onOrderClick: (Worker) -> Unit,
    onBack: () -> Unit,
) {
    val worker = viewModel.getWorkerById(workerId)
    val uiState by viewModel.uiState.collectAsState()

    if (worker == null) {
        EmptyState(title = "لم يتم العثور على العامل")
        return
    }

    val isFav = uiState.favorites.contains(worker.id)

    Scaffold(
        topBar = {
            MawaredTopBar(
                title = worker.nameAr,
                onBackClick = onBack,
            )
        },
        bottomBar = {
            // Fixed bottom bar
            Surface(
                shadowElevation = 8.dp,
                color = SurfaceWhite,
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    OutlinedButton(
                        onClick = { viewModel.toggleFavorite(worker.id) },
                        modifier = Modifier.weight(0.4f).height(52.dp),
                        shape = RoundedCornerShape(CornerLarge),
                    ) {
                        Icon(
                            imageVector = if (isFav) Icons.Filled.Bookmark else Icons.Filled.BookmarkBorder,
                            contentDescription = "حفظ",
                            tint = if (isFav) AccentGold else PrimaryGreen,
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(
                            text = if (isFav) "محفوظ" else "حفظ",
                            color = PrimaryGreen,
                        )
                    }

                    Button(
                        onClick = { onOrderClick(worker) },
                        modifier = Modifier.weight(0.6f).height(52.dp),
                        shape = RoundedCornerShape(CornerLarge),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen),
                    ) {
                        Text("اطلب الآن", color = SurfaceWhite, style = MaterialTheme.typography.titleLarge)
                    }
                }
            }
        },
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(BackgroundWarm),
        ) {
            // Large photo
            item {
                AsyncImage(
                    model = worker.photoUrl,
                    contentDescription = worker.nameAr,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(250.dp),
                )
            }

            // Header info
            item {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = worker.nameAr,
                            style = MaterialTheme.typography.headlineLarge,
                            color = TextPrimary,
                        )
                        Spacer(Modifier.width(8.dp))
                        // Availability dot
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .clip(CircleShape)
                                .background(if (worker.isAvailable) StatusSuccess else StatusNeutral)
                        )
                    }

                    Spacer(Modifier.height(4.dp))

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(text = worker.nationalityFlagEmoji, style = MaterialTheme.typography.titleLarge)
                        Spacer(Modifier.width(6.dp))
                        Text(
                            text = worker.nationality,
                            style = MaterialTheme.typography.bodyLarge,
                            color = TextSecondary,
                        )
                        Spacer(Modifier.width(12.dp))
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(CornerPill))
                                .background(PrimaryGreen.copy(alpha = 0.1f))
                                .padding(horizontal = 8.dp, vertical = 2.dp),
                        ) {
                            Text(
                                text = worker.profession.labelAr,
                                style = MaterialTheme.typography.labelMedium,
                                color = PrimaryGreen,
                            )
                        }
                    }

                    Spacer(Modifier.height(8.dp))
                    RatingStars(rating = worker.rating, starSize = 20)
                }
            }

            // Quick Stats Row
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    QuickStat("الخبرة", "${worker.experienceYears} سنوات", Modifier.weight(1f))
                    QuickStat("العمر", "${worker.ageYears} سنة", Modifier.weight(1f))
                    QuickStat("الراتب", "${"%,d".format(worker.monthlySalary)} ريال", Modifier.weight(1f))
                }
            }

            // About section
            item {
                Spacer(Modifier.height(16.dp))
                DetailSection(title = "نبذة") {
                    Text(
                        text = worker.bio,
                        style = MaterialTheme.typography.bodyLarge,
                        color = TextSecondary,
                    )
                }
            }

            // Languages
            item {
                DetailSection(title = "اللغات") {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        worker.languages.forEach { lang ->
                            AssistChip(
                                onClick = {},
                                label = { Text(lang, style = MaterialTheme.typography.labelMedium) },
                                shape = RoundedCornerShape(CornerPill),
                            )
                        }
                    }
                }
            }

            // Skills
            item {
                DetailSection(title = "المهارات") {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        worker.skills.take(4).forEach { skill ->
                            AssistChip(
                                onClick = {},
                                label = { Text(skill, style = MaterialTheme.typography.labelMedium) },
                                shape = RoundedCornerShape(CornerPill),
                            )
                        }
                    }
                }
                Spacer(Modifier.height(100.dp)) // space for bottom bar
            }
        }
    }
}

@Composable
private fun QuickStat(label: String, value: String, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(CornerMedium),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium,
                color = PrimaryGreen,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = TextSecondary,
            )
        }
    }
}

@Composable
private fun DetailSection(title: String, content: @Composable () -> Unit) {
    Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge,
            color = TextPrimary,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(bottom = 8.dp),
        )
        content()
    }
}
