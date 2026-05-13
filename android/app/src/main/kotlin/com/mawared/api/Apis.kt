package com.mawared.api

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * Retrofit interfaces mirroring the Mawared backend's customer + admin APIs.
 * Endpoints prefixed `/v1`; signature one-to-one with `packages/api-client-ts/src/client.ts`.
 */

interface AuthApi {
    @POST("v1/auth/otp/request")
    suspend fun requestOtp(@Body body: OtpRequest)

    @POST("v1/auth/otp/verify")
    suspend fun verifyOtp(@Body body: OtpVerify): AuthResponse

    @POST("v1/auth/token/refresh")
    suspend fun refresh(@Body body: RefreshRequest): AuthResponse

    @POST("v1/auth/logout")
    suspend fun logout(@Body body: LogoutRequest)
}

interface WorkersApi {
    @GET("v1/workers")
    suspend fun search(
        @Query("profession") profession: String? = null,
        @Query("nationalityCode") nationalityCode: String? = null,
        @Query("languageCode") languageCode: String? = null,
        @Query("minSalaryMinor") minSalaryMinor: String? = null,
        @Query("maxSalaryMinor") maxSalaryMinor: String? = null,
        @Query("minAge") minAge: Int? = null,
        @Query("maxAge") maxAge: Int? = null,
        @Query("branchId") branchId: String? = null,
        @Query("query") query: String? = null,
        @Query("sort") sort: String? = null,
        @Query("cursor") cursor: String? = null,
        @Query("limit") limit: Int? = null,
    ): WorkersPage

    @GET("v1/workers/{id}")
    suspend fun findById(@Path("id") id: String): Worker
}

interface CatalogApi {
    @GET("v1/services")
    suspend fun listServices(): ServiceListResponse

    @GET("v1/services/{id}/packages")
    suspend fun listPackages(@Path("id") serviceId: String): PackageListResponse
}

interface BranchesApi {
    @GET("v1/branches")
    suspend fun list(): BranchListResponse

    @GET("v1/branches/{id}")
    suspend fun findById(@Path("id") id: String): Branch
}

interface OffersApi {
    @GET("v1/offers")
    suspend fun list(): OfferListResponse
}

interface MeApi {
    @GET("v1/me")
    suspend fun getMe(): Any  // typed by consumer; lazy on Android side

    @GET("v1/me/addresses")
    suspend fun listAddresses(): AddressListResponse

    @POST("v1/me/addresses")
    suspend fun createAddress(@Body body: CreateAddressRequest): Address

    @DELETE("v1/me/addresses/{id}")
    suspend fun deleteAddress(@Path("id") id: String)

    @GET("v1/me/favorites")
    suspend fun listFavorites(): WorkersPage  // {items: Worker[]}, no cursor

    @POST("v1/me/favorites/{workerId}")
    suspend fun addFavorite(@Path("workerId") workerId: String)

    @DELETE("v1/me/favorites/{workerId}")
    suspend fun removeFavorite(@Path("workerId") workerId: String)
}

interface OrdersApi {
    @POST("v1/orders")
    suspend fun create(
        @Body body: CreateOrderRequest,
        @Header("Idempotency-Key") idempotencyKey: String,
    ): Order

    @GET("v1/orders")
    suspend fun list(): OrderListResponse

    @GET("v1/orders/{id}")
    suspend fun findById(@Path("id") id: String): Order

    @POST("v1/orders/{id}/cancel")
    suspend fun cancel(@Path("id") id: String, @Body body: CancelOrderRequest): TransitionResponse
}

interface PaymentsApi {
    @POST("v1/payments/intents")
    suspend fun createIntent(
        @Body body: CreatePaymentIntentRequest,
        @Header("Idempotency-Key") idempotencyKey: String,
    ): PaymentIntentResponse
}

interface NotificationsApi {
    @GET("v1/notifications")
    suspend fun list(): NotificationListResponse

    @PATCH("v1/notifications/{id}/read")
    suspend fun markRead(@Path("id") id: String)

    @POST("v1/devices")
    suspend fun registerDevice(@Body body: RegisterDeviceRequest)

    @DELETE("v1/devices/{token}")
    suspend fun unregisterDevice(@Path("token") token: String)
}

// ===== Public marketing site =====

interface PublicApi {
    @GET("v1/public/stats")
    suspend fun stats(): PublicStats
}

// ===== Admin reports =====

interface AdminReportsApi {
    @GET("v1/admin/reports/overview")
    suspend fun overview(@Query("branchId") branchId: String? = null): AdminOverviewResponse

    @GET("v1/admin/reports/active-workers")
    suspend fun activeWorkers(@Query("branchId") branchId: String? = null): AdminActiveWorkersResponse
}
