package com.mawared.api

import com.squareup.moshi.JsonClass

// ===== Auth =====

@JsonClass(generateAdapter = true)
data class OtpRequest(val phone: String, val locale: String = "ar")

@JsonClass(generateAdapter = true)
data class OtpVerify(
    val phone: String,
    val code: String,
    val deviceId: String,
    val deviceName: String? = null,
)

@JsonClass(generateAdapter = true)
data class RefreshRequest(val refreshToken: String)

@JsonClass(generateAdapter = true)
data class LogoutRequest(val refreshToken: String)

@JsonClass(generateAdapter = true)
data class AuthResponse(
    val tokenType: String,
    val accessToken: String,
    val refreshToken: String,
    val accessTokenExpiresInSec: Long,
    val refreshTokenExpiresInSec: Long,
    val user: UserSummary,
)

@JsonClass(generateAdapter = true)
data class UserSummary(
    val id: String,
    val role: String,
    val phoneE164: String? = null,
    val email: String? = null,
)

// ===== Workers / catalog =====

@JsonClass(generateAdapter = true)
data class WorkersPage(val items: List<Worker>, val nextCursor: String? = null)

@JsonClass(generateAdapter = true)
data class Worker(
    val id: String,
    val fullNameAr: String,
    val fullNameEn: String? = null,
    val profession: String,
    val ageYears: Int,
    val experienceYears: Int,
    val bioAr: String,
    val bioEn: String? = null,
    val rating: String,
    val reviewCount: Int,
    val monthlySalaryMinor: String,
    val currency: String,
    val availability: String,
    val nationality: Nationality? = null,
    val languages: List<WorkerLanguage>? = null,
    val skills: List<WorkerSkill>? = null,
)

@JsonClass(generateAdapter = true)
data class Nationality(val code: String, val nameAr: String, val nameEn: String, val flagEmoji: String)

@JsonClass(generateAdapter = true)
data class WorkerLanguage(val language: Language, val proficiency: String)

@JsonClass(generateAdapter = true)
data class Language(val code: String, val nameAr: String, val nameEn: String)

@JsonClass(generateAdapter = true)
data class WorkerSkill(val skill: Skill)

@JsonClass(generateAdapter = true)
data class Skill(val slug: String, val nameAr: String, val nameEn: String)

@JsonClass(generateAdapter = true)
data class ServiceListResponse(val items: List<ServiceCategory>)

@JsonClass(generateAdapter = true)
data class ServiceCategory(
    val id: String,
    val slug: String,
    val nameAr: String,
    val nameEn: String? = null,
    val profession: String,
    val displayOrder: Int,
    val isActive: Boolean,
)

@JsonClass(generateAdapter = true)
data class PackageListResponse(val items: List<ServicePackage>)

@JsonClass(generateAdapter = true)
data class ServicePackage(
    val id: String,
    val serviceId: String,
    val nameAr: String,
    val nameEn: String? = null,
    val type: String,
    val durationValue: Int,
    val durationUnit: String,
    val priceMinor: String,
    val currency: String,
    val isPopular: Boolean,
    val isActive: Boolean,
)

@JsonClass(generateAdapter = true)
data class BranchListResponse(val items: List<Branch>)

@JsonClass(generateAdapter = true)
data class Branch(
    val id: String,
    val code: String,
    val nameAr: String,
    val nameEn: String? = null,
    val city: String,
    val phoneE164: String,
    val workingHoursAr: String,
    val workingHoursEn: String? = null,
    val latitude: String,
    val longitude: String,
)

// ===== Orders =====

@JsonClass(generateAdapter = true)
data class CreateOrderRequest(
    val workerId: String,
    val packageId: String,
    val addressId: String,
    val promoCode: String? = null,
    val notes: String? = null,
)

@JsonClass(generateAdapter = true)
data class Order(
    val id: String,
    val orderNumber: String,
    val status: String,
    val subtotalMinor: String,
    val discountMinor: String,
    val vatMinor: String,
    val totalMinor: String,
    val currency: String,
    val placedAt: String? = null,
    val confirmedAt: String? = null,
    val completedAt: String? = null,
    val cancelledAt: String? = null,
    val createdAt: String,
)

@JsonClass(generateAdapter = true)
data class OrderListResponse(val items: List<Order>)

@JsonClass(generateAdapter = true)
data class CancelOrderRequest(val reason: String = "CUSTOMER_REQUEST", val note: String? = null)

@JsonClass(generateAdapter = true)
data class TransitionResponse(val from: String, val to: String)

// ===== Payments =====

@JsonClass(generateAdapter = true)
data class CreatePaymentIntentRequest(val orderId: String)

@JsonClass(generateAdapter = true)
data class PaymentIntentResponse(
    val providerIntentId: String,
    val clientSecret: String,
    val amountMinor: String,
    val currency: String,
)

// ===== Addresses =====

@JsonClass(generateAdapter = true)
data class Address(
    val id: String,
    val label: String,
    val city: String,
    val district: String,
    val street: String,
    val buildingNumber: String,
    val additionalNotes: String? = null,
    val latitude: String? = null,
    val longitude: String? = null,
    val isDefault: Boolean,
)

@JsonClass(generateAdapter = true)
data class AddressListResponse(val items: List<Address>)

@JsonClass(generateAdapter = true)
data class CreateAddressRequest(
    val label: String,
    val city: String,
    val district: String,
    val street: String,
    val buildingNumber: String,
    val additionalNotes: String? = null,
    val isDefault: Boolean? = null,
)

// ===== Notifications =====

@JsonClass(generateAdapter = true)
data class NotificationItem(
    val id: String,
    val type: String,
    val titleAr: String,
    val bodyAr: String,
    val titleEn: String? = null,
    val bodyEn: String? = null,
    val relatedOrderId: String? = null,
    val readAt: String? = null,
    val createdAt: String,
)

@JsonClass(generateAdapter = true)
data class NotificationListResponse(val items: List<NotificationItem>)

@JsonClass(generateAdapter = true)
data class RegisterDeviceRequest(
    val token: String,
    val platform: String = "ANDROID",
    val appVersion: String? = null,
    val locale: String? = null,
)

// ===== Offers =====

@JsonClass(generateAdapter = true)
data class OfferListResponse(val items: List<Offer>)

@JsonClass(generateAdapter = true)
data class Offer(
    val id: String,
    val code: String,
    val titleAr: String,
    val titleEn: String? = null,
    val descriptionAr: String? = null,
    val discountPercent: Int? = null,
    val discountMinor: String? = null,
    val currency: String,
    val validFrom: String,
    val validUntil: String,
)

// ===== RFC 7807 error =====

@JsonClass(generateAdapter = true)
data class ApiProblem(
    val type: String? = null,
    val title: String,
    val status: Int,
    val code: String,
    val detail: String,
    val instance: String? = null,
    val requestId: String? = null,
    val errors: List<FieldError>? = null,
)

@JsonClass(generateAdapter = true)
data class FieldError(val path: String, val message: String)

class ApiException(val problem: ApiProblem) : RuntimeException("[${problem.status} ${problem.code}] ${problem.detail}")

// ===== Public marketing-site stats =====

@JsonClass(generateAdapter = true)
data class PublicStats(
    val verifiedCustomerCount: Int,
    val availableWorkerCount: Int,
    val nationalityCount: Int,
    val averageWorkerRating: Double,
    val computedAt: String,
)

// ===== Admin reports =====

@JsonClass(generateAdapter = true)
data class RevenueBucket(
    val currency: String,
    val minor: String,
)

@JsonClass(generateAdapter = true)
data class RevenueDayBucket(
    val day: String,
    val currency: String,
    val minor: String,
)

@JsonClass(generateAdapter = true)
data class OverviewRevenue(
    val yesterday: List<RevenueBucket>,
    val dayBefore: List<RevenueBucket>,
    val last30Days: List<RevenueDayBucket>,
)

@JsonClass(generateAdapter = true)
data class OrdersByStatusCount(
    val status: String,
    val count: Int,
)

@JsonClass(generateAdapter = true)
data class WorkersByAvailabilityCount(
    val availability: String,
    val count: Int,
)

@JsonClass(generateAdapter = true)
data class RecentOrderSummary(
    val id: String,
    val status: String,
    val currency: String,
    val totalMinor: String,
    val createdAt: String,
    val customerName: String?,
    val customerPhone: String?,
)

@JsonClass(generateAdapter = true)
data class AdminOverviewResponse(
    val branchId: String?,
    val revenue: OverviewRevenue,
    val ordersByStatus: List<OrdersByStatusCount>,
    val workersByAvailability: List<WorkersByAvailabilityCount>,
    val newCustomers30d: Int,
    val recentOrders: List<RecentOrderSummary>,
)

@JsonClass(generateAdapter = true)
data class NationalityCount(
    val nationalityId: String,
    val code: String,
    val nameAr: String,
    val nameEn: String,
    val flagEmoji: String,
    val count: Int,
)

@JsonClass(generateAdapter = true)
data class AdminActiveWorkersResponse(
    val branchId: String?,
    val total: Int,
    val byAvailability: List<WorkersByAvailabilityCount>,
    val byNationality: List<NationalityCount>,
)
