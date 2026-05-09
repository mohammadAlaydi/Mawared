package com.mawared.dawliah.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.mawared.dawliah.ui.theme.*

/**
 * Phone number text field with Saudi +966 prefix and flag.
 * Uses LTR direction for the number input since phone numbers read left-to-right.
 */
@Composable
fun PhoneTextField(
    value: String,
    onValueChange: (String) -> Unit,
    isError: Boolean = false,
    errorMessage: String? = null,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier) {
        // Force LTR for phone number input
        CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
            OutlinedTextField(
                value = value,
                onValueChange = { newVal ->
                    // Only digits, max 9 chars
                    val filtered = newVal.filter { it.isDigit() }.take(9)
                    onValueChange(filtered)
                },
                modifier = Modifier.fillMaxWidth(),
                placeholder = {
                    Text(
                        text = "5XXXXXXXX",
                        style = MaterialTheme.typography.bodyLarge,
                        color = TextHint,
                    )
                },
                leadingIcon = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(start = 12.dp),
                    ) {
                        Text(text = "🇸🇦", style = MaterialTheme.typography.titleLarge)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "+966",
                            style = MaterialTheme.typography.titleMedium,
                            color = TextPrimary,
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        VerticalDivider(
                            modifier = Modifier.height(24.dp),
                            color = TextHint.copy(alpha = 0.3f),
                        )
                    }
                },
                isError = isError,
                shape = RoundedCornerShape(CornerMedium),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PrimaryGreen,
                    unfocusedBorderColor = TextHint.copy(alpha = 0.4f),
                    errorBorderColor = StatusError,
                    cursorColor = PrimaryGreen,
                ),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                singleLine = true,
                textStyle = MaterialTheme.typography.bodyLarge,
            )
        }

        if (isError && errorMessage != null) {
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = errorMessage,
                style = MaterialTheme.typography.labelSmall,
                color = StatusError,
                modifier = Modifier.padding(start = 12.dp),
            )
        }
    }
}
