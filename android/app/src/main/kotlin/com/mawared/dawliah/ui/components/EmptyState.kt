package com.mawared.dawliah.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.mawared.dawliah.ui.theme.TextHint
import com.mawared.dawliah.ui.theme.TextPrimary

/**
 * Empty state composable with illustration, title, optional subtitle, and optional CTA.
 */
@Composable
fun EmptyState(
    title: String,
    subtitle: String? = null,
    actionText: String? = null,
    onAction: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        // Placeholder icon instead of Lottie (since Lottie JSON files are stubs)
        Text(
            text = "📭",
            style = MaterialTheme.typography.displayLarge,
            modifier = Modifier.padding(bottom = 16.dp),
        )

        Text(
            text = title,
            style = MaterialTheme.typography.headlineMedium,
            color = TextPrimary,
            textAlign = TextAlign.Center,
        )

        if (subtitle != null) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = TextHint,
                textAlign = TextAlign.Center,
            )
        }

        if (actionText != null && onAction != null) {
            Spacer(modifier = Modifier.height(20.dp))
            PrimaryButton(
                text = actionText,
                onClick = onAction,
                modifier = Modifier.width(200.dp),
            )
        }
    }
}
