package com.mawared.dawliah.data.remote

import com.mawared.api.MawaredApi
import com.mawared.dawliah.data.model.ServiceCategory

/**
 * Public catalog reads. As of the Phase A backend changes, `/v1/services`
 * and `/v1/services/:id/packages` are `@Public()` so this works without
 * authentication — useful for the marketing screens before login.
 */
class CatalogRepository(private val api: MawaredApi) {

    suspend fun listServices(): List<ServiceCategory> =
        api.catalog.listServices().items.map { it.toDomain() }

    // Note: package mapping not done yet — UI screens for packages still
    // read from MockPackages. When wired, add `.toDomain()` extension in
    // ApiMappers.kt and return List<com.mawared.dawliah.data.model.ServicePackage>.
}
