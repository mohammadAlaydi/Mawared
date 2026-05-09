package com.mawared.dawliah.ui.screens.workers

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mawared.dawliah.data.mock.MockWorkers
import com.mawared.dawliah.ui.components.MawaredTopBar
import com.mawared.dawliah.ui.theme.*
import com.mawared.dawliah.viewmodel.WorkersViewModel
import kotlinx.coroutines.delay

/**
 * Workers screen — shows NATIONALITY FLAGS GRID first (عون-style).
 * User taps a country flag → navigates to filtered workers from that nationality.
 * Accessible from Home or المزيد (More) tab.
 */
@Composable
fun WorkersScreen(
    viewModel: WorkersViewModel,
    onNationalityClick: (String) -> Unit,
    onSaveListClick: () -> Unit,
    onBack: (() -> Unit)? = null,
) {
    val nationalities = MockWorkers.nationalities
    var showContent by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        delay(500)
        showContent = true
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundWarm),
    ) {
        // Top bar
        MawaredTopBar(
            title = "العمالة",
            onBackClick = onBack,
            actions = {
                IconButton(onClick = onSaveListClick) {
                    Icon(
                        imageVector = Icons.Filled.Bookmark,
                        contentDescription = "قائمة الحفظ",
                        tint = PrimaryGreen,
                    )
                }
            },
        )

        // Section title
        Text(
            text = "اختر الجنسية",
            style = MaterialTheme.typography.headlineMedium,
            color = TextPrimary,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
        )

        Text(
            text = "تصفح العمالة حسب الجنسية المفضلة لديك",
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
            modifier = Modifier.padding(horizontal = 16.dp),
        )

        Spacer(modifier = Modifier.height(20.dp))

        // Nationality flags grid
        AnimatedVisibility(
            visible = showContent,
            enter = fadeIn(),
        ) {
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(nationalities) { nationality ->
                    NationalityFlagCard(
                        flag = nationality.flagEmoji,
                        name = nationality.nameAr,
                        workerCount = nationality.workerCount,
                        onClick = { onNationalityClick(nationality.nameAr) },
                    )
                }
            }
        }
    }
}

@Composable
private fun NationalityFlagCard(
    flag: String,
    name: String,
    workerCount: Int,
    onClick: () -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(150.dp)
            .shadow(ElevationCard, RoundedCornerShape(CornerLarge))
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(CornerLarge),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            // Large flag emoji
            Text(
                text = flag,
                fontSize = 48.sp,
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Country name
            Text(
                text = name,
                style = MaterialTheme.typography.titleMedium,
                color = TextPrimary,
                fontWeight = FontWeight.SemiBold,
                textAlign = TextAlign.Center,
            )

            Spacer(modifier = Modifier.height(4.dp))

            // Worker count badge
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(CornerPill))
                    .background(PrimaryGreen.copy(alpha = 0.1f))
                    .padding(horizontal = 10.dp, vertical = 3.dp),
            ) {
                Text(
                    text = "$workerCount عامل",
                    style = MaterialTheme.typography.labelSmall,
                    color = PrimaryGreen,
                )
            }
        }
    }
}
