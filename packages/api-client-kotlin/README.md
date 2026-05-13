# `@mawared/api-client-kotlin`

Source-only Kotlin module consumed by the Android app under `android/`.

Drop the `src/` tree into a Gradle module (or `android/app/src/main/kotlin/com/mawared/api/`) and add the dependencies:

```kotlin
// android/app/build.gradle.kts
dependencies {
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-moshi:2.11.0")
    implementation("com.squareup.moshi:moshi-kotlin:1.15.1")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
}
```

## Usage

```kotlin
val client = MawaredApiClientFactory.create(
    baseUrl = "https://api.mawared.local",
    tokenStorage = AndroidTokenStorage(context),     // your impl
    deviceId = DeviceId.get(context),
)

// Customer flow
client.auth.requestOtp(OtpRequest(phone = "+9665XXXXXXX"))
val tokens = client.auth.verifyOtp(OtpVerify(phone, code, deviceId, deviceName))
client.tokenStorage.save(tokens.accessToken, tokens.refreshToken)

val workers = client.workers.search(profession = "DOMESTIC_WORKER")
val order   = client.orders.create(
    CreateOrderRequest(workerId, packageId, addressId, promoCode = null),
    idempotencyKey = UUID.randomUUID().toString(),
)
val intent  = client.payments.createIntent(CreatePaymentIntentRequest(order.id))
// → hand intent.clientSecret to Stripe PaymentSheet
```

## Auto-refresh

`AuthInterceptor` adds `Authorization: Bearer ...`. On any 401 response,
`TokenRefreshAuthenticator` calls `/v1/auth/token/refresh` once (single-flight)
and retries the original request with the new token.
