package com.mawared.dawliah.data.remote

import com.mawared.dawliah.data.model.Address
import com.mawared.dawliah.data.model.Notification
import com.mawared.dawliah.data.model.NotificationType
import com.mawared.dawliah.data.model.Order
import com.mawared.dawliah.data.model.OrderStatus
import com.mawared.dawliah.data.model.OrderStatusUpdate
import com.mawared.dawliah.data.model.ServiceCategory
import com.mawared.dawliah.data.model.ServicePackage
import com.mawared.dawliah.data.model.PackageType
import com.mawared.dawliah.data.model.Worker
import com.mawared.dawliah.data.model.WorkerProfession
import com.mawared.api.Address as ApiAddress
import com.mawared.api.NotificationItem as ApiNotification
import com.mawared.api.Order as ApiOrder
import com.mawared.api.ServiceCategory as ApiService
import com.mawared.api.ServicePackage as ApiPackage
import com.mawared.api.Worker as ApiWorker

/**
 * One-way DTO → domain mappers. The Composable layer continues consuming
 * the existing domain models so we don't have to touch every screen.
 *
 * Two cross-cutting impedance mismatches handled here:
 *
 *  1. **Money**: API returns BigInt-string halalas + currency code; domain
 *     keeps a plain `Int` SAR amount. We divide by 100 and assume SAR
 *     until the project goes multi-currency.
 *
 *  2. **Profession enum**: API returns an uppercase string; the existing
 *     domain enum is a fine 1:1 match — anything unrecognized falls back
 *     to DOMESTIC_WORKER.
 *
 * Anything that's safer not to fudge (rating decimals, nationality icons)
 * is parsed defensively.
 */

internal fun ApiService.toDomain(): ServiceCategory = ServiceCategory(
    id = id,
    nameAr = nameAr,
    descriptionAr = "", // backend's descriptionAr is optional + nullable on this DTO
    iconName = iconNameForProfession(profession),
    profession = professionFromCode(profession),
)

internal fun ApiWorker.toDomain(): Worker = Worker(
    id = id,
    nameAr = fullNameAr,
    photoUrl = "", // photo URL comes from a separate /v1/files lookup — TODO when wired
    profession = professionFromCode(profession),
    nationality = nationality?.nameAr ?: "",
    nationalityFlagEmoji = nationality?.flagEmoji ?: "🏳️",
    experienceYears = experienceYears,
    ageYears = ageYears,
    monthlySalary = minorToMajor(monthlySalaryMinor),
    isAvailable = availability == "AVAILABLE",
    languages = languages?.map { it.language.nameAr } ?: emptyList(),
    skills = skills?.map { it.skill.nameAr } ?: emptyList(),
    bio = bioAr,
    rating = rating.toFloatOrNull() ?: 4.0f,
    isFavorite = false,
)

internal fun ApiAddress.toDomain(): Address = Address(
    id = id,
    label = label,
    city = city,
    district = district,
    street = street,
    buildingNumber = buildingNumber,
    additionalNotes = additionalNotes ?: "",
)

internal fun ApiNotification.toDomain(): Notification = Notification(
    id = id,
    title = titleAr,
    body = bodyAr,
    type = notificationTypeFromCode(type),
    relatedOrderId = relatedOrderId,
    time = createdAt, // raw ISO; UI formatters can pretty-print
    timeGroup = "",
    isRead = readAt != null,
)

internal fun ApiPackage.toDomain(): ServicePackage = ServicePackage(
    id = id,
    nameAr = nameAr,
    descriptionAr = "",
    serviceId = serviceId,
    type = if (type == "HOURLY") PackageType.HOURLY else PackageType.MONTHLY,
    durationValue = durationValue,
    durationUnit = durationUnit,
    price = minorToMajor(priceMinor),
    features = emptyList(),
    isPopular = isPopular,
)

/**
 * API list-of-orders → domain `Order`. The backend list response is flat
 * (only IDs and money fields), so we synthesize placeholder nested objects.
 * Replace these by enriching via `api.orders.findById(id)` when the user
 * opens a detail screen.
 */
internal fun ApiOrder.toDomainShallow(): Order {
    val placeholderService = ServiceCategory(
        id = "",
        nameAr = "—",
        descriptionAr = "",
        iconName = "briefcase",
        profession = WorkerProfession.DOMESTIC_WORKER,
    )
    val placeholderPackage = ServicePackage(
        id = "",
        nameAr = "—",
        descriptionAr = "",
        serviceId = "",
        type = PackageType.MONTHLY,
        durationValue = 1,
        durationUnit = "MONTH",
        price = minorToMajor(totalMinor),
        features = emptyList(),
        isPopular = false,
    )
    val placeholderAddress = Address(
        id = "",
        label = "—",
        city = "",
        district = "",
        street = "",
        buildingNumber = "",
        additionalNotes = "",
    )
    return Order(
        id = id,
        orderNumber = orderNumber,
        service = placeholderService,
        selectedPackage = placeholderPackage,
        worker = null,
        address = placeholderAddress,
        notes = "",
        status = orderStatusFromCode(status),
        totalPrice = minorToMajor(totalMinor),
        placedAt = placedAt ?: createdAt,
        statusHistory = listOf(
            OrderStatusUpdate(
                status = orderStatusFromCode(status),
                timestamp = createdAt,
            )
        ),
    )
}

/**
 * Maps the backend's 11-state UPPERCASE enum down onto the UI's 10-state
 * customer-facing enum. Tracked in the spec under "10 customer-facing
 * statuses" — see `apps/backend/.../OrderStatusLabelMapper` for the same
 * mapping on the server side.
 */
private fun orderStatusFromCode(code: String): OrderStatus = when (code) {
    "DRAFT", "RESERVED" -> OrderStatus.SUBMITTED
    "PAYMENT_PENDING", "PAYMENT_FAILED" -> OrderStatus.PAYMENT_PENDING
    "PAID" -> OrderStatus.PAYMENT_COMPLETED
    "UNDER_REVIEW" -> OrderStatus.UNDER_REVIEW
    "CONFIRMED" -> OrderStatus.CONTRACT_IN_PROGRESS
    "IN_PROGRESS" -> OrderStatus.ARRIVAL_IN_PROGRESS
    "COMPLETED" -> OrderStatus.COMPLETED
    "CANCELLED", "REFUNDED" -> OrderStatus.CANCELLED
    else -> OrderStatus.SUBMITTED
}

private fun notificationTypeFromCode(code: String): NotificationType = when (code) {
    "ORDER_UPDATE", "CONTRACT" -> NotificationType.ORDER_UPDATE
    "PROMOTION" -> NotificationType.PROMOTION
    "PAYMENT" -> NotificationType.SUCCESS
    else -> NotificationType.SYSTEM
}

private fun professionFromCode(code: String): WorkerProfession = when (code) {
    "DOMESTIC_WORKER" -> WorkerProfession.DOMESTIC_WORKER
    "DRIVER" -> WorkerProfession.DRIVER
    "CAREGIVER_ELDERLY" -> WorkerProfession.CAREGIVER_ELDERLY
    "CAREGIVER_CHILD" -> WorkerProfession.CAREGIVER_CHILD
    else -> WorkerProfession.DOMESTIC_WORKER
}

private fun iconNameForProfession(code: String): String = when (code) {
    "DOMESTIC_WORKER" -> "home"
    "DRIVER" -> "car"
    "CAREGIVER_ELDERLY" -> "heart"
    "CAREGIVER_CHILD" -> "baby"
    else -> "briefcase"
}

/**
 * BigInt-string halalas → integer SAR. SAR fits comfortably in `Int` up to
 * ~21M SAR per item, which is well above any realistic salary or order
 * total. If/when the app goes multi-currency, swap the domain model to
 * `Long` + currency code.
 */
private fun minorToMajor(minor: String): Int {
    val long = minor.toLongOrNull() ?: return 0
    return (long / 100L).toInt()
}
