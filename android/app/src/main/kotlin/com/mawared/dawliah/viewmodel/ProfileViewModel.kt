package com.mawared.dawliah.viewmodel

import androidx.lifecycle.ViewModel
import com.mawared.dawliah.data.mock.MockAddresses
import com.mawared.dawliah.data.model.Address
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

data class ProfileUiState(
    val userName: String = "محمد العتيبي",
    val phoneNumber: String = "+966 512 345 678",
    val avatarUrl: String = "https://randomuser.me/api/portraits/men/10.jpg",
    val savedAddresses: List<Address> = MockAddresses.all,
    val verificationStatus: VerificationStatus = VerificationStatus.NOT_VERIFIED,
)

enum class VerificationStatus { NOT_VERIFIED, PENDING, VERIFIED, FAILED }

class ProfileViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    fun updateName(name: String) { _uiState.update { it.copy(userName = name) } }
    fun addAddress(address: Address) { _uiState.update { it.copy(savedAddresses = it.savedAddresses + address) } }
    fun removeAddress(id: String) { _uiState.update { it.copy(savedAddresses = it.savedAddresses.filter { a -> a.id != id }) } }
    fun startVerification() { _uiState.update { it.copy(verificationStatus = VerificationStatus.PENDING) } }
    fun setVerified() { _uiState.update { it.copy(verificationStatus = VerificationStatus.VERIFIED) } }
    fun setVerificationFailed() { _uiState.update { it.copy(verificationStatus = VerificationStatus.FAILED) } }
}
