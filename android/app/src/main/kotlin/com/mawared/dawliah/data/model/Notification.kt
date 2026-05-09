package com.mawared.dawliah.data.model

/**
 * In-app notification model.
 */
data class Notification(
    val id: String,
    val title: String,
    val body: String,
    val type: NotificationType,
    val relatedOrderId: String? = null,
    val time: String,
    val timeGroup: String = "اليوم",
    val isRead: Boolean = false,
)

/**
 * Notification categories for icon/color styling.
 */
enum class NotificationType {
    ORDER_UPDATE,
    PROMOTION,
    SYSTEM,
    SUCCESS,
}
