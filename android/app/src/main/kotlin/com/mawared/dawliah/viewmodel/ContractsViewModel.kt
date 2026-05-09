package com.mawared.dawliah.viewmodel

import androidx.lifecycle.ViewModel
import com.mawared.dawliah.data.mock.MockContracts
import com.mawared.dawliah.data.model.Contract
import com.mawared.dawliah.data.model.ContractStatus
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class ContractsUiState(
    val contracts: List<Contract> = MockContracts.all,
    val selectedFilter: ContractFilter = ContractFilter.ALL,
)

enum class ContractFilter(val labelAr: String) {
    ALL("الكل"),
    ACTIVE("نشط"),
    EXPIRED("منتهي"),
}

class ContractsViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(ContractsUiState())
    val uiState: StateFlow<ContractsUiState> = _uiState.asStateFlow()

    fun setFilter(filter: ContractFilter) {
        val filtered = when (filter) {
            ContractFilter.ALL -> MockContracts.all
            ContractFilter.ACTIVE -> MockContracts.all.filter {
                it.status == ContractStatus.ACTIVE || it.status == ContractStatus.PENDING_RENEWAL
            }
            ContractFilter.EXPIRED -> MockContracts.all.filter {
                it.status == ContractStatus.EXPIRED
            }
        }
        _uiState.value = _uiState.value.copy(contracts = filtered, selectedFilter = filter)
    }

    fun getContractById(id: String): Contract? =
        MockContracts.all.find { it.id == id }
}
