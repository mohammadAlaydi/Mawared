package com.mawared.dawliah.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.mawared.dawliah.data.di.appContainer
import com.mawared.dawliah.data.model.Address
import com.mawared.dawliah.data.model.Notification
import com.mawared.dawliah.data.remote.AddressesRepository
import com.mawared.dawliah.data.remote.ApiErrors
import com.mawared.dawliah.data.remote.toDomain
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ProfileUiState(
    val userName: String = "",
    val phoneNumber: String = "",
    val avatarUrl: String = "",
    val savedAddresses: List<Address> = emptyList(),
    val verificationStatus: VerificationStatus = VerificationStatus.NOT_VERIFIED,
    val notifications: List<Notification> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
)

enum class VerificationStatus { NOT_VERIFIED, PENDING, VERIFIED, FAILED }

/**
 * Profile + saved addresses + notifications. Fetches everything in
 * parallel on init; individual sections fail open (empty list) so a
 * 401 on notifications doesn't blow away the addresses pane.
 *
 * `/v1/me` is currently a thin response — we extract phone + a derived
 * name. When the profile DTO firms up (firstName / lastName /
 * preferredLocale split), update the extractor block.
 */
class ProfileViewModel(application: Application) : AndroidViewModel(application) {

    private val container = application.appContainer()
    private val api = container.api
    private val addresses = AddressesRepository(container.api)

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            val meDeferred = async {
                runCatching { api.me.getMe() }.getOrNull()
            }
            val addrsDeferred = async {
                runCatching { addresses.list() }.getOrDefault(emptyList())
            }
            val notifsDeferred = async {
                runCatching { api.notifications.list().items.map { it.toDomain() } }
                    .getOrDefault(emptyList())
            }

            val me = meDeferred.await()
            val addrs = addrsDeferred.await()
            val notifs = notifsDeferred.await()

            _uiState.update {
                it.copy(
                    isLoading = false,
                    userName = extractName(me),
                    phoneNumber = extractPhone(me),
                    savedAddresses = addrs,
                    notifications = notifs,
                )
            }
        }
    }

    fun updateName(name: String) {
        _uiState.update { it.copy(userName = name) }
        // TODO(profile-update): wire to PATCH /v1/me once the Kotlin client
        // exposes a typed me.update() method (backend supports it today).
    }

    fun addAddress(address: Address) {
        viewModelScope.launch {
            runCatching { addresses.create(address) }
                .onSuccess { created ->
                    _uiState.update {
                        it.copy(savedAddresses = it.savedAddresses + created)
                    }
                }
                .onFailure { t ->
                    _uiState.update { it.copy(error = ApiErrors.toMessage(t)) }
                }
        }
    }

    fun removeAddress(id: String) {
        // Optimistic remove; revert on failure.
        val before = _uiState.value.savedAddresses
        _uiState.update { it.copy(savedAddresses = it.savedAddresses.filterNot { a -> a.id == id }) }
        viewModelScope.launch {
            val result = runCatching { addresses.delete(id) }
            if (result.isFailure) {
                _uiState.update {
                    it.copy(
                        savedAddresses = before,
                        error = ApiErrors.toMessage(result.exceptionOrNull()!!),
                    )
                }
            }
        }
    }

    fun startVerification() {
        _uiState.update { it.copy(verificationStatus = VerificationStatus.PENDING) }
        // TODO(verification-start): wire to POST /v1/me/verification/start
        // (returns a Signit.sa redirect URL — open in a Chrome Custom Tab).
    }

    fun setVerified() {
        _uiState.update { it.copy(verificationStatus = VerificationStatus.VERIFIED) }
    }

    fun setVerificationFailed() {
        _uiState.update { it.copy(verificationStatus = VerificationStatus.FAILED) }
    }

    fun markAllRead() {
        val unread = _uiState.value.notifications.filter { !it.isRead }
        if (unread.isEmpty()) return
        // Optimistic flip
        _uiState.update { state ->
            state.copy(notifications = state.notifications.map { it.copy(isRead = true) })
        }
        viewModelScope.launch {
            // Fan out per-id PATCH calls. If any fails we leave the
            // optimistic state — pull-to-refresh will reconcile.
            unread.forEach { n ->
                runCatching { api.notifications.markRead(n.id) }
            }
        }
    }

    // ---------- helpers ----------
    // /v1/me returns an opaque Any via the Kotlin client (Moshi parses it
    // into a Map<String, Any?>). Defensive extractors below; tighten when
    // the profile DTO is finalized.

    private fun extractName(me: Any?): String {
        val map = me as? Map<*, *> ?: return ""
        val first = map["firstName"] as? String ?: ""
        val last = map["lastName"] as? String ?: ""
        return listOf(first, last).filter { it.isNotBlank() }.joinToString(" ")
    }

    private fun extractPhone(me: Any?): String {
        val map = me as? Map<*, *> ?: return ""
        return map["phoneE164"] as? String ?: ""
    }
}
