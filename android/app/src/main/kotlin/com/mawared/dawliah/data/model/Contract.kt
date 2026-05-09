package com.mawared.dawliah.data.model

/**
 * Contract representing an active/expired domestic worker service agreement.
 */
data class Contract(
    val id: String,
    val contractNumber: String,
    val workerName: String,
    val workerPhotoUrl: String,
    val profession: WorkerProfession,
    val nationality: String,
    val nationalityFlag: String,
    val startDate: String,
    val endDate: String,
    val monthlySalary: Int,
    val status: ContractStatus,
    val city: String,
)

enum class ContractStatus(val labelAr: String) {
    ACTIVE("نشط"),
    EXPIRED("منتهي"),
    PENDING_RENEWAL("بانتظار التجديد"),
}
