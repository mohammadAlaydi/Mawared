package com.mawared.dawliah.ui.screens.branches

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.mawared.dawliah.R
import com.mawared.dawliah.data.mock.MockBranches
import com.mawared.dawliah.data.model.Branch
import com.mawared.dawliah.ui.components.MawaredTopBar
import com.mawared.dawliah.ui.theme.*

@Composable
fun BranchesScreen() {
    val branches = MockBranches.all
    val cities = listOf("الكل") + MockBranches.cities
    var selectedCity by remember { mutableStateOf("الكل") }

    val displayedBranches = if (selectedCity == "الكل") branches
    else branches.filter { it.city == selectedCity }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundWarm),
    ) {
        MawaredTopBar(title = "فروعنا")

        // Office banner image
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(120.dp),
        ) {
            Image(
                painter = painterResource(id = R.drawable.img_office),
                contentDescription = "مكتب موارد",
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize(),
            )
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                PrimaryGreen.copy(alpha = 0.5f),
                                PrimaryGreen.copy(alpha = 0.8f),
                            )
                        )
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = "نخدمكم في جميع مناطق المملكة",
                    style = MaterialTheme.typography.titleLarge,
                    color = SurfaceWhite,
                    fontWeight = FontWeight.Bold,
                )
            }
        }

        // City filter chips
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            cities.forEach { city ->
                val isSelected = selectedCity == city
                FilterChip(
                    selected = isSelected,
                    onClick = { selectedCity = city },
                    label = { Text(city) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = PrimaryGreen,
                        selectedLabelColor = SurfaceWhite,
                    ),
                )
            }
        }

        // Branch count
        Text(
            text = "${displayedBranches.size} فرع",
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
        )

        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            items(displayedBranches) { branch ->
                BranchCard(branch = branch)
            }
        }
    }
}

@Composable
private fun BranchCard(branch: Branch) {
    val context = LocalContext.current

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(CornerLarge),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Branch name
            Text(
                text = branch.nameAr,
                style = MaterialTheme.typography.titleMedium,
                color = TextPrimary,
                fontWeight = FontWeight.SemiBold,
            )

            Spacer(Modifier.height(12.dp))

            // Address
            Row(verticalAlignment = Alignment.Top) {
                Icon(
                    Icons.Filled.LocationOn,
                    contentDescription = null,
                    tint = PrimaryGreen,
                    modifier = Modifier.size(18.dp),
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    text = branch.district,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary,
                )
            }

            Spacer(Modifier.height(8.dp))

            // Phone
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Filled.Phone,
                    contentDescription = null,
                    tint = PrimaryGreen,
                    modifier = Modifier.size(18.dp),
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    text = branch.phone,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary,
                )
            }

            Spacer(Modifier.height(8.dp))

            // Working hours
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Filled.AccessTime,
                    contentDescription = null,
                    tint = PrimaryGreen,
                    modifier = Modifier.size(18.dp),
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    text = branch.workingHoursAr,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary,
                )
            }

            Spacer(Modifier.height(16.dp))

            // Action buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                OutlinedButton(
                    onClick = {
                        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${branch.phone}"))
                        context.startActivity(intent)
                    },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(CornerMedium),
                ) {
                    Icon(Icons.Filled.Phone, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("اتصل")
                }
                Button(
                    onClick = {
                        val uri = Uri.parse("geo:${branch.latitude},${branch.longitude}?q=${branch.latitude},${branch.longitude}(${branch.nameAr})")
                        val intent = Intent(Intent.ACTION_VIEW, uri)
                        context.startActivity(intent)
                    },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(CornerMedium),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen),
                ) {
                    Icon(Icons.Filled.LocationOn, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("الموقع")
                }
            }
        }
    }
}
