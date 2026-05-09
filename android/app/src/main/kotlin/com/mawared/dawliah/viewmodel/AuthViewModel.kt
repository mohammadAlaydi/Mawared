package com.mawared.dawliah.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.delay
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
    val userName: String = "محمد",
    val userCity: String = "الرياض",
    val error: String? = null,
)

class AuthViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun updatePhone(phone: String) {
        _uiState.update { it.copy(phoneNumber = phone, error = null) }
    }

    fun sendOtp() {
        viewModelScope.launch {
            _uiState.update { it.copy(isVerifying = true) }
            delay(1500)
            _uiState.update { it.copy(isVerifying = false, isOtpSent = true) }
        }
    }

    fun verifyOtp(code: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(otpCode = code, isVerifying = true) }
            delay(2000)
            _uiState.update { it.copy(isVerifying = false, isVerified = true, isLoggedIn = true, isFirstLaunch = false) }
        }
    }

    fun updateProfile(name: String, city: String) {
        _uiState.update { it.copy(userName = name, userCity = city) }
    }

    fun setFirstLaunchDone() {
        _uiState.update { it.copy(isFirstLaunch = false) }
    }

    fun logout() {
        _uiState.update { AuthUiState() }
    }
}
