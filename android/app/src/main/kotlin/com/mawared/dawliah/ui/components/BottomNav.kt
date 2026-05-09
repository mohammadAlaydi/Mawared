package com.mawared.dawliah.ui.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ListAlt
import androidx.compose.material.icons.automirrored.outlined.ListAlt
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.mawared.dawliah.ui.navigation.Screen
import com.mawared.dawliah.ui.theme.*

data class BottomNavItem(
    val route: String,
    val label: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector,
)

/**
 * 6 bottom nav items matching عون's tab structure.
 * Order: الرئيسية, تعاقداتي, طلباتي, العروض, فروعنا, المزيد
 */
val bottomNavItems = listOf(
    BottomNavItem(Screen.Home.route, "الرئيسية", Icons.Filled.Home, Icons.Outlined.Home),
    BottomNavItem(Screen.Contracts.route, "تعاقداتي", Icons.Filled.Handshake, Icons.Outlined.Handshake),
    BottomNavItem(Screen.MyOrders.route, "طلباتي", Icons.AutoMirrored.Filled.ListAlt, Icons.AutoMirrored.Outlined.ListAlt),
    BottomNavItem(Screen.Offers.route, "العروض", Icons.Filled.LocalOffer, Icons.Outlined.LocalOffer),
    BottomNavItem(Screen.Branches.route, "فروعنا", Icons.Filled.LocationOn, Icons.Outlined.LocationOn),
    BottomNavItem(Screen.More.route, "المزيد", Icons.Filled.Menu, Icons.Outlined.Menu),
)

/**
 * Material3 bottom navigation bar with 6 tabs.
 */
@Composable
fun MawaredBottomNav(
    currentRoute: String,
    onTabSelected: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    NavigationBar(
        containerColor = SurfaceWhite,
        contentColor = TextSecondary,
        modifier = modifier,
        tonalElevation = 4.dp,
    ) {
        bottomNavItems.forEach { item ->
            val isSelected = currentRoute == item.route

            NavigationBarItem(
                selected = isSelected,
                onClick = { onTabSelected(item.route) },
                icon = {
                    Icon(
                        imageVector = if (isSelected) item.selectedIcon else item.unselectedIcon,
                        contentDescription = item.label,
                    )
                },
                label = {
                    Text(
                        text = item.label,
                        style = MaterialTheme.typography.labelSmall,
                        maxLines = 1,
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = PrimaryGreen,
                    selectedTextColor = PrimaryGreen,
                    unselectedIconColor = TextSecondary,
                    unselectedTextColor = TextSecondary,
                    indicatorColor = PrimaryGreen.copy(alpha = 0.12f),
                ),
            )
        }
    }
}
