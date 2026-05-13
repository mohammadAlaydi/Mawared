package com.mawared.dawliah.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.mawared.dawliah.data.di.appContainer
import com.mawared.dawliah.data.model.Contract
import com.mawared.dawliah.data.model.ContractStatus
import com.mawared.dawliah.data.model.WorkerProfession
import com.mawared.dawliah.data.remote.ApiErrors
import com.mawared.dawliah.data.remote.OrdersRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ContractsUiState(
    val contracts: List<Contract> = emptyList(),
    val allContracts: List<Contract> = emptyList(),
    val selectedFilter: ContractFilter = ContractFilter.ALL,
    val isLoading: Boolean = true,
    val error: String? = null,
)

enum class ContractFilter(val labelAr: String) {
    ALL("الكل"),
    ACTIVE("نشط"),
    EXPIRED("منتهي"),
}

/**
 * Contracts list.
 *
 * Backend gap: there's no `/v1/me/contracts` list endpoint. Contracts are
 * 1:1 with orders past `CONFIRMED`. We synthesize the list client-side
 * by treating any order with status ≥ CONFIRMED as having an associated
 * contract, then mapping it onto the existing UI [Contract] shape.
 *
 * The mapping loses some richness (worker photo, exact contract number).
 * When the backend gets a proper list endpoint (`GET /v1/me/contracts`
 * returning `{ id, contractNumber, workerName, workerPhotoUrl, ... }`),
 * swap this for a single call.
 */
class ContractsViewModel(application: Application) : AndroidViewModel(application) {

    private val container = application.appContainer()
    private val orders = OrdersRepository(container.api)

    private val _uiState = MutableStateFlow(ContractsUiState())
    val uiState: StateFlow<ContractsUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            runCatching { orders.list() }
                .onSuccess { allOrders ->
                    val synthesized = allOrders
                        .filter { it.status.name in CONTRACT_STATUS_CODES }
                        .map { o -> o.toSyntheticContract() }
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            allContracts = synthesized,
                            contracts = applyFilter(synthesized, it.selectedFilter),
                        )
                    }
                }
                .onFailure { t ->
                    _uiState.update { it.copy(isLoading = false, error = ApiErrors.toMessage(t)) }
                }
        }
    }

    fun setFilter(filter: ContractFilter) {
        _uiState.update {
            it.copy(
                selectedFilter = filter,
                contracts = applyFilter(it.allContracts, filter),
            )
        }
    }

    fun getContractById(id: String): Contract? = _uiState.value.allContracts.find { it.id == id }

    // ---------- helpers ----------

    private fun applyFilter(all: List<Contract>, filter: ContractFilter): List<Contract> =
        when (filter) {
            ContractFilter.ALL -> all
            ContractFilter.ACTIVE -> all.filter {
                it.status == ContractStatus.ACTIVE || it.status == ContractStatus.PENDING_RENEWAL
            }
            ContractFilter.EXPIRED -> all.filter { it.status == ContractStatus.EXPIRED }
        }

    private fun com.mawared.dawliah.data.model.Order.toSyntheticContract(): Contract {
        val w = worker
        return Contract(
            id = id,
            contractNumber = orderNumber,
            workerName = w?.nameAr ?: "—",
            workerPhotoUrl = w?.photoUrl ?: "",
            profession = w?.profession ?: WorkerProfession.DOMESTIC_WORKER,
            nationality = w?.nationality ?: "—",
            nationalityFlag = w?.nationalityFlagEmoji ?: "🏳️",
            startDate = placedAt,
            endDate = "", // No end date in the order DTO; backend contract has one
            monthlySalary = w?.monthlySalary ?: selectedPackage.price,
            status = when (status) {
                com.mawared.dawliah.data.model.OrderStatus.COMPLETED ->
                    ContractStatus.EXPIRED
                com.mawared.dawliah.data.model.OrderStatus.CANCELLED ->
                    ContractStatus.EXPIRED
                else -> ContractStatus.ACTIVE
            },
            city = address.city,
        )
    }

    private companion object {
        // Map our UI status enum names to the "has a contract" set.
        // CONTRACT_IN_PROGRESS / ARRIVAL_IN_PROGRESS / COMPLETED all imply
        // a signed contract; CANCELLED keeps it as historic-expired.
        val CONTRACT_STATUS_CODES = setOf(
            "CONTRACT_IN_PROGRESS",
            "ARRIVAL_IN_PROGRESS",
            "COMPLETED",
            "CANCELLED",
        )
    }
}
