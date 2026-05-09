package com.mawared.dawliah.ui.screens.home

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mawared.dawliah.R
import com.mawared.dawliah.ui.components.*
import com.mawared.dawliah.ui.theme.*
import com.mawared.dawliah.viewmodel.AuthViewModel
import com.mawared.dawliah.viewmodel.HomeViewModel
import kotlinx.coroutines.delay
import kotlin.math.absoluteValue

@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    authViewModel: AuthViewModel,
    onServiceClick: (String) -> Unit,
    onViewAllWorkers: () -> Unit,
    onWorkerClick: (String) -> Unit,
    onNotificationsClick: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsState()
    val authState by authViewModel.uiState.collectAsState()

    // Staggered entrance animation
    var showContent by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        delay(100)
        showContent = true
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundWarm),
    ) {
        // A. Top greeting bar with brand logo
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceWhite)
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    // Brand logo mini
                    Image(
                        painter = painterResource(id = R.drawable.mawared_logo_clean),
                        contentDescription = "موارد",
                        contentScale = ContentScale.Fit,
                        modifier = Modifier
                            .height(36.dp),
                    )
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "مرحباً، ${authState.userName} 👋",
                            style = MaterialTheme.typography.headlineMedium,
                            color = TextPrimary,
                        )
                        Text(
                            text = "ماذا تحتاج اليوم؟",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary,
                        )
                    }
                }

                // Notification bell
                BadgedBox(
                    badge = {
                        if (uiState.unreadNotifications > 0) {
                            Badge(
                                containerColor = StatusError,
                                contentColor = SurfaceWhite,
                            ) {
                                Text("${uiState.unreadNotifications}")
                            }
                        }
                    }
                ) {
                    IconButton(onClick = onNotificationsClick) {
                        Icon(
                            imageVector = Icons.Filled.Notifications,
                            contentDescription = "الإشعارات",
                            tint = TextPrimary,
                        )
                    }
                }
            }
        }

        // B. Promo Banner Carousel with parallax
        item {
            Spacer(modifier = Modifier.height(16.dp))
            PromoBannerCarousel()
        }

        // C. Service Categories
        item {
            Spacer(modifier = Modifier.height(16.dp))
            SectionHeader(
                title = "خدماتنا",
                actionText = "عرض الكل",
                onActionClick = onViewAllWorkers,
            )
        }

        item {
            Column(
                modifier = Modifier.padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                // 2x2 grid with staggered animation
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    uiState.services.take(2).forEach { service ->
                        ServiceCard(
                            service = service,
                            onClick = { onServiceClick(service.id) },
                            modifier = Modifier
                                .weight(1f)
                                .height(130.dp),
                        )
                    }
                }
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    uiState.services.drop(2).take(2).forEach { service ->
                        ServiceCard(
                            service = service,
                            onClick = { onServiceClick(service.id) },
                            modifier = Modifier
                                .weight(1f)
                                .height(130.dp),
                        )
                    }
                }
            }
        }

        // D. Featured Workers
        item {
            Spacer(modifier = Modifier.height(16.dp))
            SectionHeader(
                title = "عمال مميزون",
                actionText = "عرض الكل",
                onActionClick = onViewAllWorkers,
            )
        }

        item {
            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(uiState.featuredWorkers) { worker ->
                    WorkerCard(
                        worker = worker,
                        isFavorite = false,
                        onFavoriteToggle = {},
                        onClick = { onWorkerClick(worker.id) },
                        modifier = Modifier.width(165.dp),
                    )
                }
            }
        }

        // E. How It Works
        item {
            Spacer(modifier = Modifier.height(24.dp))
            SectionHeader(title = "كيف يعمل التطبيق")
        }

        item {
            Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                HowItWorksStep(1, "اختر الخدمة المناسبة", "تصفح الخدمات المتاحة واختر ما يناسبك")
                HowItWorksStep(2, "حدد الباقة والعامل", "اختر الباقة والجنسية المفضلة")
                HowItWorksStep(3, "اطلب وتابع طلبك", "أكمل الطلب وتابع حالته لحظة بلحظة")
            }
        }

        // F. Stats Strip
        item {
            Spacer(modifier = Modifier.height(24.dp))
            StatsStrip()
            Spacer(modifier = Modifier.height(24.dp))
        }

        // Demo mode banner
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                colors = CardDefaults.cardColors(containerColor = AccentGold.copy(alpha = 0.1f)),
                shape = RoundedCornerShape(CornerMedium),
            ) {
                Text(
                    text = "أنت في وضع العرض التجريبي — جميع البيانات وهمية",
                    style = MaterialTheme.typography.labelMedium,
                    color = AccentGoldDark,
                    modifier = Modifier.padding(12.dp),
                    textAlign = TextAlign.Center,
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

/**
 * Enhanced promo banner carousel with:
 * - Parallax text offset based on scroll position
 * - Auto-scroll with smooth spring animation
 * - Animated worm-style dot indicators
 */
@Composable
private fun PromoBannerCarousel() {
    data class Banner(val text: String, val imageRes: Int, val gradientColors: List<androidx.compose.ui.graphics.Color>)

    val banners = listOf(
        Banner(
            "خصم 15% على الباقات الشهرية\nاستخدم كود MAWARED15",
            R.drawable.img_hero_worker,
            listOf(PrimaryGreen.copy(alpha = 0.85f), PrimaryGreenLight.copy(alpha = 0.7f)),
        ),
        Banner(
            "عمالة فلبينية بأسعار مميزة\nاحجز الآن واستفد من العرض",
            R.drawable.img_happy_family,
            listOf(PrimaryGreenLight.copy(alpha = 0.8f), PrimaryGreen.copy(alpha = 0.75f)),
        ),
        Banner(
            "خدمة جديدة: رعاية الأطفال\nمربيات محترفات بخبرة عالية",
            R.drawable.img_nanny,
            listOf(PrimaryGreen.copy(alpha = 0.8f), AccentGoldDark.copy(alpha = 0.7f)),
        ),
    )
    val pagerState = rememberPagerState(pageCount = { banners.size })

    // Auto-scroll with smooth spring
    LaunchedEffect(pagerState) {
        while (true) {
            delay(3500)
            val next = (pagerState.currentPage + 1) % banners.size
            pagerState.animateScrollToPage(
                page = next,
                animationSpec = tween(600, easing = EaseInOutCubic),
            )
        }
    }

    Column {
        HorizontalPager(
            state = pagerState,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            beyondViewportPageCount = 1,
            pageSpacing = 12.dp,
        ) { page ->
            val pageOffset = ((pagerState.currentPage - page) + pagerState.currentPageOffsetFraction).absoluteValue
            val textParallax = pageOffset * -80f
            val cardScale = 1f - (pageOffset * 0.08f).coerceAtMost(0.08f)
            val banner = banners[page]

            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(160.dp)
                    .graphicsLayer {
                        scaleY = cardScale
                        alpha = 1f - (pageOffset * 0.3f).coerceAtMost(0.3f)
                    },
                shape = RoundedCornerShape(CornerLarge),
            ) {
                Box(modifier = Modifier.fillMaxSize()) {
                    // Background real photo
                    Image(
                        painter = painterResource(id = banner.imageRes),
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .fillMaxSize()
                            .graphicsLayer { translationX = pageOffset * 50f },
                    )
                    // Gradient overlay for readability
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.horizontalGradient(
                                    colors = banner.gradientColors
                                )
                            ),
                    )
                    // Text content with parallax
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(20.dp),
                        contentAlignment = Alignment.CenterStart,
                    ) {
                        Text(
                            text = banner.text,
                            style = MaterialTheme.typography.titleLarge,
                            color = SurfaceWhite,
                            lineHeight = 28.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.graphicsLayer { translationX = textParallax },
                        )
                    }
                }
            }
        }

        // Animated worm-style dots
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 10.dp),
            horizontalArrangement = Arrangement.Center,
        ) {
            repeat(banners.size) { i ->
                val isActive = pagerState.currentPage == i
                val width by animateDpAsState(
                    targetValue = if (isActive) 24.dp else 6.dp,
                    animationSpec = spring(
                        dampingRatio = Spring.DampingRatioMediumBouncy,
                        stiffness = Spring.StiffnessMedium,
                    ),
                    label = "dot_w",
                )
                val color by animateColorAsState(
                    targetValue = if (isActive) AccentGold else ShimmerBase,
                    animationSpec = tween(300),
                    label = "dot_c",
                )
                Box(
                    modifier = Modifier
                        .padding(horizontal = 3.dp)
                        .height(6.dp)
                        .width(width)
                        .clip(CircleShape)
                        .background(color),
                )
            }
        }
    }
}

@Composable
private fun HowItWorksStep(number: Int, title: String, subtitle: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.Top,
    ) {
        // Number circle
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(CircleShape)
                .background(PrimaryGreen),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = "$number",
                style = MaterialTheme.typography.titleMedium,
                color = SurfaceWhite,
                fontWeight = FontWeight.Bold,
            )
        }

        Spacer(modifier = Modifier.width(12.dp))

        Column {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = TextPrimary,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary,
            )
        }
    }
}

@Composable
private fun StatsStrip() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        StatCard("500+", "عميل راضٍ", Modifier.weight(1f))
        StatCard("200+", "عامل متاح", Modifier.weight(1f))
        StatCard("98%", "نسبة الرضا", Modifier.weight(1f))
    }
}

@Composable
private fun StatCard(value: String, label: String, modifier: Modifier = Modifier) {
    // Animated counter-like entrance
    var showStat by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        delay(300)
        showStat = true
    }
    val scale by animateFloatAsState(
        targetValue = if (showStat) 1f else 0.5f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessMediumLow,
        ),
        label = "stat_scale",
    )

    Card(
        modifier = modifier,
        shape = RoundedCornerShape(CornerMedium),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp)
                .graphicsLayer {
                    scaleX = scale
                    scaleY = scale
                },
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = value,
                style = MaterialTheme.typography.headlineMedium,
                color = PrimaryGreen,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = TextSecondary,
            )
        }
    }
}
