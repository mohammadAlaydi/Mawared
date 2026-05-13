package com.mawared.api

import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import okhttp3.Authenticator
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory

/**
 * Pluggable token storage. Implement using EncryptedSharedPreferences /
 * the Android Keystore in production.
 */
interface TokenStorage {
    fun accessToken(): String?
    fun refreshToken(): String?
    fun save(access: String, refresh: String)
    fun clear()
}

/**
 * Drop-in API client surface for the Android app. Inject `MawaredApi` from
 * here into your repository layer:
 *
 *   val api = MawaredApiClientFactory.create(
 *       baseUrl = "https://api.mawared.local",
 *       tokenStorage = AndroidTokenStorage(context),
 *   )
 *   val workers = api.workers.search(profession = "DOMESTIC_WORKER")
 */
class MawaredApi(
    val auth: AuthApi,
    val workers: WorkersApi,
    val catalog: CatalogApi,
    val branches: BranchesApi,
    val offers: OffersApi,
    val me: MeApi,
    val orders: OrdersApi,
    val payments: PaymentsApi,
    val notifications: NotificationsApi,
    val marketing: PublicApi,
    val adminReports: AdminReportsApi,
    val tokenStorage: TokenStorage,
)

object MawaredApiClientFactory {
    fun create(
        baseUrl: String,
        tokenStorage: TokenStorage,
        debugLogging: Boolean = false,
    ): MawaredApi {
        val moshi = Moshi.Builder().add(KotlinJsonAdapterFactory()).build()

        val okHttp = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(tokenStorage))
            .authenticator(TokenRefreshAuthenticator(baseUrl, tokenStorage, moshi))
            .apply {
                if (debugLogging) {
                    addInterceptor(HttpLoggingInterceptor().apply {
                        level = HttpLoggingInterceptor.Level.BODY
                    })
                }
            }
            .build()

        val retrofit = Retrofit.Builder()
            .baseUrl(if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/")
            .client(okHttp)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()

        return MawaredApi(
            auth = retrofit.create(AuthApi::class.java),
            workers = retrofit.create(WorkersApi::class.java),
            catalog = retrofit.create(CatalogApi::class.java),
            branches = retrofit.create(BranchesApi::class.java),
            offers = retrofit.create(OffersApi::class.java),
            me = retrofit.create(MeApi::class.java),
            orders = retrofit.create(OrdersApi::class.java),
            payments = retrofit.create(PaymentsApi::class.java),
            notifications = retrofit.create(NotificationsApi::class.java),
            marketing = retrofit.create(PublicApi::class.java),
            adminReports = retrofit.create(AdminReportsApi::class.java),
            tokenStorage = tokenStorage,
        )
    }
}

private class AuthInterceptor(private val storage: TokenStorage) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val req = chain.request()
        val token = storage.accessToken() ?: return chain.proceed(req)
        val withAuth = req.newBuilder()
            .header("Authorization", "Bearer $token")
            .build()
        return chain.proceed(withAuth)
    }
}

private class TokenRefreshAuthenticator(
    baseUrl: String,
    private val storage: TokenStorage,
    moshi: Moshi,
) : Authenticator {

    private val refreshClient: Retrofit = Retrofit.Builder()
        .baseUrl(if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/")
        .addConverterFactory(MoshiConverterFactory.create(moshi))
        .build()
    private val authApi: AuthApi = refreshClient.create(AuthApi::class.java)

    @Synchronized
    override fun authenticate(route: Route?, response: Response): Request? {
        // Only refresh once per chain to avoid infinite loops.
        if (response.priorResponse != null) return null

        val refresh = storage.refreshToken() ?: return null
        return try {
            val fresh = kotlinx.coroutines.runBlocking { authApi.refresh(RefreshRequest(refresh)) }
            storage.save(fresh.accessToken, fresh.refreshToken)
            response.request.newBuilder()
                .header("Authorization", "Bearer ${fresh.accessToken}")
                .build()
        } catch (_: Throwable) {
            storage.clear()
            null
        }
    }
}
