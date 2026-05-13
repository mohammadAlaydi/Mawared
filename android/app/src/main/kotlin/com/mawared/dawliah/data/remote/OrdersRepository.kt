package com.mawared.dawliah.data.remote

import com.mawared.api.CancelOrderRequest
import com.mawared.api.CreateOrderRequest
import com.mawared.api.MawaredApi
import com.mawared.dawliah.data.model.Order
import java.util.UUID

/**
 * Customer-facing orders. The backend list response is intentionally flat
 * — pagination is per-customer and the dataset is small, so we don't add a
 * cursor here. Detail and creation use idempotency keys from the
 * `IdempotencyInterceptor` chain; we pass an explicit value to
 * `create()` to make the contract obvious to callers.
 */
class OrdersRepository(private val api: MawaredApi) {

    suspend fun list(): List<Order> =
        api.orders.list().items.map { it.toDomainShallow() }

    suspend fun findById(id: String): Order = api.orders.findById(id).toDomainShallow()

    suspend fun create(
        workerId: String,
        packageId: String,
        addressId: String,
        promoCode: String? = null,
        notes: String? = null,
        idempotencyKey: String = UUID.randomUUID().toString(),
    ): Order = api.orders.create(
        body = CreateOrderRequest(
            workerId = workerId,
            packageId = packageId,
            addressId = addressId,
            promoCode = promoCode,
            notes = notes,
        ),
        idempotencyKey = idempotencyKey,
    ).toDomainShallow()

    suspend fun cancel(id: String, note: String? = null) =
        api.orders.cancel(id, CancelOrderRequest(reason = "CUSTOMER_REQUEST", note = note))
}
