package com.mawared.dawliah.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.mawared.dawliah.data.di.appContainer
import com.mawared.dawliah.data.model.ServiceCategory
import com.mawared.dawliah.data.model.Worker
import com.mawared.dawliah.data.remote.ApiErrors
import com.mawared.dawliah.data.remote.CatalogRepository
import com.mawared.dawliah.data.remote.WorkersRepository
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class HomeUiState(
    val isLoading: Boolean = true,
    val services: List<ServiceCategory> = emptyList(),
    val featuredWorkers: List<Worker> = emptyList(),
    val unreadNotifications: Int = 0,
    val error: String? = null,
)

/**
 * Home screen — pulls service catalog + a small set of featured (available)
 * workers in parallel. Notification count is fetched best-effort and
 * silently falls back to zero on error (it's a glance value, not gating).
 */
class HomeViewModel(application: Application) : AndroidViewModel(application) {

    private val container = application.appContainer()
    private val catalog = CatalogRepository(container.api)
    private val workers = WorkersRepository(container.api)
    private val api = container.api

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            runCatching {
                val servicesAsync = async { catalog.listServices() }
                val workersAsync = async {
                    workers.search(limit = 12)
                        .filter { it.isAvailable }
                        .take(6)
                }
                val unreadAsync = async {
                    // Best-effort. Anonymous + new installs will 401 here;
                    // we swallow that and show 0.
                    runCatching {
                        api.notifications.list().items.count { it.readAt == null }
                    }.getOrDefault(0)
                }
                val results = awaitAll(servicesAsync, workersAsync, unreadAsync)
                @Suppress("UNCHECKED_CAST")
                Triple(
                    results[0] as List<ServiceCategory>,
                    results[1] as List<Worker>,
                    results[2] as Int,
                )
            }.onSuccess { (services, featured, unread) ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        services = services,
                        featuredWorkers = featured,
                        unreadNotifications = unread,
                        error = null,
                    )
                }
            }.onFailure { t ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = ApiErrors.toMessage(t),
                    )
                }
            }
        }
    }
}
