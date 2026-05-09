package com.mawared.dawliah.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawared.dawliah.data.mock.MockAddresses
import com.mawared.dawliah.data.mock.MockOrders
import com.mawared.dawliah.data.model.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class OrderUiState(
    val currentStep: Int = 0,
    val selectedService: ServiceCategory? = null,
    val selectedPackage: ServicePackage? = null,
    val selectedWorker: Worker? = null,
    val selectedAddress: Address? = null,
    val savedAddresses: List<Address> = MockAddresses.all,
    val notes: String = "",
    val promoCode: String = "",
    val promoDiscount: Int = 0,
    val serviceFee: Int = 50,
    val agreedToTerms: Boolean = false,
    val selectedPayment: String = "card",
    val isProcessing: Boolean = false,
    val isOrderPlaced: Boolean = false,
    val placedOrderId: String? = null,
    val orders: List<Order> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null,
)

class OrderViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(OrderUiState())
    val uiState: StateFlow<OrderUiState> = _uiState.asStateFlow()

    init { loadOrders() }

    private fun loadOrders() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            delay(1000)
            _uiState.update { it.copy(isLoading = false, orders = MockOrders.all) }
        }
    }

    fun selectService(service: ServiceCategory) { _uiState.update { it.copy(selectedService = service) } }
    fun selectPackage(pkg: ServicePackage) { _uiState.update { it.copy(selectedPackage = pkg) } }
    fun selectWorker(worker: Worker?) { _uiState.update { it.copy(selectedWorker = worker) } }
    fun selectAddress(address: Address) { _uiState.update { it.copy(selectedAddress = address) } }
    fun updateNotes(notes: String) { _uiState.update { it.copy(notes = notes) } }
    fun setStep(step: Int) { _uiState.update { it.copy(currentStep = step) } }
    fun toggleTerms() { _uiState.update { it.copy(agreedToTerms = !it.agreedToTerms) } }
    fun selectPayment(method: String) { _uiState.update { it.copy(selectedPayment = method) } }

    fun applyPromo(code: String) {
        val discount = if (code == "MAWARED15") 15 else 0
        _uiState.update { it.copy(promoCode = code, promoDiscount = discount) }
    }

    fun placeOrder() {
        viewModelScope.launch {
            _uiState.update { it.copy(isProcessing = true) }
            delay(2000)
            val orderId = "MD-2025-${(100..999).random()}"
            _uiState.update { it.copy(isProcessing = false, isOrderPlaced = true, placedOrderId = orderId) }
        }
    }

    fun resetOrder() { _uiState.update { OrderUiState(orders = it.orders, isLoading = false) } }
    fun getOrderById(id: String): Order? = _uiState.value.orders.find { it.id == id }

    val totalPrice: Int
        get() {
            val state = _uiState.value
            val base = state.selectedPackage?.price ?: 0
            val discount = if (state.promoDiscount > 0) (base * state.promoDiscount / 100) else 0
            return base + state.serviceFee - discount
        }
}
