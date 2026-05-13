package com.mawared.dawliah.data.remote

import com.mawared.api.MawaredApi
import com.mawared.api.Worker

/**
 * Sample repository — replace `data/mock/MockWorkers` calls in ViewModels
 * with `WorkersRepository(api).search(...)`. The ViewModel can stay almost
 * unchanged if you map [Worker] back to the existing domain model.
 *
 * Example wiring in a ViewModel:
 *
 *   class WorkersViewModel(private val repo: WorkersRepository) : ViewModel() {
 *       private val _state = MutableStateFlow<List<Worker>>(emptyList())
 *       val state: StateFlow<List<Worker>> = _state
 *       fun load(profession: String?) {
 *           viewModelScope.launch {
 *               runCatching { repo.search(profession) }
 *                 .onSuccess { _state.value = it }
 *                 .onFailure { /* show snackbar */ }
 *           }
 *       }
 *   }
 */
class WorkersRepository(private val api: MawaredApi) {

    suspend fun search(profession: String? = null, query: String? = null): List<Worker> =
        api.workers.search(profession = profession, query = query).items

    suspend fun findById(id: String): Worker = api.workers.findById(id)
}
