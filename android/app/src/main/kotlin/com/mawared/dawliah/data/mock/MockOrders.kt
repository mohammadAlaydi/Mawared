package com.mawared.dawliah.data.mock

import com.mawared.dawliah.data.model.*

object MockOrders {
    val all: List<Order> = listOf(
        Order("o1", "MD-2024-00123", MockServices.domesticWorker, MockPackages.all[3], MockWorkers.all[0], MockAddresses.all[0], "أرجو الحضور الساعة 8 صباحاً", OrderStatus.COMPLETED, 2200, "2024-12-15",
            listOf(OrderStatusUpdate(OrderStatus.SUBMITTED, "2024-12-15 09:00"), OrderStatusUpdate(OrderStatus.PAYMENT_COMPLETED, "2024-12-15 09:30"), OrderStatusUpdate(OrderStatus.UNDER_REVIEW, "2024-12-15 10:00"), OrderStatusUpdate(OrderStatus.WORKER_SELECTED, "2024-12-16 14:00"), OrderStatusUpdate(OrderStatus.COMPLETED, "2025-01-15 12:00"))),
        Order("o2", "MD-2024-00145", MockServices.driver, MockPackages.all[4], MockWorkers.all[8], MockAddresses.all[1], "", OrderStatus.PROCESSING, 2500, "2025-01-20",
            listOf(OrderStatusUpdate(OrderStatus.SUBMITTED, "2025-01-20 11:00"), OrderStatusUpdate(OrderStatus.PAYMENT_COMPLETED, "2025-01-20 11:15"), OrderStatusUpdate(OrderStatus.PROCESSING, "2025-01-21 09:00"))),
        Order("o3", "MD-2025-00012", MockServices.domesticWorker, MockPackages.all[1], null, MockAddresses.all[0], "تنظيف عميق مطلوب", OrderStatus.SUBMITTED, 280, "2025-02-01",
            listOf(OrderStatusUpdate(OrderStatus.SUBMITTED, "2025-02-01 14:30"))),
        Order("o4", "MD-2025-00034", MockServices.elderlyCare, MockPackages.all[5], MockWorkers.all[12], MockAddresses.all[2], "والدتي تحتاج رعاية خاصة", OrderStatus.WORKER_SELECTED, 2200, "2025-02-10",
            listOf(OrderStatusUpdate(OrderStatus.SUBMITTED, "2025-02-10 08:00"), OrderStatusUpdate(OrderStatus.PAYMENT_COMPLETED, "2025-02-10 08:20"), OrderStatusUpdate(OrderStatus.UNDER_REVIEW, "2025-02-10 10:00"), OrderStatusUpdate(OrderStatus.WORKER_SELECTED, "2025-02-11 15:00"))),
        Order("o5", "MD-2025-00056", MockServices.domesticWorker, MockPackages.all[0], null, MockAddresses.all[0], "", OrderStatus.CANCELLED, 150, "2025-01-05",
            listOf(OrderStatusUpdate(OrderStatus.SUBMITTED, "2025-01-05 16:00"), OrderStatusUpdate(OrderStatus.CANCELLED, "2025-01-05 17:00", "تم الإلغاء بطلب العميل"))),
    )
}
