package com.mawared.dawliah.ui.screens.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.mawared.dawliah.ui.components.PrimaryButton
import com.mawared.dawliah.ui.theme.*
import com.mawared.dawliah.viewmodel.AuthViewModel

private val saudiCities = listOf("الرياض", "جدة", "الدمام", "مكة المكرمة", "المدينة المنورة", "الخبر", "تبوك", "أبها")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileSetupScreen(
    viewModel: AuthViewModel,
    onComplete: () -> Unit,
    onSkip: () -> Unit,
) {
    var name by remember { mutableStateOf("") }
    var selectedCity by remember { mutableStateOf("") }
    var cityExpanded by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceWhite)
            .padding(horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(modifier = Modifier.height(80.dp))

        // Progress indicator
        Text(
            text = "1 من 2",
            style = MaterialTheme.typography.labelLarge,
            color = TextSecondary,
        )

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "أكمل بياناتك",
            style = MaterialTheme.typography.headlineLarge,
            color = TextPrimary,
        )

        Spacer(modifier = Modifier.height(32.dp))

        // Full name field
        OutlinedTextField(
            value = name,
            onValueChange = { name = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("الاسم الكامل") },
            leadingIcon = {
                Icon(Icons.Filled.Person, contentDescription = null, tint = PrimaryGreen)
            },
            shape = RoundedCornerShape(CornerMedium),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = PrimaryGreen,
                cursorColor = PrimaryGreen,
                focusedLabelColor = PrimaryGreen,
            ),
            singleLine = true,
        )

        Spacer(modifier = Modifier.height(16.dp))

        // City dropdown
        ExposedDropdownMenuBox(
            expanded = cityExpanded,
            onExpandedChange = { cityExpanded = !cityExpanded },
        ) {
            OutlinedTextField(
                value = selectedCity,
                onValueChange = {},
                readOnly = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .menuAnchor(MenuAnchorType.PrimaryNotEditable),
                label = { Text("المدينة") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = cityExpanded) },
                shape = RoundedCornerShape(CornerMedium),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PrimaryGreen,
                    cursorColor = PrimaryGreen,
                    focusedLabelColor = PrimaryGreen,
                ),
            )
            ExposedDropdownMenu(
                expanded = cityExpanded,
                onDismissRequest = { cityExpanded = false },
            ) {
                saudiCities.forEach { city ->
                    DropdownMenuItem(
                        text = { Text(city) },
                        onClick = {
                            selectedCity = city
                            cityExpanded = false
                        },
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        PrimaryButton(
            text = "حفظ ومتابعة",
            onClick = {
                viewModel.updateProfile(name, selectedCity)
                onComplete()
            },
            enabled = name.isNotBlank() && selectedCity.isNotBlank(),
        )

        Spacer(modifier = Modifier.height(16.dp))

        TextButton(onClick = onSkip) {
            Text(
                text = "تخطى الآن",
                style = MaterialTheme.typography.bodyMedium,
                color = TextHint,
            )
        }
    }
}
