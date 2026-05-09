package com.mawared.dawliah.data.mock

import com.mawared.dawliah.data.model.Contract
import com.mawared.dawliah.data.model.ContractStatus
import com.mawared.dawliah.data.model.WorkerProfession

object MockContracts {
    val all: List<Contract> = listOf(
        Contract(
            id = "c1",
            contractNumber = "MW-2025-0012",
            workerName = "ماريا سانتوس",
            workerPhotoUrl = "https://randomuser.me/api/portraits/women/1.jpg",
            profession = WorkerProfession.DOMESTIC_WORKER,
            nationality = "فلبينية",
            nationalityFlag = "🇵🇭",
            startDate = "2025-01-15",
            endDate = "2027-01-14",
            monthlySalary = 1800,
            status = ContractStatus.ACTIVE,
            city = "الرياض",
        ),
        Contract(
            id = "c2",
            contractNumber = "MW-2024-0087",
            workerName = "راجيش كومار",
            workerPhotoUrl = "https://randomuser.me/api/portraits/men/1.jpg",
            profession = WorkerProfession.DRIVER,
            nationality = "هندية",
            nationalityFlag = "🇮🇳",
            startDate = "2024-03-01",
            endDate = "2025-02-28",
            monthlySalary = 2500,
            status = ContractStatus.EXPIRED,
            city = "جدة",
        ),
        Contract(
            id = "c3",
            contractNumber = "MW-2025-0145",
            workerName = "جوسلين كروز",
            workerPhotoUrl = "https://randomuser.me/api/portraits/women/9.jpg",
            profession = WorkerProfession.CAREGIVER_ELDERLY,
            nationality = "فلبينية",
            nationalityFlag = "🇵🇭",
            startDate = "2025-04-01",
            endDate = "2025-09-30",
            monthlySalary = 2200,
            status = ContractStatus.PENDING_RENEWAL,
            city = "الدمام",
        ),
        Contract(
            id = "c4",
            contractNumber = "MW-2025-0201",
            workerName = "ليزا ماكارايج",
            workerPhotoUrl = "https://randomuser.me/api/portraits/women/12.jpg",
            profession = WorkerProfession.CAREGIVER_CHILD,
            nationality = "فلبينية",
            nationalityFlag = "🇵🇭",
            startDate = "2025-06-01",
            endDate = "2027-05-31",
            monthlySalary = 2000,
            status = ContractStatus.ACTIVE,
            city = "الرياض",
        ),
    )

    fun getByStatus(status: ContractStatus): List<Contract> =
        all.filter { it.status == status }
}
