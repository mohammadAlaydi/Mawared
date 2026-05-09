package com.mawared.dawliah.ui.screens.workers

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Sort
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.mawared.dawliah.data.mock.MockWorkers
import com.mawared.dawliah.data.model.Worker
import com.mawared.dawliah.ui.components.*
import com.mawared.dawliah.ui.theme.*
import com.mawared.dawliah.viewmodel.WorkersViewModel
import kotlinx.coroutines.delay

/**
 * Workers filtered by nationality — shown after tapping a country flag.
 * Shows star ratings, favorite toggle, and filter/sort options.
 */
@Composable
fun NationalityWorkersScreen(
    nationality: String,
    viewModel: WorkersViewModel,
    onWorkerClick: (String) -> Unit,
    onBack: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsState()
    val workers = MockWorkers.getByNationality(nationality)
    val flag = workers.firstOrNull()?.nationalityFlagEmoji ?: ""

    var isLoading by remember { mutableStateOf(true) }
    var showFilter by remember { mutableStateOf(false) }
    var sortByRating by remember { mutableStateOf(false) }

    val displayedWorkers = if (sortByRating) {
        workers.sortedByDescending { it.rating }
    } else {
        workers
    }

    LaunchedEffect(Unit) {
        delay(1200)
        isLoading = false
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundWarm),
    ) {
        MawaredTopBar(
            title = "$flag $nationality",
            onBackClick = onBack,
            actions = {
                IconButton(onClick = { sortByRating = !sortByRating }) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.Sort,
                        contentDescription = "ترتيب",
                        tint = if (sortByRating) PrimaryGreen else TextSecondary,
                    )
                }
            },
        )

        // Worker count
        Text(
            text = "${workers.size} عامل متاح من الجنسية $nationality",
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
        )

        if (isLoading) {
            // Shimmer loading
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(4) {
                    ShimmerWorkerCard(modifier = Modifier.fillMaxWidth())
                }
            }
        } else {
            AnimatedVisibility(visible = true, enter = fadeIn()) {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(displayedWorkers) { worker ->
                        WorkerCard(
                            worker = worker,
                            isFavorite = uiState.favorites.contains(worker.id),
                            onFavoriteToggle = { viewModel.toggleFavorite(worker.id) },
                            onClick = { onWorkerClick(worker.id) },
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                }
            }
        }
    }
}
