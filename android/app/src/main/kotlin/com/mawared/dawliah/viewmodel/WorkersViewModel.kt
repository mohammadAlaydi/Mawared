package com.mawared.dawliah.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.mawared.dawliah.data.di.appContainer
import com.mawared.dawliah.data.model.Worker
import com.mawared.dawliah.data.model.WorkerProfession
import com.mawared.dawliah.data.remote.ApiErrors
import com.mawared.dawliah.data.remote.WorkersRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class WorkerFilters(
    val nationality: String? = null,
    val profession: WorkerProfession? = null,
    val salaryRange: IntRange = 500..3000,
    val minExperience: Int = 0,
    val availableOnly: Boolean = false,
)

data class WorkersUiState(
    val isLoading: Boolean = true,
    val workers: List<Worker> = emptyList(),
    val filteredWorkers: List<Worker> = emptyList(),
    val activeFilters: WorkerFilters = WorkerFilters(),
    val favorites: Set<String> = emptySet(),
    val searchQuery: String = "",
    val error: String? = null,
)

/**
 * Workers screen — paged listing backed by `GET /v1/workers`.
 *
 * Pagination: collapsed to "first 50" until we wire infinite scroll.
 * Filters are applied **client-side** on top of the loaded set; if we
 * ever push them server-side (better for large catalogs), move `profession`
 * + `nationalityCode` into the `repo.search()` call and re-fetch on
 * `updateFilters`.
 */
class WorkersViewModel(application: Application) : AndroidViewModel(application) {

    private val container = application.appContainer()
    private val repo = WorkersRepository(container.api)

    private val _uiState = MutableStateFlow(WorkersUiState())
    val uiState: StateFlow<WorkersUiState> = _uiState.asStateFlow()

    init {
        loadWorkers()
        loadFavorites()
    }

    fun loadWorkers() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            runCatching { repo.search(limit = 50) }
                .onSuccess { list ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            workers = list,
                            filteredWorkers = list,
                            error = null,
                        )
                    }
                    applyFilters()
                }
                .onFailure { t ->
                    _uiState.update {
                        it.copy(isLoading = false, error = ApiErrors.toMessage(t))
                    }
                }
        }
    }

    /** Best-effort: anonymous + non-logged-in users 401 on /me/favorites; that's fine. */
    private fun loadFavorites() {
        viewModelScope.launch {
            runCatching { repo.listFavorites() }
                .onSuccess { favs ->
                    _uiState.update { it.copy(favorites = favs.map(Worker::id).toSet()) }
                }
        }
    }

    fun toggleFavorite(workerId: String) {
        val wasFavorite = _uiState.value.favorites.contains(workerId)
        // Optimistic flip — revert on failure.
        _uiState.update { state ->
            val s = state.favorites.toMutableSet()
            if (wasFavorite) s.remove(workerId) else s.add(workerId)
            state.copy(favorites = s)
        }
        viewModelScope.launch {
            val result = runCatching {
                if (wasFavorite) repo.removeFavorite(workerId)
                else repo.addFavorite(workerId)
            }
            if (result.isFailure) {
                _uiState.update { state ->
                    val s = state.favorites.toMutableSet()
                    if (wasFavorite) s.add(workerId) else s.remove(workerId)
                    state.copy(
                        favorites = s,
                        error = ApiErrors.toMessage(result.exceptionOrNull()!!),
                    )
                }
            }
        }
    }

    fun updateSearch(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        applyFilters()
    }

    fun updateFilters(filters: WorkerFilters) {
        _uiState.update { it.copy(activeFilters = filters) }
        applyFilters()
    }

    fun resetFilters() {
        _uiState.update { it.copy(activeFilters = WorkerFilters(), searchQuery = "") }
        applyFilters()
    }

    private fun applyFilters() {
        _uiState.update { state ->
            val filtered = state.workers.filter { w ->
                val matchSearch = state.searchQuery.isEmpty() ||
                    w.nameAr.contains(state.searchQuery) ||
                    w.nationality.contains(state.searchQuery)
                val matchNat = state.activeFilters.nationality == null ||
                    w.nationality == state.activeFilters.nationality
                val matchProf = state.activeFilters.profession == null ||
                    w.profession == state.activeFilters.profession
                val matchSalary = w.monthlySalary in state.activeFilters.salaryRange
                val matchExp = w.experienceYears >= state.activeFilters.minExperience
                val matchAvail = !state.activeFilters.availableOnly || w.isAvailable
                matchSearch && matchNat && matchProf && matchSalary && matchExp && matchAvail
            }
            state.copy(filteredWorkers = filtered)
        }
    }

    fun getWorkerById(id: String): Worker? = _uiState.value.workers.find { it.id == id }
}
