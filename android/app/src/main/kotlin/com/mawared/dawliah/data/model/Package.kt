package com.mawared.dawliah.data.model

/**
 * Service package representing a pricing/duration tier for a service.
 */
data class ServicePackage(
    val id: String,
    val nameAr: String,
    val descriptionAr: String,
    val serviceId: String,
    val type: PackageType,
    val durationValue: Int,
    val durationUnit: String,
    val price: Int,
    val features: List<String>,
    val isPopular: Boolean = false,
)

/**
 * Package billing type — hourly or monthly.
 */
enum class PackageType(val labelAr: String) {
    HOURLY("بالساعة"),
    MONTHLY("شهري"),
}
