package com.mawared.dawliah.ui.screens.workers

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.mawared.dawliah.data.mock.MockWorkers
import com.mawared.dawliah.ui.components.*
import com.mawared.dawliah.ui.theme.*
import com.mawared.dawliah.viewmodel.WorkersViewModel

/**
 * Save List screen (renamed from Favorites — "قائمة الحفظ")
 * Shows workers marked/bookmarked by the user for quick access.
 */
@Composable
fun SaveListScreen(
    viewModel: WorkersViewModel,
    onWorkerClick: (String) -> Unit,
    onBack: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsState()
    val savedWorkers = MockWorkers.all.filter { uiState.favorites.contains(it.id) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundWarm),
    ) {
        MawaredTopBar(
            title = "قائمة الحفظ",
            onBackClick = onBack,
        )

        if (savedWorkers.isEmpty()) {
            EmptyState(
                title = "لا يوجد عمال محفوظين",
                subtitle = "احفظ العمال للوصول السريع إليهم لاحقاً",
                actionText = "تصفح العمال",
                onAction = onBack,
            )
        } else {
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(savedWorkers) { worker ->
                    WorkerCard(
                        worker = worker,
                        isFavorite = true,
                        onFavoriteToggle = { viewModel.toggleFavorite(worker.id) },
                        onClick = { onWorkerClick(worker.id) },
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
        }
    }
}
