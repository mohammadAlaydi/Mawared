package com.mawared.dawliah

import android.app.Application
import com.mawared.dawliah.data.di.AppContainer

/**
 * Application root. Initializes the [AppContainer] (which holds the
 * Mawared API client + token storage). ViewModels and Composables reach
 * the container via `context.appContainer()` (see `data/di/AppContainer.kt`).
 */
class MawaredApp : Application() {

    /** Initialized in [onCreate]; safe to access from any process after start-up. */
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
