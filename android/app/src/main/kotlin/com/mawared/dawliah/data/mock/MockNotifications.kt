package com.mawared.dawliah.data.mock

import com.mawared.dawliah.data.model.Notification
import com.mawared.dawliah.data.model.NotificationType

object MockNotifications {
    val all: List<Notification> = listOf(
        Notification("n1", "تم قبول طلبك", "طلبك رقم MD-2024-00145 تم قبوله وجاري المعالجة", NotificationType.ORDER_UPDATE, "o2", "2025-02-12 09:00", false),
        Notification("n2", "عرض خاص!", "خصم 15% على باقات العاملة المنزلية الشهرية — استخدم كود MAWARED15", NotificationType.PROMOTION, null, "2025-02-12 08:00", false),
        Notification("n3", "تم اختيار العامل", "تم اختيار عاملة لطلبك رقم MD-2025-00034", NotificationType.ORDER_UPDATE, "o4", "2025-02-11 15:00", false),
        Notification("n4", "تذكير بالدفع", "يرجى إتمام الدفع لطلبك رقم MD-2025-00012", NotificationType.PAYMENT, "o3", "2025-02-11 10:00", true),
        Notification("n5", "تم التحقق من هويتك", "تهانينا! تم التحقق من هويتك بنجاح عبر منصة Signit", NotificationType.VERIFICATION, null, "2025-02-10 14:00", true),
        Notification("n6", "طلبك مكتمل", "طلبك رقم MD-2024-00123 تم إكماله بنجاح. شكراً لثقتك!", NotificationType.ORDER_UPDATE, "o1", "2025-01-15 12:00", true),
        Notification("n7", "باقة جديدة متاحة", "تعرف على باقة الرعاية المنزلية الشاملة الجديدة", NotificationType.PROMOTION, null, "2025-01-10 09:00", true),
        Notification("n8", "تحديث النظام", "تم تحديث التطبيق لتحسين تجربتك. اكتشف الميزات الجديدة!", NotificationType.SYSTEM, null, "2025-01-08 12:00", true),
        Notification("n9", "تم إلغاء الطلب", "تم إلغاء طلبك رقم MD-2025-00056 بناءً على طلبك", NotificationType.ORDER_UPDATE, "o5", "2025-01-05 17:00", true),
        Notification("n10", "مرحباً بك!", "أهلاً بك في موارد الدولية — خدمك في راحتك", NotificationType.SYSTEM, null, "2024-12-01 10:00", true),
    )
}
