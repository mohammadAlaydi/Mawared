package com.mawared.dawliah.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable

/**
 * Main navigation graph — skeleton for Phase 0.
 * All destinations are stubbed and will be implemented in Phase 1.
 */
@Composable
fun MawaredNavGraph(
    navController: NavHostController,
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Splash.route,
    ) {
        // Pre-Auth
        composable(Screen.Splash.route) {
            // TODO: implement SplashScreen
        }
        composable(Screen.Onboarding.route) {
            // TODO: implement OnboardingScreen
        }

        // Auth
        composable(Screen.PhoneLogin.route) {
            // TODO: implement PhoneLoginScreen
        }
        composable(Screen.Otp.route) {
            // TODO: implement OtpScreen
        }
        composable(Screen.ProfileSetup.route) {
            // TODO: implement ProfileSetupScreen
        }

        // Main (Bottom Nav)
        composable(Screen.Main.route) {
            // TODO: implement MainScreen with BottomNav
        }

        // Service Flow
        composable(Screen.ServicePackages.route) {
            // TODO: implement PackagesScreen
        }

        // Order Flow
        composable(Screen.OrderStep1.route) {
            // TODO: implement OrderStep1Screen
        }
        composable(Screen.OrderStep2.route) {
            // TODO: implement OrderStep2Screen
        }
        composable(Screen.OrderStep3.route) {
            // TODO: implement OrderStep3Screen
        }
        composable(Screen.OrderStep4.route) {
            // TODO: implement OrderStep4Screen
        }
        composable(Screen.OrderSuccess.route) {
            // TODO: implement OrderSuccessScreen
        }

        // Workers
        composable(Screen.WorkerDetail.route) {
            // TODO: implement WorkerDetailScreen
        }
        composable(Screen.Favorites.route) {
            // TODO: implement FavoritesScreen
        }

        // Orders
        composable(Screen.OrderDetail.route) {
            // TODO: implement OrderDetailScreen
        }

        // Profile sections
        composable(Screen.EditProfile.route) {
            // TODO: implement EditProfileScreen
        }
        composable(Screen.SavedAddresses.route) {
            // TODO: implement SavedAddressesScreen
        }
        composable(Screen.Verification.route) {
            // TODO: implement VerificationScreen
        }
        composable(Screen.Notifications.route) {
            // TODO: implement NotificationsScreen
        }
        composable(Screen.Support.route) {
            // TODO: implement SupportScreen
        }
        composable(Screen.Terms.route) {
            // TODO: implement TermsScreen
        }
        composable(Screen.Privacy.route) {
            // TODO: implement PrivacyScreen
        }
    }
}
