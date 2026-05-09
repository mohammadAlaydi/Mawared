package com.mawared.dawliah.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mawared.dawliah.ui.theme.*

/**
 * Custom 4-digit OTP input with separate boxes.
 * Auto-focus moves to next box. Auto-submit when 4 digits complete.
 * Uses LTR direction for number input.
 */
@Composable
fun OtpTextField(
    otpLength: Int = 4,
    onOtpComplete: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    var otpValues by remember { mutableStateOf(List(otpLength) { "" }) }
    val focusRequesters = remember { List(otpLength) { FocusRequester() } }
    val focusManager = LocalFocusManager.current

    // Force LTR for OTP number boxes
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
        Row(
            modifier = modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            for (i in 0 until otpLength) {
                val isFilled = otpValues[i].isNotEmpty()
                val borderColor = if (isFilled) PrimaryGreen else TextHint.copy(alpha = 0.4f)
                val bgColor = if (isFilled) PrimaryGreen else Color.Transparent

                BasicTextField(
                    value = otpValues[i],
                    onValueChange = { value ->
                        if (value.length <= 1 && value.all { it.isDigit() }) {
                            val newOtp = otpValues.toMutableList()
                            newOtp[i] = value
                            otpValues = newOtp

                            if (value.isNotEmpty() && i < otpLength - 1) {
                                focusRequesters[i + 1].requestFocus()
                            }

                            val fullOtp = newOtp.joinToString("")
                            if (fullOtp.length == otpLength) {
                                focusManager.clearFocus()
                                onOtpComplete(fullOtp)
                            }
                        }
                    },
                    modifier = Modifier
                        .size(56.dp)
                        .focusRequester(focusRequesters[i])
                        .drawBehind {
                            drawRoundRect(
                                color = bgColor,
                                cornerRadius = CornerRadius(12.dp.toPx()),
                                size = Size(size.width, size.height),
                            )
                            drawRoundRect(
                                color = borderColor,
                                cornerRadius = CornerRadius(12.dp.toPx()),
                                size = Size(size.width, size.height),
                                style = androidx.compose.ui.graphics.drawscope.Stroke(width = 1.5.dp.toPx()),
                            )
                        },
                    textStyle = TextStyle(
                        fontFamily = CairoFamily,
                        fontWeight = FontWeight.Bold,
                        fontSize = 22.sp,
                        textAlign = TextAlign.Center,
                        color = if (isFilled) SurfaceWhite else TextPrimary,
                    ),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    cursorBrush = SolidColor(PrimaryGreen),
                    decorationBox = { innerTextField ->
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier.fillMaxSize(),
                        ) {
                            innerTextField()
                        }
                    },
                )

                if (i < otpLength - 1) {
                    Spacer(modifier = Modifier.width(12.dp))
                }
            }
        }
    }

    // Auto-focus first field
    LaunchedEffect(Unit) {
        focusRequesters[0].requestFocus()
    }
}
