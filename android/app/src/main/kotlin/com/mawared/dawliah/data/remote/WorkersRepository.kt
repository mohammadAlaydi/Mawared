package com.mawared.dawliah.data.remote

import com.mawared.api.MawaredApi
import com.mawared.dawliah.data.model.Worker

/**
 * Worker domain-facing repository. Wraps the Retrofit `WorkersApi` and
 * returns the existing `com.mawared.dawliah.data.model.Worker` shape so
 * Composables don't need to change.
 *
 * Note: pagination is intentionally collapsed to "first page only" for now.
 * If/when the worker list outgrows 20 items, expose `nextCursor` to the
 * ViewModel and surface a "load more" affordance.
 */
class WorkersRepository(private val api: MawaredApi) {

    suspend fun search(
        profession: String? = null,
        query: String? = null,
        nationalityCode: String? = null,
        limit: Int? = 50,
    ): List<Worker> =
        api.workers
            .search(
                profession = profession,
                query = query,
                nationalityCode = nationalityCode,
                limit = limit,
            )
            .items
            .map { it.toDomain() }

    suspend fun findById(id: String): Worker = api.workers.findById(id).toDomain()

    suspend fun listFavorites(): List<Worker> =
        api.me.listFavorites().items.map { it.toDomain() }

    suspend fun addFavorite(workerId: String) = api.me.addFavorite(workerId)

    suspend fun removeFavorite(workerId: String) = api.me.removeFavorite(workerId)
}
