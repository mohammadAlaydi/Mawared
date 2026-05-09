package com.mawared.dawliah.ui.navigation

import androidx.compose.animation.*
import androidx.compose.animation.core.EaseInOutCubic
import androidx.compose.animation.core.EaseOutCubic
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.mawared.dawliah.ui.screens.MainScreen
import com.mawared.dawliah.ui.screens.auth.*
import com.mawared.dawliah.ui.screens.legal.*
import com.mawared.dawliah.ui.screens.notifications.NotificationsScreen
import com.mawared.dawliah.ui.screens.onboarding.OnboardingScreen
import com.mawared.dawliah.ui.screens.order.*
import com.mawared.dawliah.ui.screens.services.PackagesScreen
import com.mawared.dawliah.ui.screens.services.ServiceRequestScreen
import com.mawared.dawliah.ui.screens.splash.SplashScreen
import com.mawared.dawliah.ui.screens.support.SupportScreen
import com.mawared.dawliah.ui.screens.tracking.OrderDetailScreen
import com.mawared.dawliah.ui.screens.verification.VerificationScreen
import com.mawared.dawliah.ui.screens.workers.*
import com.mawared.dawliah.ui.screens.profile.*
import com.mawared.dawliah.viewmodel.*

/**
 * Root navigation graph wiring all screens.
 */
@Composable
fun MawaredNavGraph(
    navController: NavHostController,
    authViewModel: AuthViewModel,
    homeViewModel: HomeViewModel,
    workersViewModel: WorkersViewModel,
    orderViewModel: OrderViewModel,
    profileViewModel: ProfileViewModel,
    contractsViewModel: ContractsViewModel,
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Splash.route,
        enterTransition = {
            fadeIn(animationSpec = tween(350, easing = EaseOutCubic)) +
                slideInHorizontally(animationSpec = tween(350, easing = EaseOutCubic)) { it / 3 }
        },
        exitTransition = {
            fadeOut(animationSpec = tween(250, easing = EaseInOutCubic)) +
                slideOutHorizontally(animationSpec = tween(250, easing = EaseInOutCubic)) { -it / 5 }
        },
        popEnterTransition = {
            fadeIn(animationSpec = tween(350, easing = EaseOutCubic)) +
                slideInHorizontally(animationSpec = tween(350, easing = EaseOutCubic)) { -it / 3 }
        },
        popExitTransition = {
            fadeOut(animationSpec = tween(250, easing = EaseInOutCubic)) +
                slideOutHorizontally(animationSpec = tween(250, easing = EaseInOutCubic)) { it / 5 }
        },
    ) {
        // ===== Splash =====
        composable(Screen.Splash.route) {
            SplashScreen(
                onNavigateToOnboarding = {
                    navController.navigate(Screen.Onboarding.route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                },
                onNavigateToHome = {
                    navController.navigate(Screen.Main.route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                },
                isLoggedIn = authViewModel.uiState.value.isLoggedIn,
            )
        }

        // ===== Onboarding =====
        composable(Screen.Onboarding.route) {
            OnboardingScreen(
                onFinish = {
                    authViewModel.setFirstLaunchDone()
                    navController.navigate(Screen.PhoneLogin.route) {
                        popUpTo(Screen.Onboarding.route) { inclusive = true }
                    }
                },
            )
        }

        // ===== Auth =====
        composable(Screen.PhoneLogin.route) {
            PhoneLoginScreen(
                viewModel = authViewModel,
                onOtpSent = { phone ->
                    navController.navigate(Screen.Otp.createRoute(phone))
                },
            )
        }

        composable(
            route = Screen.Otp.route,
            arguments = listOf(navArgument("phone") { type = NavType.StringType }),
        ) { backStackEntry ->
            val phone = backStackEntry.arguments?.getString("phone") ?: ""
            OtpScreen(
                phone = phone,
                viewModel = authViewModel,
                onVerified = {
                    navController.navigate(Screen.ProfileSetup.route) {
                        popUpTo(Screen.PhoneLogin.route) { inclusive = true }
                    }
                },
                onBack = { navController.popBackStack() },
            )
        }

        composable(Screen.ProfileSetup.route) {
            ProfileSetupScreen(
                viewModel = authViewModel,
                onComplete = {
                    navController.navigate(Screen.Main.route) {
                        popUpTo(0) { inclusive = true }
                    }
                },
                onSkip = {
                    navController.navigate(Screen.Main.route) {
                        popUpTo(0) { inclusive = true }
                    }
                },
            )
        }

        // ===== Main Scaffold (Bottom Nav — 6 tabs) =====
        composable(Screen.Main.route) {
            MainScreen(
                rootNavController = navController,
                authViewModel = authViewModel,
                homeViewModel = homeViewModel,
                workersViewModel = workersViewModel,
                orderViewModel = orderViewModel,
                profileViewModel = profileViewModel,
                contractsViewModel = contractsViewModel,
            )
        }

        // ===== Workers Flow =====
        composable(Screen.Workers.route) {
            WorkersScreen(
                viewModel = workersViewModel,
                onNationalityClick = { nationality ->
                    navController.navigate(Screen.NationalityWorkers.createRoute(nationality))
                },
                onSaveListClick = {
                    navController.navigate(Screen.SaveList.route)
                },
                onBack = { navController.popBackStack() },
            )
        }

        composable(
            route = Screen.NationalityWorkers.route,
            arguments = listOf(navArgument("nationality") { type = NavType.StringType }),
        ) { backStackEntry ->
            val nationality = backStackEntry.arguments?.getString("nationality") ?: ""
            NationalityWorkersScreen(
                nationality = nationality,
                viewModel = workersViewModel,
                onWorkerClick = { workerId ->
                    navController.navigate(Screen.WorkerDetail.createRoute(workerId))
                },
                onBack = { navController.popBackStack() },
            )
        }

        composable(
            route = Screen.WorkerDetail.route,
            arguments = listOf(navArgument("workerId") { type = NavType.StringType }),
        ) { backStackEntry ->
            val workerId = backStackEntry.arguments?.getString("workerId") ?: ""
            WorkerDetailScreen(
                workerId = workerId,
                viewModel = workersViewModel,
                onOrderClick = { worker ->
                    orderViewModel.selectWorker(worker)
                    navController.navigate(Screen.OrderStep1.route)
                },
                onBack = { navController.popBackStack() },
            )
        }

        composable(Screen.SaveList.route) {
            SaveListScreen(
                viewModel = workersViewModel,
                onWorkerClick = { workerId ->
                    navController.navigate(Screen.WorkerDetail.createRoute(workerId))
                },
                onBack = { navController.popBackStack() },
            )
        }

        // ===== Service Packages =====
        composable(
            route = Screen.ServicePackages.route,
            arguments = listOf(navArgument("serviceId") { type = NavType.StringType }),
        ) { backStackEntry ->
            val serviceId = backStackEntry.arguments?.getString("serviceId") ?: ""
            PackagesScreen(
                serviceId = serviceId,
                orderViewModel = orderViewModel,
                onPackageSelected = {
                    navController.navigate(Screen.OrderStep1.route)
                },
                onBack = { navController.popBackStack() },
            )
        }

        // ===== Service Request (طلب خدمة مقيمة) =====
        composable(Screen.ServiceRequest.route) {
            ServiceRequestScreen(
                onSubmit = { /* handled internally */ },
                onBack = { navController.popBackStack() },
            )
        }

        // ===== Order Flow =====
        composable(Screen.OrderStep1.route) {
            OrderStep1Screen(
                orderViewModel = orderViewModel,
                onNext = { navController.navigate(Screen.OrderStep2.route) },
                onBack = { navController.popBackStack() },
            )
        }

        composable(Screen.OrderStep2.route) {
            OrderStep2Screen(
                orderViewModel = orderViewModel,
                onNext = { navController.navigate(Screen.OrderStep3.route) },
                onBack = { navController.popBackStack() },
            )
        }

        composable(Screen.OrderStep3.route) {
            OrderStep3Screen(
                orderViewModel = orderViewModel,
                onNext = { navController.navigate(Screen.OrderStep4.route) },
                onBack = { navController.popBackStack() },
            )
        }

        composable(Screen.OrderStep4.route) {
            OrderStep4Screen(
                orderViewModel = orderViewModel,
                onPaymentComplete = {
                    val orderId = orderViewModel.uiState.value.placedOrderId ?: "MD-2025-000"
                    navController.navigate(Screen.OrderSuccess.createRoute(orderId)) {
                        popUpTo(Screen.Main.route)
                    }
                },
                onBack = { navController.popBackStack() },
            )
        }

        composable(
            route = Screen.OrderSuccess.route,
            arguments = listOf(navArgument("orderId") { type = NavType.StringType }),
        ) { backStackEntry ->
            val orderId = backStackEntry.arguments?.getString("orderId") ?: ""
            OrderSuccessScreen(
                orderId = orderId,
                onTrackOrder = {
                    navController.navigate(Screen.OrderDetail.createRoute("o1")) {
                        popUpTo(Screen.Main.route)
                    }
                },
                onGoHome = {
                    orderViewModel.resetOrder()
                    navController.navigate(Screen.Main.route) {
                        popUpTo(0) { inclusive = true }
                    }
                },
            )
        }

        // ===== Order Detail / Tracking =====
        composable(
            route = Screen.OrderDetail.route,
            arguments = listOf(navArgument("orderId") { type = NavType.StringType }),
        ) { backStackEntry ->
            val orderId = backStackEntry.arguments?.getString("orderId") ?: ""
            OrderDetailScreen(
                orderId = orderId,
                orderViewModel = orderViewModel,
                onBack = { navController.popBackStack() },
            )
        }

        // ===== Profile Sub-Screens =====
        composable(Screen.Notifications.route) {
            NotificationsScreen(
                viewModel = profileViewModel,
                onBack = { navController.popBackStack() },
            )
        }

        composable(Screen.SavedAddresses.route) {
            SavedAddressesScreen(
                viewModel = profileViewModel,
                onBack = { navController.popBackStack() },
            )
        }

        composable(Screen.Verification.route) {
            VerificationScreen(
                viewModel = profileViewModel,
                onBack = { navController.popBackStack() },
            )
        }

        composable(Screen.Support.route) {
            SupportScreen(onBack = { navController.popBackStack() })
        }

        composable(Screen.Terms.route) {
            TermsScreen(onBack = { navController.popBackStack() })
        }

        composable(Screen.Privacy.route) {
            PrivacyScreen(onBack = { navController.popBackStack() })
        }
    }
}
