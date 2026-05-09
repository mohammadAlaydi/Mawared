package com.mawared.dawliah.data.model

/**
 * Company branch location info.
 */
data class Branch(
    val id: String,
    val nameAr: String,
    val city: String,
    val district: String,
    val phone: String,
    val workingHoursAr: String,
    val latitude: Double,
    val longitude: Double,
)
