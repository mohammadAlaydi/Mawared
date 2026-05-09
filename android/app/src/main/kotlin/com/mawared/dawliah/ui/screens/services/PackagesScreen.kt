package com.mawared.dawliah.ui.screens.services

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.mawared.dawliah.data.mock.MockPackages
import com.mawared.dawliah.data.mock.MockServices
import com.mawared.dawliah.data.model.PackageType
import com.mawared.dawliah.ui.components.*
import com.mawared.dawliah.ui.theme.*
import com.mawared.dawliah.viewmodel.OrderViewModel

@Composable
fun PackagesScreen(
    serviceId: String,
    orderViewModel: OrderViewModel,
    onPackageSelected: () -> Unit,
    onBack: () -> Unit,
) {
    val service = MockServices.all.find { it.id == serviceId }
    val allPackages = MockPackages.getByServiceId(serviceId)
    var selectedTab by remember { mutableIntStateOf(0) } // 0 = hourly, 1 = monthly
    val uiState by orderViewModel.uiState.collectAsState()

    val filteredPackages = allPackages.filter {
        if (selectedTab == 0) it.type == PackageType.HOURLY else it.type == PackageType.MONTHLY
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundWarm),
    ) {
        MawaredTopBar(
            title = service?.nameAr ?: "الباقات",
            onBackClick = onBack,
        )

        // Tab toggle
        TabRow(
            selectedTabIndex = selectedTab,
            containerColor = SurfaceWhite,
            contentColor = PrimaryGreen,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
        ) {
            Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }) {
                Text(
                    text = "بالساعة",
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(12.dp),
                )
            }
            Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }) {
                Text(
                    text = "شهري",
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(12.dp),
                )
            }
        }

        AnimatedContent(targetState = selectedTab, label = "tab_content") { tab ->
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                itemsIndexed(filteredPackages) { index, pkg ->
                    AnimatedVisibility(
                        visible = true,
                        enter = fadeIn() + slideInVertically(initialOffsetY = { it * (index + 1) / 3 }),
                    ) {
                        PackageCard(
                            pkg = pkg,
                            isSelected = uiState.selectedPackage?.id == pkg.id,
                            onClick = {
                                orderViewModel.selectService(service!!)
                                orderViewModel.selectPackage(pkg)
                                onPackageSelected()
                            },
                        )
                    }
                }
            }
        }
    }
}
