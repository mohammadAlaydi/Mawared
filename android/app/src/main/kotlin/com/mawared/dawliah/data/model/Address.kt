package com.mawared.dawliah.data.model

/**
 * Saved delivery address for order placement.
 */
data class Address(
    val id: String,
    val label: String,
    val city: String,
    val district: String,
    val street: String,
    val buildingNumber: String,
    val additionalNotes: String = "",
)
