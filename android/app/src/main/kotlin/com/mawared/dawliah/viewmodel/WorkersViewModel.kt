package com.mawared.dawliah.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawared.dawliah.data.mock.MockWorkers
import com.mawared.dawliah.data.model.Worker
import com.mawared.dawliah.data.model.WorkerProfession
import kotlinx.coroutines.delay
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

class WorkersViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(WorkersUiState())
    val uiState: StateFlow<WorkersUiState> = _uiState.asStateFlow()

    init { loadWorkers() }

    private fun loadWorkers() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            delay(1500)
            _uiState.update { it.copy(isLoading = false, workers = MockWorkers.all, filteredWorkers = MockWorkers.all) }
        }
    }

    fun toggleFavorite(workerId: String) {
        _uiState.update { state ->
            val newFavorites = state.favorites.toMutableSet()
            if (newFavorites.contains(workerId)) newFavorites.remove(workerId) else newFavorites.add(workerId)
            state.copy(favorites = newFavorites)
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
                val matchSearch = state.searchQuery.isEmpty() || w.nameAr.contains(state.searchQuery) || w.nationality.contains(state.searchQuery)
                val matchNat = state.activeFilters.nationality == null || w.nationality == state.activeFilters.nationality
                val matchProf = state.activeFilters.profession == null || w.profession == state.activeFilters.profession
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
