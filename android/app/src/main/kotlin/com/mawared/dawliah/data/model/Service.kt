package com.mawared.dawliah.data.model

/**
 * Service category representing a type of domestic service offered.
 */
data class ServiceCategory(
    val id: String,
    val nameAr: String,
    val descriptionAr: String,
    val iconName: String,
    val profession: WorkerProfession,
)
