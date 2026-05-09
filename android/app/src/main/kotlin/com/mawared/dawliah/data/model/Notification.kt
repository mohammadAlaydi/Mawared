package com.mawared.dawliah.data.model

/**
 * In-app notification model.
 */
data class Notification(
    val id: String,
    val titleAr: String,
    val bodyAr: String,
    val type: NotificationType,
    val relatedOrderId: String? = null,
    val timestamp: String,
    val isRead: Boolean = false,
)

/**
 * Notification categories for icon/color styling.
 */
enum class NotificationType {
    ORDER_UPDATE,
    PROMOTION,
    SYSTEM,
    PAYMENT,
    VERIFICATION,
}
