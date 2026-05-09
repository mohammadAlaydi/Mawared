package com.mawared.dawliah.data.mock

import com.mawared.dawliah.data.model.Branch

object MockBranches {
    val all: List<Branch> = listOf(
        Branch(
            id = "b1",
            nameAr = "الفرع الرئيسي — الرياض",
            city = "الرياض",
            district = "حي العليا، طريق الملك فهد",
            phone = "011-4567890",
            workingHoursAr = "الأحد - الخميس: 8:00 ص - 5:00 م",
            latitude = 24.7136,
            longitude = 46.6753,
        ),
        Branch(
            id = "b2",
            nameAr = "فرع جدة",
            city = "جدة",
            district = "حي الروضة، شارع التحلية",
            phone = "012-3456789",
            workingHoursAr = "الأحد - الخميس: 8:00 ص - 5:00 م",
            latitude = 21.5433,
            longitude = 39.1728,
        ),
        Branch(
            id = "b3",
            nameAr = "فرع الدمام",
            city = "الدمام",
            district = "حي الشاطئ، شارع الأمير محمد بن فهد",
            phone = "013-8765432",
            workingHoursAr = "الأحد - الخميس: 8:30 ص - 4:30 م",
            latitude = 26.3927,
            longitude = 49.9777,
        ),
        Branch(
            id = "b4",
            nameAr = "فرع مكة المكرمة",
            city = "مكة المكرمة",
            district = "حي العزيزية، شارع المنصور",
            phone = "012-5551234",
            workingHoursAr = "الأحد - الخميس: 9:00 ص - 5:00 م",
            latitude = 21.3891,
            longitude = 39.8579,
        ),
        Branch(
            id = "b5",
            nameAr = "فرع المدينة المنورة",
            city = "المدينة المنورة",
            district = "حي العنبرية، طريق السلام",
            phone = "014-8321456",
            workingHoursAr = "الأحد - الخميس: 8:00 ص - 4:00 م",
            latitude = 24.4672,
            longitude = 39.6024,
        ),
        Branch(
            id = "b6",
            nameAr = "فرع الخبر",
            city = "الخبر",
            district = "حي الحزام الذهبي، شارع الأمير تركي",
            phone = "013-8641234",
            workingHoursAr = "الأحد - الخميس: 8:30 ص - 4:30 م",
            latitude = 26.2172,
            longitude = 50.1971,
        ),
    )

    val cities: List<String> by lazy {
        all.map { it.city }.distinct()
    }

    fun getByCity(city: String): List<Branch> =
        all.filter { it.city == city }
}
