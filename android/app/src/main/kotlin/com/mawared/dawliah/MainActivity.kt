package com.mawared.dawliah

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.navigation.compose.rememberNavController
import com.mawared.dawliah.ui.navigation.MawaredNavGraph
import com.mawared.dawliah.ui.theme.MawaredTheme
import com.mawared.dawliah.viewmodel.*

class MainActivity : ComponentActivity() {

    private val authViewModel: AuthViewModel by viewModels()
    private val homeViewModel: HomeViewModel by viewModels()
    private val workersViewModel: WorkersViewModel by viewModels()
    private val orderViewModel: OrderViewModel by viewModels()
    private val profileViewModel: ProfileViewModel by viewModels()
    private val contractsViewModel: ContractsViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            MawaredTheme {
                val navController = rememberNavController()
                MawaredNavGraph(
                    navController = navController,
                    authViewModel = authViewModel,
                    homeViewModel = homeViewModel,
                    workersViewModel = workersViewModel,
                    orderViewModel = orderViewModel,
                    profileViewModel = profileViewModel,
                    contractsViewModel = contractsViewModel,
                )
            }
        }
    }
}
