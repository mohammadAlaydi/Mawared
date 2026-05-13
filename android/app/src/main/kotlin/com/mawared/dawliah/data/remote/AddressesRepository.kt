package com.mawared.dawliah.data.remote

import com.mawared.api.CreateAddressRequest
import com.mawared.api.MawaredApi
import com.mawared.dawliah.data.model.Address

/**
 * Customer saved addresses. Maps `/v1/me/addresses` to the existing
 * domain [Address] shape — no field translation needed beyond
 * unwrapping `additionalNotes`.
 */
class AddressesRepository(private val api: MawaredApi) {

    suspend fun list(): List<Address> = api.me.listAddresses().items.map { it.toDomain() }

    suspend fun create(address: Address, isDefault: Boolean = false): Address =
        api.me.createAddress(
            CreateAddressRequest(
                label = address.label,
                city = address.city,
                district = address.district,
                street = address.street,
                buildingNumber = address.buildingNumber,
                additionalNotes = address.additionalNotes.ifBlank { null },
                isDefault = isDefault,
            )
        ).toDomain()

    suspend fun delete(id: String) = api.me.deleteAddress(id)
}
