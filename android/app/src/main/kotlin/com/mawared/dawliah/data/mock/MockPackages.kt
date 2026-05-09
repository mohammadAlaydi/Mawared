package com.mawared.dawliah.data.mock

import com.mawared.dawliah.data.model.PackageType
import com.mawared.dawliah.data.model.ServicePackage

object MockPackages {
    val all: List<ServicePackage> = listOf(
        ServicePackage("pkg1", "الباقة المرنة", "خدمة منزلية بالساعة", "svc1", PackageType.HOURLY, 4, "ساعات", 150, listOf("4 ساعات عمل", "تنظيف عام", "كي الملابس", "إمكانية التمديد"), false),
        ServicePackage("pkg2", "الباقة اليومية", "خدمة منزلية ليوم كامل", "svc1", PackageType.HOURLY, 8, "ساعات", 280, listOf("8 ساعات عمل", "تنظيف شامل", "طبخ وجبة واحدة", "كي وترتيب", "غسيل الملابس"), true),
        ServicePackage("pkg3", "الباقة الشهرية الأساسية", "عاملة منزلية مقيمة لمدة شهر", "svc1", PackageType.MONTHLY, 1, "شهر", 1500, listOf("إقامة كاملة", "تنظيف يومي", "طبخ يومي", "كي وغسيل", "دعم فني"), false),
        ServicePackage("pkg4", "الباقة الشهرية المميزة", "عاملة منزلية مقيمة مع خدمات إضافية", "svc1", PackageType.MONTHLY, 1, "شهر", 2200, listOf("إقامة كاملة", "تنظيف وطبخ يومي", "رعاية أطفال أساسية", "خدمة ضيافة", "استبدال مجاني خلال أسبوع"), true),
        ServicePackage("pkg5", "باقة السائق الشهرية", "سائق خاص مقيم لمدة شهر", "svc2", PackageType.MONTHLY, 1, "شهر", 2500, listOf("سائق مقيم", "توصيل يومي", "معرفة بالطرق", "رخصة قيادة سارية", "سجل مروري نظيف"), true),
        ServicePackage("pkg6", "باقة الرعاية الشهرية", "مقدم رعاية مقيم", "svc3", PackageType.MONTHLY, 1, "شهر", 2200, listOf("رعاية على مدار الساعة", "إعطاء الأدوية", "مرافقة المواعيد الطبية", "وجبات صحية", "تقارير أسبوعية"), false),
    )

    fun getByServiceId(serviceId: String) = all.filter { it.serviceId == serviceId }
}
