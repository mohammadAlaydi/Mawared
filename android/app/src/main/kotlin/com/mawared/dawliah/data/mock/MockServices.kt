package com.mawared.dawliah.data.mock

import com.mawared.dawliah.data.model.ServiceCategory
import com.mawared.dawliah.data.model.WorkerProfession

/**
 * 4 service categories matching the app's core offerings.
 */
object MockServices {

    val domesticWorker = ServiceCategory(
        id = "svc1",
        nameAr = "عاملة منزلية",
        descriptionAr = "خدمات التنظيف والطبخ والكي وترتيب المنزل",
        iconName = "cleaning_services",
        profession = WorkerProfession.DOMESTIC_WORKER,
    )

    val driver = ServiceCategory(
        id = "svc2",
        nameAr = "سائق",
        descriptionAr = "خدمات القيادة والتوصيل اليومي للعائلة",
        iconName = "directions_car",
        profession = WorkerProfession.DRIVER,
    )

    val elderlyCare = ServiceCategory(
        id = "svc3",
        nameAr = "رعاية مسنين",
        descriptionAr = "رعاية كبار السن والمرافقة الصحية المنزلية",
        iconName = "elderly",
        profession = WorkerProfession.CAREGIVER_ELDERLY,
    )

    val childCare = ServiceCategory(
        id = "svc4",
        nameAr = "مربية أطفال",
        descriptionAr = "رعاية الأطفال والتعليم المبكر واللعب التعليمي",
        iconName = "child_care",
        profession = WorkerProfession.CAREGIVER_CHILD,
    )

    val all: List<ServiceCategory> = listOf(domesticWorker, driver, elderlyCare, childCare)
}
