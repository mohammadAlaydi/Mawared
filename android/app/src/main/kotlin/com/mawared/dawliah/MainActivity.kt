package com.mawared.dawliah

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.mawared.dawliah.ui.theme.AccentGold
import com.mawared.dawliah.ui.theme.CairoFamily
import com.mawared.dawliah.ui.theme.MawaredTheme
import com.mawared.dawliah.ui.theme.PrimaryGreen
import com.mawared.dawliah.ui.theme.SurfaceWhite

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            MawaredTheme {
                // Phase 0: Basic splash placeholder. Full NavGraph in Phase 1.
                Phase0SplashPlaceholder()
            }
        }
    }
}

/**
 * Minimal splash placeholder for Phase 0 — just background + app name.
 * Will be replaced by full NavGraph + SplashScreen in Phase 1.
 */
@Composable
private fun Phase0SplashPlaceholder() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(PrimaryGreen),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "موارد الدولية",
                fontFamily = CairoFamily,
                fontWeight = FontWeight.Bold,
                fontSize = 28.sp,
                color = SurfaceWhite,
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "خدمك، راحتك",
                fontFamily = CairoFamily,
                fontWeight = FontWeight.Normal,
                fontSize = 16.sp,
                color = AccentGold,
            )
        }
    }
}
