package com.mawared.dawliah.data.remote

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.mawared.api.TokenStorage

/**
 * Persistent, EncryptedSharedPreferences-backed implementation of the
 * api-client's TokenStorage interface. Survives app restarts; per-app
 * sandbox makes it inaccessible to other apps without root.
 *
 * Add to app/build.gradle.kts:
 *   implementation("androidx.security:security-crypto:1.1.0-alpha06")
 */
class AndroidTokenStorage(context: Context) : TokenStorage {

    private val prefs by lazy {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        EncryptedSharedPreferences.create(
            context,
            "mawared.tokens",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    override fun accessToken(): String? = prefs.getString(KEY_ACCESS, null)
    override fun refreshToken(): String? = prefs.getString(KEY_REFRESH, null)

    override fun save(access: String, refresh: String) {
        prefs.edit()
            .putString(KEY_ACCESS, access)
            .putString(KEY_REFRESH, refresh)
            .apply()
    }

    override fun clear() {
        prefs.edit().clear().apply()
    }

    private companion object {
        const val KEY_ACCESS = "access_token"
        const val KEY_REFRESH = "refresh_token"
    }
}
