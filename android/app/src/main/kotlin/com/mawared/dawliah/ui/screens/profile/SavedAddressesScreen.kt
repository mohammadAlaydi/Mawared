package com.mawared.dawliah.ui.screens.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.mawared.dawliah.data.model.Address
import com.mawared.dawliah.ui.components.*
import com.mawared.dawliah.ui.theme.*
import com.mawared.dawliah.viewmodel.ProfileViewModel

@Composable
fun SavedAddressesScreen(
    viewModel: ProfileViewModel,
    onBack: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsState()
    var showAddSheet by remember { mutableStateOf(false) }
    var deleteAddressId by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = Modifier.fillMaxSize().background(BackgroundWarm),
    ) {
        MawaredTopBar(title = "عناويني المحفوظة", onBackClick = onBack)

        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.weight(1f),
        ) {
            items(uiState.savedAddresses) { address ->
                Card(
                    shape = RoundedCornerShape(CornerMedium),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(Icons.Filled.LocationOn, null, tint = PrimaryGreen, modifier = Modifier.size(24.dp))
                        Spacer(Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(address.label, style = MaterialTheme.typography.titleMedium, color = TextPrimary)
                            Text("${address.district}، ${address.street}", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                            Text(address.city, style = MaterialTheme.typography.labelMedium, color = TextHint)
                        }
                        IconButton(onClick = { deleteAddressId = address.id }) {
                            Icon(Icons.Filled.Delete, "حذف", tint = StatusError)
                        }
                    }
                }
            }
        }

        // Add button
        FloatingActionButton(
            onClick = { showAddSheet = true },
            containerColor = PrimaryGreen,
            contentColor = SurfaceWhite,
            modifier = Modifier
                .align(Alignment.End)
                .padding(16.dp),
        ) {
            Icon(Icons.Filled.Add, "إضافة عنوان")
        }
    }

    // Delete dialog
    if (deleteAddressId != null) {
        AlertDialog(
            onDismissRequest = { deleteAddressId = null },
            title = { Text("حذف العنوان") },
            text = { Text("هل تريد حذف هذا العنوان؟") },
            confirmButton = {
                TextButton(onClick = { viewModel.removeAddress(deleteAddressId!!); deleteAddressId = null }) {
                    Text("نعم", color = StatusError)
                }
            },
            dismissButton = {
                TextButton(onClick = { deleteAddressId = null }) {
                    Text("لا", color = PrimaryGreen)
                }
            },
        )
    }

    // Add address sheet
    if (showAddSheet) {
        AddAddressDialog(
            onDismiss = { showAddSheet = false },
            onSave = { address ->
                viewModel.addAddress(address)
                showAddSheet = false
            },
        )
    }
}

@Composable
private fun AddAddressDialog(
    onDismiss: () -> Unit,
    onSave: (Address) -> Unit,
) {
    var label by remember { mutableStateOf("") }
    var city by remember { mutableStateOf("الرياض") }
    var district by remember { mutableStateOf("") }
    var street by remember { mutableStateOf("") }
    var building by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("إضافة عنوان جديد") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = label, onValueChange = { label = it }, label = { Text("اسم العنوان") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = district, onValueChange = { district = it }, label = { Text("الحي") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = street, onValueChange = { street = it }, label = { Text("الشارع") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = building, onValueChange = { building = it }, label = { Text("رقم المبنى") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = notes, onValueChange = { notes = it }, label = { Text("ملاحظات") }, modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    onSave(Address("addr_${System.currentTimeMillis()}", label, city, district, street, building, notes))
                },
                enabled = label.isNotBlank() && district.isNotBlank(),
            ) {
                Text("حفظ", color = PrimaryGreen)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("إلغاء", color = TextSecondary)
            }
        },
    )
}
