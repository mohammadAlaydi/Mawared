package com.mawared.dawliah.data.model

/**
 * Worker/CV model representing a domestic worker available for recruitment.
 * Used across worker listings, CV details, order flow, and favorites.
 */
data class Worker(
    val id: String,
    val nameAr: String,
    val photoUrl: String,
    val profession: WorkerProfession,
    val nationality: String,
    val nationalityFlagEmoji: String,
    val experienceYears: Int,
    val ageYears: Int,
    val monthlySalary: Int,
    val isAvailable: Boolean,
    val languages: List<String>,
    val skills: List<String>,
    val bio: String,
    val isFavorite: Boolean = false,
)

/**
 * Worker profession enum with Arabic display labels.
 */
enum class WorkerProfession(val labelAr: String) {
    DOMESTIC_WORKER("عاملة منزلية"),
    DRIVER("سائق"),
    CAREGIVER_ELDERLY("رعاية مسنين"),
    CAREGIVER_CHILD("مربية أطفال"),
}
