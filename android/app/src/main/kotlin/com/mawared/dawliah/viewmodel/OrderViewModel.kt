package com.mawared.dawliah.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.mawared.dawliah.data.di.appContainer
import com.mawared.dawliah.data.model.Address
import com.mawared.dawliah.data.model.Order
import com.mawared.dawliah.data.model.ServiceCategory
import com.mawared.dawliah.data.model.ServicePackage
import com.mawared.dawliah.data.model.Worker
import com.mawared.dawliah.data.remote.AddressesRepository
import com.mawared.dawliah.data.remote.ApiErrors
import com.mawared.dawliah.data.remote.OrdersRepository
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
    val savedAddresses: List<Address> = emptyList(),
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

/**
 * Order placement + history. Lists `/v1/orders`, creates via
 * `/v1/orders` with an explicit idempotency key, cancels via
 * `/v1/orders/:id/cancel`. Addresses are pulled in parallel from
 * `/v1/me/addresses`.
 *
 * Note: the existing UI domain `Order` has fully nested
 * service/package/worker/address objects, but the backend list DTO is
 * flat. We render with placeholder nested objects on the list and
 * enrich on detail open (see `loadOrderDetail`).
 *
 * Promo validation is best-effort client-side — the backend rejects
 * invalid codes at order-create time anyway.
 */
class OrderViewModel(application: Application) : AndroidViewModel(application) {

    private val container = application.appContainer()
    private val orders = OrdersRepository(container.api)
    private val addresses = AddressesRepository(container.api)

    private val _uiState = MutableStateFlow(OrderUiState())
    val uiState: StateFlow<OrderUiState> = _uiState.asStateFlow()

    init {
        loadOrders()
        loadAddresses()
    }

    private fun loadOrders() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            runCatching { orders.list() }
                .onSuccess { list ->
                    _uiState.update { it.copy(isLoading = false, orders = list) }
                }
                .onFailure { t ->
                    _uiState.update {
                        it.copy(isLoading = false, error = ApiErrors.toMessage(t))
                    }
                }
        }
    }

    private fun loadAddresses() {
        viewModelScope.launch {
            // Best-effort — anonymous users 401 here, that's fine.
            runCatching { addresses.list() }
                .onSuccess { list -> _uiState.update { it.copy(savedAddresses = list) } }
        }
    }

    fun selectService(service: ServiceCategory) {
        _uiState.update { it.copy(selectedService = service) }
    }

    fun selectPackage(pkg: ServicePackage) {
        _uiState.update { it.copy(selectedPackage = pkg) }
    }

    fun selectWorker(worker: Worker?) {
        _uiState.update { it.copy(selectedWorker = worker) }
    }

    fun selectAddress(address: Address) {
        _uiState.update { it.copy(selectedAddress = address) }
    }

    fun updateNotes(notes: String) {
        _uiState.update { it.copy(notes = notes) }
    }

    fun setStep(step: Int) {
        _uiState.update { it.copy(currentStep = step) }
    }

    fun toggleTerms() {
        _uiState.update { it.copy(agreedToTerms = !it.agreedToTerms) }
    }

    fun selectPayment(method: String) {
        _uiState.update { it.copy(selectedPayment = method) }
    }

    fun applyPromo(code: String) {
        // Client-side preview only; the backend validates the actual discount
        // at order-create time. We keep the 15% guess for the known promo so
        // the UI shows something before committing.
        val discount = if (code.equals("MAWARED15", ignoreCase = true)) 15 else 0
        _uiState.update { it.copy(promoCode = code, promoDiscount = discount) }
    }

    /**
     * POST /v1/orders. Idempotency is enforced both by an explicit key here
     * and by the global IdempotencyInterceptor fallback. If the backend
     * rejects (e.g. worker no longer available, identity verification
     * required), we surface the Arabic error and leave the draft state
     * intact so the user can retry.
     */
    fun placeOrder() {
        val state = _uiState.value
        val workerId = state.selectedWorker?.id
        val packageId = state.selectedPackage?.id
        val addressId = state.selectedAddress?.id
        if (workerId == null || packageId == null || addressId == null) {
            _uiState.update { it.copy(error = "اختر العامل والباقة والعنوان") }
            return
        }
        viewModelScope.launch {
            _uiState.update { it.copy(isProcessing = true, error = null) }
            runCatching {
                orders.create(
                    workerId = workerId,
                    packageId = packageId,
                    addressId = addressId,
                    promoCode = state.promoCode.ifBlank { null },
                    notes = state.notes.ifBlank { null },
                )
            }.onSuccess { placed ->
                _uiState.update {
                    it.copy(
                        isProcessing = false,
                        isOrderPlaced = true,
                        placedOrderId = placed.id,
                        orders = listOf(placed) + it.orders,
                        error = null,
                    )
                }
            }.onFailure { t ->
                _uiState.update {
                    it.copy(isProcessing = false, error = ApiErrors.toMessage(t))
                }
            }
        }
    }

    fun loadOrderDetail(id: String) {
        viewModelScope.launch {
            runCatching { orders.findById(id) }
                .onSuccess { fresh ->
                    _uiState.update {
                        it.copy(orders = it.orders.map { o -> if (o.id == fresh.id) fresh else o })
                    }
                }
        }
    }

    fun cancelOrder(id: String, note: String? = null) {
        viewModelScope.launch {
            runCatching { orders.cancel(id, note) }
                .onSuccess { loadOrders() }
                .onFailure { t -> _uiState.update { it.copy(error = ApiErrors.toMessage(t)) } }
        }
    }

    fun resetOrder() {
        _uiState.update {
            OrderUiState(orders = it.orders, savedAddresses = it.savedAddresses, isLoading = false)
        }
    }

    fun getOrderById(id: String): Order? = _uiState.value.orders.find { it.id == id }

    val totalPrice: Int
        get() {
            val state = _uiState.value
            val base = state.selectedPackage?.price ?: 0
            val discount = if (state.promoDiscount > 0) (base * state.promoDiscount / 100) else 0
            return base + state.serviceFee - discount
        }
}
