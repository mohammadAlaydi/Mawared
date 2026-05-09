package com.mawared.dawliah.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.EaseOutCubic
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.mawared.dawliah.ui.components.MawaredBottomNav
import com.mawared.dawliah.ui.navigation.Screen
import com.mawared.dawliah.ui.screens.branches.BranchesScreen
import com.mawared.dawliah.ui.screens.contracts.ContractsScreen
import com.mawared.dawliah.ui.screens.home.HomeScreen
import com.mawared.dawliah.ui.screens.more.MoreScreen
import com.mawared.dawliah.ui.screens.offers.OffersScreen
import com.mawared.dawliah.ui.screens.order.MyOrdersScreen
import com.mawared.dawliah.viewmodel.*

/**
 * Main scaffold with bottom navigation hosting 6 tabs (matching عون).
 * Tabs: الرئيسية, تعاقداتي, طلباتي, العروض, فروعنا, المزيد
 */
@Composable
fun MainScreen(
    rootNavController: NavHostController,
    authViewModel: AuthViewModel,
    homeViewModel: HomeViewModel,
    workersViewModel: WorkersViewModel,
    orderViewModel: OrderViewModel,
    profileViewModel: ProfileViewModel,
    contractsViewModel: ContractsViewModel,
) {
    val tabNavController = rememberNavController()
    val navBackStackEntry by tabNavController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route ?: Screen.Home.route

    Scaffold(
        bottomBar = {
            MawaredBottomNav(
                currentRoute = currentRoute,
                onTabSelected = { route ->
                    if (route != currentRoute) {
                        tabNavController.navigate(route) {
                            popUpTo(Screen.Home.route) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                },
            )
        },
    ) { innerPadding ->
        NavHost(
            navController = tabNavController,
            startDestination = Screen.Home.route,
            modifier = Modifier.padding(innerPadding),
            enterTransition = {
                fadeIn(animationSpec = tween(300, easing = EaseOutCubic)) +
                    scaleIn(initialScale = 0.96f, animationSpec = tween(300, easing = EaseOutCubic))
            },
            exitTransition = {
                fadeOut(animationSpec = tween(200))
            },
            popEnterTransition = {
                fadeIn(animationSpec = tween(300, easing = EaseOutCubic)) +
                    scaleIn(initialScale = 0.96f, animationSpec = tween(300, easing = EaseOutCubic))
            },
            popExitTransition = {
                fadeOut(animationSpec = tween(200))
            },
        ) {
            // Tab 1: الرئيسية (Home)
            composable(Screen.Home.route) {
                HomeScreen(
                    viewModel = homeViewModel,
                    authViewModel = authViewModel,
                    onServiceClick = { serviceId ->
                        rootNavController.navigate(Screen.ServicePackages.createRoute(serviceId))
                    },
                    onViewAllWorkers = {
                        rootNavController.navigate(Screen.Workers.route)
                    },
                    onWorkerClick = { workerId ->
                        rootNavController.navigate(Screen.WorkerDetail.createRoute(workerId))
                    },
                    onNotificationsClick = {
                        rootNavController.navigate(Screen.Notifications.route)
                    },
                )
            }

            // Tab 2: تعاقداتي (Contracts)
            composable(Screen.Contracts.route) {
                ContractsScreen(
                    viewModel = contractsViewModel,
                    onContractClick = { contractId ->
                        rootNavController.navigate(Screen.ContractDetail.createRoute(contractId))
                    },
                )
            }

            // Tab 3: طلباتي (My Orders)
            composable(Screen.MyOrders.route) {
                MyOrdersScreen(
                    viewModel = orderViewModel,
                    onOrderClick = { orderId ->
                        rootNavController.navigate(Screen.OrderDetail.createRoute(orderId))
                    },
                )
            }

            // Tab 4: العروض (Offers)
            composable(Screen.Offers.route) {
                OffersScreen()
            }

            // Tab 5: فروعنا (Branches)
            composable(Screen.Branches.route) {
                BranchesScreen()
            }

            // Tab 6: المزيد (More)
            composable(Screen.More.route) {
                MoreScreen(
                    profileViewModel = profileViewModel,
                    authViewModel = authViewModel,
                    onEditProfile = { rootNavController.navigate(Screen.EditProfile.route) },
                    onSaveList = { rootNavController.navigate(Screen.SaveList.route) },
                    onSavedAddresses = { rootNavController.navigate(Screen.SavedAddresses.route) },
                    onNotifications = { rootNavController.navigate(Screen.Notifications.route) },
                    onWorkers = { rootNavController.navigate(Screen.Workers.route) },
                    onServiceRequest = { rootNavController.navigate(Screen.ServiceRequest.route) },
                    onVerification = { rootNavController.navigate(Screen.Verification.route) },
                    onSupport = { rootNavController.navigate(Screen.Support.route) },
                    onTerms = { rootNavController.navigate(Screen.Terms.route) },
                    onPrivacy = { rootNavController.navigate(Screen.Privacy.route) },
                    onLogout = {
                        authViewModel.logout()
                        rootNavController.navigate(Screen.PhoneLogin.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    },
                )
            }
        }
    }
}
