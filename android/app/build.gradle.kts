plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.mawared.dawliah"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.mawared.dawliah"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        vectorDrawables {
            useSupportLibrary = true
        }

        // Default API base URL — overridden per build type below.
        // Localhost on the Android *emulator* is 10.0.2.2 from the device's
        // perspective. For physical devices, point this at your dev box's
        // LAN IP or a staging URL.
        buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000\"")
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
            // Debug builds default to the emulator-friendly localhost.
            buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000\"")
        }
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // Release: point at staging by default. CI should override via
            // gradle property when building production:
            //   ./gradlew :app:assembleRelease -PapiBaseUrl=https://api.mawared.sa
            val released = (project.findProperty("apiBaseUrl") as String?)
                ?: "https://mawared-api-staging.up.railway.app"
            buildConfigField("String", "API_BASE_URL", "\"$released\"")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // Compose BOM
    val composeBom = platform("androidx.compose:compose-bom:2024.11.00")
    implementation(composeBom)

    // Core Compose
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.activity:activity-compose:1.9.3")

    // Navigation
    implementation("androidx.navigation:navigation-compose:2.8.4")

    // Lifecycle / ViewModel
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")

    // Lottie Animations
    implementation("com.airbnb.android:lottie-compose:6.6.2")

    // Shimmer loading effect
    implementation("com.valentinilk.shimmer:compose-shimmer:1.3.1")

    // Image loading (worker photos, flags)
    implementation("io.coil-kt:coil-compose:2.7.0")

    // Splash Screen API
    implementation("androidx.core:core-splashscreen:1.0.1")

    // DataStore (for mock persistence of auth state)
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    // Core KTX
    implementation("androidx.core:core-ktx:1.15.0")

    // ----- Networking (Mawared API client) -----
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-moshi:2.11.0")
    implementation("com.squareup.moshi:moshi-kotlin:1.15.1")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // ----- Encrypted token storage -----
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    // ----- Coroutines (kotlinx core; android dispatcher) -----
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")

    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
    androidTestImplementation(composeBom)
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
