package com.mawared.dawliah.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawared.dawliah.data.mock.MockServices
import com.mawared.dawliah.data.mock.MockWorkers
import com.mawared.dawliah.data.model.ServiceCategory
import com.mawared.dawliah.data.model.Worker
import kotlinx.coroutines.delay
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

class HomeViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init { loadHomeData() }

    private fun loadHomeData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            delay(1500)
            _uiState.update {
                it.copy(
                    isLoading = false,
                    services = MockServices.all,
                    featuredWorkers = MockWorkers.all.filter { w -> w.isAvailable }.take(6),
                    unreadNotifications = 3,
                )
            }
        }
    }
}
