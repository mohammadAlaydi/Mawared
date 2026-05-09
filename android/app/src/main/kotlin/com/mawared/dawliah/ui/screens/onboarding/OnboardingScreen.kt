package com.mawared.dawliah.ui.screens.onboarding

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mawared.dawliah.R
import com.mawared.dawliah.ui.components.PrimaryButton
import com.mawared.dawliah.ui.theme.*
import kotlinx.coroutines.launch
import kotlin.math.absoluteValue

data class OnboardingPage(
    val imageRes: Int,
    val title: String,
    val subtitle: String,
)

private val pages = listOf(
    OnboardingPage(
        imageRes = R.drawable.img_hero_worker,
        title = "خدمك في راحتك",
        subtitle = "احجز عاملة منزلية أو سائقاً من منزلك بضغطة واحدة",
    ),
    OnboardingPage(
        imageRes = R.drawable.img_happy_family,
        title = "عائلة سعيدة، بيت مرتب",
        subtitle = "عمالة موثوقة ومعتمدة تجعل بيتك مكاناً أجمل",
    ),
    OnboardingPage(
        imageRes = R.drawable.img_nanny,
        title = "رعاية متخصصة لأطفالك",
        subtitle = "مربيات محترفات يهتمون بأطفالك وأنت مطمئن",
    ),
)

/**
 * Premium onboarding with:
 * - Real photographs instead of emojis
 * - Parallax image offset based on scroll position
 * - Scale + fade transitions per page
 * - Animated worm-style dot indicators
 * - Smooth spring-based page snapping
 */
@Composable
fun OnboardingScreen(
    onFinish: () -> Unit,
) {
    val pagerState = rememberPagerState(pageCount = { pages.size })
    val scope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceWhite),
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
        ) {
            // Skip button + logo
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 48.dp, end = 16.dp, start = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                TextButton(onClick = onFinish) {
                    Text(
                        text = "تخطى",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary,
                    )
                }

                // Brand logo mini
                Image(
                    painter = painterResource(id = R.drawable.mawared_logo_clean),
                    contentDescription = "موارد",
                    contentScale = ContentScale.Fit,
                    modifier = Modifier
                        .height(32.dp)
                        .clip(RoundedCornerShape(4.dp)),
                )
            }

            // Pager with parallax effect
            HorizontalPager(
                state = pagerState,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                beyondViewportPageCount = 1,
            ) { page ->
                val pageOffset = ((pagerState.currentPage - page) + pagerState.currentPageOffsetFraction).absoluteValue

                OnboardingPageContent(
                    page = pages[page],
                    pageOffset = pageOffset,
                )
            }

            // Bottom section: animated indicators + button
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                // Animated worm-style dot indicators
                Row(
                    horizontalArrangement = Arrangement.Center,
                    modifier = Modifier.padding(bottom = 24.dp),
                ) {
                    repeat(pages.size) { index ->
                        val isActive = pagerState.currentPage == index

                        val width by animateDpAsState(
                            targetValue = if (isActive) 28.dp else 8.dp,
                            animationSpec = spring(
                                dampingRatio = Spring.DampingRatioMediumBouncy,
                                stiffness = Spring.StiffnessMedium,
                            ),
                            label = "dot_width",
                        )
                        val color by animateColorAsState(
                            targetValue = if (isActive) PrimaryGreen else ShimmerBase,
                            animationSpec = tween(300),
                            label = "dot_color",
                        )

                        Box(
                            modifier = Modifier
                                .padding(horizontal = 3.dp)
                                .height(8.dp)
                                .width(width)
                                .clip(CircleShape)
                                .background(color),
                        )
                    }
                }

                // Next / Start button
                val isLastPage = pagerState.currentPage == pages.size - 1

                PrimaryButton(
                    text = if (isLastPage) "ابدأ الآن" else "التالي",
                    onClick = {
                        if (isLastPage) {
                            onFinish()
                        } else {
                            scope.launch {
                                pagerState.animateScrollToPage(
                                    page = pagerState.currentPage + 1,
                                    animationSpec = spring(
                                        dampingRatio = Spring.DampingRatioLowBouncy,
                                        stiffness = Spring.StiffnessMediumLow,
                                    ),
                                )
                            }
                        }
                    },
                )
            }
        }
    }
}

/**
 * Individual onboarding page with real photo + parallax + scale transform.
 */
@Composable
private fun OnboardingPageContent(
    page: OnboardingPage,
    pageOffset: Float,
) {
    val imageParallax = pageOffset * -100f
    val textParallax = pageOffset * -40f
    val contentScale = 1f - (pageOffset * 0.12f).coerceAtMost(0.12f)
    val contentAlpha = 1f - (pageOffset * 0.4f).coerceAtMost(0.4f)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp)
            .graphicsLayer {
                scaleX = contentScale
                scaleY = contentScale
                alpha = contentAlpha
            },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        // Real photograph with parallax
        Image(
            painter = painterResource(id = page.imageRes),
            contentDescription = page.title,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .size(260.dp)
                .graphicsLayer { translationX = imageParallax }
                .clip(RoundedCornerShape(24.dp)),
        )

        Spacer(modifier = Modifier.height(32.dp))

        Text(
            text = page.title,
            style = MaterialTheme.typography.headlineLarge,
            color = TextPrimary,
            textAlign = TextAlign.Center,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.graphicsLayer { translationX = textParallax },
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = page.subtitle,
            style = MaterialTheme.typography.bodyLarge,
            color = TextSecondary,
            textAlign = TextAlign.Center,
            lineHeight = 24.sp,
            modifier = Modifier.graphicsLayer { translationX = textParallax * 0.5f },
        )
    }
}
