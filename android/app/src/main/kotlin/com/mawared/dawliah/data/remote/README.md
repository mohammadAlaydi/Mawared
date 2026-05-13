# `data/remote/` — API integration

The Kotlin API surface generated from the backend OpenAPI spec lives in
`packages/api-client-kotlin/src/`. Copy those three files (`Dtos.kt`,
`Apis.kt`, `Client.kt`) into this package — or wire the package as a
Gradle module — and add the runtime deps below.

## Gradle deps (add to `android/app/build.gradle.kts`)

```kotlin
dependencies {
    // existing deps...

    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-moshi:2.11.0")
    implementation("com.squareup.moshi:moshi-kotlin:1.15.1")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // FCM push
    implementation(platform("com.google.firebase:firebase-bom:33.1.2"))
    implementation("com.google.firebase:firebase-messaging-ktx")

    // Stripe Payment Sheet
    implementation("com.stripe:stripe-android:21.3.0")
}
```

## Token storage (EncryptedSharedPreferences)

`AndroidTokenStorage.kt` (next to this README) implements `TokenStorage`
from the api-client package against `EncryptedSharedPreferences` so the
refresh token survives app restarts but isn't readable by other apps.

## DI binding (manual / Hilt)

In `MawaredApp` (the `Application` subclass):

```kotlin
class MawaredApp : Application() {
    lateinit var api: MawaredApi
        private set

    override fun onCreate() {
        super.onCreate()
        api = MawaredApiClientFactory.create(
            baseUrl = BuildConfig.API_BASE_URL,
            tokenStorage = AndroidTokenStorage(applicationContext),
            debugLogging = BuildConfig.DEBUG,
        )
    }
}
```

Then in any ViewModel / repository:

```kotlin
class WorkersRepository(private val api: MawaredApi) {
    suspend fun search(profession: String?): List<Worker> =
        api.workers.search(profession = profession).items
}
```

## BuildConfig fields (app/build.gradle.kts)

```kotlin
android {
    buildTypes {
        debug {
            buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000\"")
        }
        release {
            buildConfigField("String", "API_BASE_URL", "\"https://api.mawared.local\"")
        }
    }
    buildFeatures {
        buildConfig = true
    }
}
```

Note: `10.0.2.2` is the Android emulator's loopback to the host machine.
On a physical device, point at your dev machine's LAN IP.
