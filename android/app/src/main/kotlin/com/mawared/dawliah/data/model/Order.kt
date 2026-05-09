package com.mawared.dawliah.data.model

import androidx.compose.ui.graphics.Color
import com.mawared.dawliah.ui.theme.*

/**
 * Order model representing a customer's service request.
 */
data class Order(
    val id: String,
    val orderNumber: String,
    val service: ServiceCategory,
    val selectedPackage: ServicePackage,
    val worker: Worker?,
    val address: Address,
    val notes: String,
    val status: OrderStatus,
    val totalPrice: Int,
    val placedAt: String,
    val statusHistory: List<OrderStatusUpdate>,
)

/**
 * Order status enum with Arabic labels and chip colors.
 */
enum class OrderStatus(val labelAr: String, val color: Color) {
    SUBMITTED("تم الإرسال", ChipSubmitted),
    PAYMENT_PENDING("بانتظار الدفع", StatusWarning),
    PAYMENT_COMPLETED("تم الدفع", StatusInfo),
    UNDER_REVIEW("قيد المراجعة", StatusInfo),
    PROCESSING("جاري المعالجة", ChipProcessing),
    WORKER_SELECTED("تم اختيار العامل", AccentGold),
    CONTRACT_IN_PROGRESS("العقد قيد الإعداد", AccentGold),
    ARRIVAL_IN_PROGRESS("العامل في الطريق", AccentGold),
    COMPLETED("مكتمل", ChipCompleted),
    CANCELLED("ملغى", ChipCancelled),
}

/**
 * A single status update entry in the order timeline.
 */
data class OrderStatusUpdate(
    val status: OrderStatus,
    val timestamp: String,
    val note: String = "",
)
