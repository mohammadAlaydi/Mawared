package com.mawared.dawliah.ui.screens.services

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.mawared.dawliah.data.model.WorkerProfession
import com.mawared.dawliah.ui.components.MawaredTopBar
import com.mawared.dawliah.ui.components.PrimaryButton
import com.mawared.dawliah.ui.theme.*

private val professions = WorkerProfession.entries.map { it.labelAr }
private val nationalities = listOf("فلبينية", "إندونيسية", "إثيوبية", "هندية", "سريلانكية", "نيبالية", "بنغلاديشية", "كينية")
private val saudiCities = listOf("الرياض", "جدة", "الدمام", "مكة المكرمة", "المدينة المنورة", "الخبر", "تبوك", "أبها")

/**
 * Direct service request form matching عون's "طلب خدمة مقيمة" screen.
 * Dropdowns: المهنة, الجنسية, المدينة + text: الإسم, رقم الجوال
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ServiceRequestScreen(
    onSubmit: () -> Unit,
    onBack: () -> Unit,
) {
    var selectedProfession by remember { mutableStateOf("") }
    var professionExpanded by remember { mutableStateOf(false) }

    var selectedNationality by remember { mutableStateOf("") }
    var nationalityExpanded by remember { mutableStateOf(false) }

    var selectedCity by remember { mutableStateOf("") }
    var cityExpanded by remember { mutableStateOf(false) }

    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }

    var showSuccess by remember { mutableStateOf(false) }

    val isFormValid = selectedProfession.isNotBlank() &&
            selectedNationality.isNotBlank() &&
            selectedCity.isNotBlank() &&
            name.isNotBlank() &&
            phone.length >= 9

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceWhite),
    ) {
        MawaredTopBar(title = "طلب خدمة مقيمة", onBackClick = onBack)

        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            // المهنة (Profession)
            ExposedDropdownMenuBox(
                expanded = professionExpanded,
                onExpandedChange = { professionExpanded = !professionExpanded },
            ) {
                OutlinedTextField(
                    value = selectedProfession,
                    onValueChange = {},
                    readOnly = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor(MenuAnchorType.PrimaryNotEditable),
                    label = { Text("المهنة") },
                    placeholder = { Text("المهنة", color = TextHint) },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = professionExpanded) },
                    shape = RoundedCornerShape(CornerMedium),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryGreen,
                        focusedLabelColor = PrimaryGreen,
                    ),
                )
                ExposedDropdownMenu(
                    expanded = professionExpanded,
                    onDismissRequest = { professionExpanded = false },
                ) {
                    professions.forEach { prof ->
                        DropdownMenuItem(
                            text = { Text(prof) },
                            onClick = {
                                selectedProfession = prof
                                professionExpanded = false
                            },
                        )
                    }
                }
            }

            // الجنسية (Nationality)
            ExposedDropdownMenuBox(
                expanded = nationalityExpanded,
                onExpandedChange = { nationalityExpanded = !nationalityExpanded },
            ) {
                OutlinedTextField(
                    value = selectedNationality,
                    onValueChange = {},
                    readOnly = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor(MenuAnchorType.PrimaryNotEditable),
                    label = { Text("الجنسية") },
                    placeholder = { Text("الجنسية", color = TextHint) },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = nationalityExpanded) },
                    shape = RoundedCornerShape(CornerMedium),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryGreen,
                        focusedLabelColor = PrimaryGreen,
                    ),
                )
                ExposedDropdownMenu(
                    expanded = nationalityExpanded,
                    onDismissRequest = { nationalityExpanded = false },
                ) {
                    nationalities.forEach { nat ->
                        DropdownMenuItem(
                            text = { Text(nat) },
                            onClick = {
                                selectedNationality = nat
                                nationalityExpanded = false
                            },
                        )
                    }
                }
            }

            // المدينة (City)
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
                    placeholder = { Text("المدينة", color = TextHint) },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = cityExpanded) },
                    shape = RoundedCornerShape(CornerMedium),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryGreen,
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

            // الإسم (Name)
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("الإسم") },
                placeholder = { Text("الإسم", color = TextHint) },
                singleLine = true,
                shape = RoundedCornerShape(CornerMedium),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PrimaryGreen,
                    focusedLabelColor = PrimaryGreen,
                    cursorColor = PrimaryGreen,
                ),
            )

            // رقم الجوال (Phone) — LTR for numbers
            CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
                OutlinedTextField(
                    value = phone,
                    onValueChange = { newVal ->
                        phone = newVal.filter { it.isDigit() }.take(10)
                    },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("رقم الجوال") },
                    placeholder = { Text("05XXXXXXXX", color = TextHint) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    shape = RoundedCornerShape(CornerMedium),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryGreen,
                        focusedLabelColor = PrimaryGreen,
                        cursorColor = PrimaryGreen,
                    ),
                )
            }

            // تفاصيل الطلب (Order Details link)
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(CornerMedium),
                colors = CardDefaults.cardColors(containerColor = BackgroundWarm),
                onClick = { /* show details modal */ },
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("تفاصيل الطلب", style = MaterialTheme.typography.labelLarge, color = TextSecondary)
                    Text("تفاصيل الطلب", style = MaterialTheme.typography.bodyMedium, color = PrimaryGreen)
                }
            }
        }

        // Submit button
        PrimaryButton(
            text = "ارسال الطلب",
            onClick = {
                showSuccess = true
                onSubmit()
            },
            enabled = isFormValid,
            modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp),
        )
    }

    // Success dialog
    if (showSuccess) {
        AlertDialog(
            onDismissRequest = { showSuccess = false },
            title = { Text("تم إرسال الطلب ✓") },
            text = { Text("سيتم التواصل معك خلال 24 ساعة لتأكيد الطلب") },
            confirmButton = {
                TextButton(onClick = { showSuccess = false; onBack() }) {
                    Text("حسناً", color = PrimaryGreen)
                }
            },
        )
    }
}
