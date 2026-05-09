package com.mawared.dawliah.data.mock

import com.mawared.dawliah.data.model.Offer

object MockOffers {
    val all: List<Offer> = listOf(
        Offer(
            id = "of1",
            titleAr = "خصم 15% على الباقات الشهرية",
            descriptionAr = "احصل على خصم 15% عند طلب أي باقة شهرية للعمالة المنزلية. العرض ساري حتى نهاية الشهر.",
            discountPercent = 15,
            promoCode = "MAWARED15",
            expiryDate = "2025-12-31",
            badgeText = "الأكثر طلباً",
        ),
        Offer(
            id = "of2",
            titleAr = "عمالة فلبينية بأسعار مميزة",
            descriptionAr = "وفّر 500 ريال على رسوم الاستقدام عند اختيار العمالة الفلبينية. عرض لفترة محدودة.",
            discountPercent = 10,
            promoCode = "PHIL500",
            expiryDate = "2025-11-30",
            badgeText = "عرض محدود",
        ),
        Offer(
            id = "of3",
            titleAr = "باقة العائلة الذهبية",
            descriptionAr = "اطلب عاملتين واحصل على خصم 20% على الإجمالي. مناسب للعائلات الكبيرة.",
            discountPercent = 20,
            promoCode = "FAMILY20",
            expiryDate = "2026-01-15",
            badgeText = "توفير كبير",
        ),
        Offer(
            id = "of4",
            titleAr = "مستخدم جديد — خصم الترحيب",
            descriptionAr = "خصم خاص للمستخدمين الجدد على أول طلب. سجّل الآن واستفد.",
            discountPercent = 25,
            promoCode = "WELCOME25",
            expiryDate = "2026-06-30",
            badgeText = "جديد",
        ),
        Offer(
            id = "of5",
            titleAr = "خصم رمضان المبارك",
            descriptionAr = "بمناسبة شهر رمضان الكريم، خصم 10% على جميع خدمات النظافة والضيافة.",
            discountPercent = 10,
            promoCode = "RAMADAN10",
            expiryDate = "2025-04-01",
            isActive = false,
        ),
    )
}
