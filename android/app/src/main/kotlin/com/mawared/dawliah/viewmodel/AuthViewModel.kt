package com.mawared.dawliah.viewmodel

import android.app.Application
import android.os.Build
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.mawared.api.LogoutRequest
import com.mawared.api.OtpRequest
import com.mawared.api.OtpVerify
import com.mawared.dawliah.data.di.appContainer
import com.mawared.dawliah.data.remote.ApiErrors
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AuthUiState(
    val isLoggedIn: Boolean = false,
    val isFirstLaunch: Boolean = true,
    val phoneNumber: String = "",
    val otpCode: String = "",
    val isOtpSent: Boolean = false,
    val isVerifying: Boolean = false,
    val isVerified: Boolean = false,
    val userName: String = "",
    val userCity: String = "",
    val error: String? = null,
)

/**
 * Real OTP flow via `/v1/auth/otp/request` and `/v1/auth/otp/verify`.
 *
 * On successful verify, tokens are persisted in the app's
 * [com.mawared.dawliah.data.remote.AndroidTokenStorage] (encrypted shared
 * preferences). The [com.mawared.api.AuthInterceptor] then attaches them
 * to every subsequent request automatically.
 *
 * On first launch we probe storage: if a refresh token is already there,
 * we consider the user "logged in" and skip the OTP screen.
 */
class AuthViewModel(application: Application) : AndroidViewModel(application) {

    private val container = application.appContainer()
    private val api = container.api
    private val tokenStorage = container.tokenStorage
    private val deviceId = container.deviceId

    private val _uiState = MutableStateFlow(
        AuthUiState(
            // If we already have a refresh token from a prior install, skip the
            // OTP screen. (The token may have been revoked server-side — we'll
            // find out on the first authenticated request, which will 401 and
            // the refresh authenticator will clear storage.)
            isLoggedIn = tokenStorage.refreshToken() != null,
            isFirstLaunch = tokenStorage.refreshToken() == null,
        )
    )
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun updatePhone(phone: String) {
        _uiState.update { it.copy(phoneNumber = phone, error = null) }
    }

    fun sendOtp() {
        val phone = _uiState.value.phoneNumber.trim()
        if (phone.isEmpty()) {
            _uiState.update { it.copy(error = "أدخل رقم الجوال") }
            return
        }
        viewModelScope.launch {
            _uiState.update { it.copy(isVerifying = true, error = null) }
            runCatching {
                api.auth.requestOtp(OtpRequest(phone = phone, locale = "ar"))
            }.onSuccess {
                _uiState.update {
                    it.copy(isVerifying = false, isOtpSent = true, error = null)
                }
            }.onFailure { t ->
                _uiState.update {
                    it.copy(isVerifying = false, error = ApiErrors.toMessage(t))
                }
            }
        }
    }

    fun verifyOtp(code: String) {
        val phone = _uiState.value.phoneNumber.trim()
        val trimmedCode = code.trim()
        if (trimmedCode.length < 4) {
            _uiState.update { it.copy(error = "أدخل رمز التحقق") }
            return
        }
        viewModelScope.launch {
            _uiState.update { it.copy(otpCode = trimmedCode, isVerifying = true, error = null) }
            runCatching {
                api.auth.verifyOtp(
                    OtpVerify(
                        phone = phone,
                        code = trimmedCode,
                        deviceId = deviceId,
                        deviceName = "${Build.MANUFACTURER} ${Build.MODEL}",
                    )
                )
            }.onSuccess { resp ->
                tokenStorage.save(resp.accessToken, resp.refreshToken)
                _uiState.update {
                    it.copy(
                        isVerifying = false,
                        isVerified = true,
                        isLoggedIn = true,
                        isFirstLaunch = false,
                        error = null,
                    )
                }
            }.onFailure { t ->
                _uiState.update {
                    it.copy(isVerifying = false, error = ApiErrors.toMessage(t))
                }
            }
        }
    }

    fun updateProfile(name: String, city: String) {
        _uiState.update { it.copy(userName = name, userCity = city) }
        // TODO(profile-pe-vm): wire to api.me.update once the profile screen
        // collects the firstName/lastName/preferredLocale split. Backend
        // endpoint: PATCH /v1/me.
    }

    fun setFirstLaunchDone() {
        _uiState.update { it.copy(isFirstLaunch = false) }
    }

    fun logout() {
        val refresh = tokenStorage.refreshToken()
        viewModelScope.launch {
            // Best-effort server-side session revoke. Local clear runs
            // regardless — the user is logged out from this device's POV
            // even if the request fails (offline, expired, etc.).
            if (refresh != null) {
                runCatching { api.auth.logout(LogoutRequest(refresh)) }
            }
            tokenStorage.clear()
            _uiState.value = AuthUiState()
        }
    }
}
