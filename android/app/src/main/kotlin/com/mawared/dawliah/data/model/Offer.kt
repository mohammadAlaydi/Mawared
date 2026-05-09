package com.mawared.dawliah.data.model

/**
 * Promotional offer with discount details and promo code.
 */
data class Offer(
    val id: String,
    val titleAr: String,
    val descriptionAr: String,
    val discountPercent: Int,
    val promoCode: String,
    val expiryDate: String,
    val isActive: Boolean = true,
    val badgeText: String? = null,
)
