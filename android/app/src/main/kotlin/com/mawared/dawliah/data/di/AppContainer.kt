package com.mawared.dawliah.data.di

import android.content.Context
import com.mawared.api.MawaredApi
import com.mawared.api.MawaredApiClientFactory
import com.mawared.dawliah.BuildConfig
import com.mawared.dawliah.data.remote.AndroidTokenStorage

/**
 * Lightweight service locator for app-wide singletons.
 *
 * Held by [com.mawared.dawliah.MawaredApp]. Components retrieve it via
 * [appContainer] extension. We're not using Hilt yet — when the project
 * outgrows this (>3 wired ViewModels needing different deps), promote
 * this to Hilt-injected `@Singleton` providers.
 */
class AppContainer(context: Context) {
    private val appContext = context.applicationContext

    val tokenStorage: AndroidTokenStorage by lazy { AndroidTokenStorage(appContext) }

    val api: MawaredApi by lazy {
        MawaredApiClientFactory.create(
            baseUrl = BuildConfig.API_BASE_URL,
            tokenStorage = tokenStorage,
            debugLogging = BuildConfig.DEBUG,
        )
    }

    /** A stable per-install device ID, used as the OTP-verify `deviceId`. */
    val deviceId: String by lazy { deviceIdProvider() }

    private fun deviceIdProvider(): String {
        val prefs = appContext.getSharedPreferences("mawared.device", Context.MODE_PRIVATE)
        val existing = prefs.getString(KEY_DEVICE_ID, null)
        if (existing != null) return existing
        val fresh = java.util.UUID.randomUUID().toString()
        prefs.edit().putString(KEY_DEVICE_ID, fresh).apply()
        return fresh
    }

    private companion object {
        const val KEY_DEVICE_ID = "device_id"
    }
}

/** Extension to fetch the container from any Composable / ViewModel. */
fun Context.appContainer(): AppContainer =
    (applicationContext as com.mawared.dawliah.MawaredApp).container
