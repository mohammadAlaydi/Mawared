package com.mawared.dawliah.ui.screens.contracts

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.mawared.dawliah.data.model.Contract
import com.mawared.dawliah.data.model.ContractStatus
import com.mawared.dawliah.ui.components.EmptyState
import com.mawared.dawliah.ui.components.MawaredTopBar
import com.mawared.dawliah.ui.theme.*
import com.mawared.dawliah.viewmodel.ContractFilter
import com.mawared.dawliah.viewmodel.ContractsViewModel

@Composable
fun ContractsScreen(
    viewModel: ContractsViewModel,
    onContractClick: (String) -> Unit,
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundWarm),
    ) {
        MawaredTopBar(title = "تعاقداتي")

        // Filter chips
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            ContractFilter.entries.forEach { filter ->
                val isSelected = uiState.selectedFilter == filter
                FilterChip(
                    selected = isSelected,
                    onClick = { viewModel.setFilter(filter) },
                    label = {
                        Text(filter.labelAr, style = MaterialTheme.typography.labelLarge)
                    },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = PrimaryGreen,
                        selectedLabelColor = SurfaceWhite,
                    ),
                )
            }
        }

        if (uiState.contracts.isEmpty()) {
            EmptyState(
                title = "لا توجد تعاقدات",
                subtitle = "ستظهر تعاقداتك هنا بعد إتمام أول طلب",
            )
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(uiState.contracts) { contract ->
                    ContractCard(
                        contract = contract,
                        onClick = { onContractClick(contract.id) },
                    )
                }
            }
        }
    }
}

@Composable
private fun ContractCard(
    contract: Contract,
    onClick: () -> Unit,
) {
    val statusColor = when (contract.status) {
        ContractStatus.ACTIVE -> StatusSuccess
        ContractStatus.EXPIRED -> StatusError
        ContractStatus.PENDING_RENEWAL -> StatusWarning
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(CornerLarge),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header: Worker info + status
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                AsyncImage(
                    model = contract.workerPhotoUrl,
                    contentDescription = contract.workerName,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape),
                )
                Spacer(Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = contract.workerName,
                        style = MaterialTheme.typography.titleMedium,
                        color = TextPrimary,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        text = "${contract.nationalityFlag} ${contract.profession.labelAr}",
                        style = MaterialTheme.typography.labelMedium,
                        color = TextSecondary,
                    )
                }
                // Status chip
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(CornerPill))
                        .background(statusColor.copy(alpha = 0.1f))
                        .padding(horizontal = 10.dp, vertical = 4.dp),
                ) {
                    Text(
                        text = contract.status.labelAr,
                        style = MaterialTheme.typography.labelSmall,
                        color = statusColor,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }

            Spacer(Modifier.height(12.dp))
            HorizontalDivider(color = TextHint.copy(alpha = 0.1f))
            Spacer(Modifier.height(12.dp))

            // Details grid
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                ContractInfoItem("رقم العقد", contract.contractNumber)
                ContractInfoItem("المدينة", contract.city)
                ContractInfoItem("الراتب", "${"%,d".format(contract.monthlySalary)} ريال")
            }

            Spacer(Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                ContractInfoItem("بداية العقد", contract.startDate)
                ContractInfoItem("نهاية العقد", contract.endDate)
            }

            // Renewal button for pending
            if (contract.status == ContractStatus.PENDING_RENEWAL) {
                Spacer(Modifier.height(12.dp))
                Button(
                    onClick = { /* mock renewal */ },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(CornerMedium),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen),
                ) {
                    Text("تجديد العقد", color = SurfaceWhite)
                }
            }
        }
    }
}

@Composable
private fun ContractInfoItem(label: String, value: String) {
    Column {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = TextHint,
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = TextPrimary,
            fontWeight = FontWeight.Medium,
        )
    }
}
