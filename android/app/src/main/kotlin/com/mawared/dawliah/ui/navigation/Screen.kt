package com.mawared.dawliah.ui.navigation

/**
 * Sealed class defining all navigation routes in the app.
 */
sealed class Screen(val route: String) {
    // ===== Pre-Auth =====
    data object Splash : Screen("splash")
    data object Onboarding : Screen("onboarding")

    // ===== Auth =====
    data object PhoneLogin : Screen("auth/phone_login")
    data object Otp : Screen("auth/otp/{phone}") {
        fun createRoute(phone: String) = "auth/otp/$phone"
    }
    data object ProfileSetup : Screen("auth/profile_setup")

    // ===== Main (Bottom Nav container) =====
    data object Main : Screen("main")

    // ===== Home Tab =====
    data object Home : Screen("home")

    // ===== Workers Tab =====
    data object Workers : Screen("workers")
    data object WorkerDetail : Screen("workers/detail/{workerId}") {
        fun createRoute(workerId: String) = "workers/detail/$workerId"
    }
    data object Favorites : Screen("workers/favorites")

    // ===== Orders Tab =====
    data object MyOrders : Screen("my_orders")
    data object OrderDetail : Screen("orders/detail/{orderId}") {
        fun createRoute(orderId: String) = "orders/detail/$orderId"
    }

    // ===== Profile Tab =====
    data object Profile : Screen("profile")
    data object EditProfile : Screen("profile/edit")
    data object SavedAddresses : Screen("profile/addresses")
    data object Verification : Screen("profile/verification")
    data object Notifications : Screen("notifications")
    data object Support : Screen("support")
    data object Terms : Screen("legal/terms")
    data object Privacy : Screen("legal/privacy")

    // ===== Service Flow =====
    data object ServicePackages : Screen("services/packages/{serviceId}") {
        fun createRoute(serviceId: String) = "services/packages/$serviceId"
    }

    // ===== Order Flow =====
    data object OrderStep1 : Screen("order/step1")
    data object OrderStep2 : Screen("order/step2")
    data object OrderStep3 : Screen("order/step3")
    data object OrderStep4 : Screen("order/step4")
    data object OrderSuccess : Screen("order/success/{orderId}") {
        fun createRoute(orderId: String) = "order/success/$orderId"
    }
}
