package com.mawared.dawliah.data.mock

import com.mawared.dawliah.data.model.Notification
import com.mawared.dawliah.data.model.NotificationType

object MockNotifications {
    val all: List<Notification> = listOf(
        Notification("n1", "تم قبول طلبك", "طلبك رقم MD-2024-00145 تم قبوله وجاري المعالجة", NotificationType.ORDER_UPDATE, "o2", "منذ ساعة", "اليوم", false),
        Notification("n2", "عرض خاص!", "خصم 15% على باقات العاملة المنزلية الشهرية — استخدم كود MAWARED15", NotificationType.PROMOTION, null, "منذ 3 ساعات", "اليوم", false),
        Notification("n3", "تم اختيار العامل", "تم اختيار عاملة لطلبك رقم MD-2025-00034", NotificationType.ORDER_UPDATE, "o4", "منذ 5 ساعات", "اليوم", false),
        Notification("n4", "تذكير بالدفع", "يرجى إتمام الدفع لطلبك رقم MD-2025-00012", NotificationType.ORDER_UPDATE, "o3", "أمس 10:00 ص", "الأمس", true),
        Notification("n5", "تم التحقق من هويتك", "تهانينا! تم التحقق من هويتك بنجاح عبر منصة Signit", NotificationType.SUCCESS, null, "أمس 2:00 م", "الأمس", true),
        Notification("n6", "طلبك مكتمل", "طلبك رقم MD-2024-00123 تم إكماله بنجاح. شكراً لثقتك!", NotificationType.ORDER_UPDATE, "o1", "قبل 3 أيام", "هذا الأسبوع", true),
        Notification("n7", "باقة جديدة متاحة", "تعرف على باقة الرعاية المنزلية الشاملة الجديدة", NotificationType.PROMOTION, null, "قبل 5 أيام", "هذا الأسبوع", true),
        Notification("n8", "تحديث النظام", "تم تحديث التطبيق لتحسين تجربتك. اكتشف الميزات الجديدة!", NotificationType.SYSTEM, null, "قبل أسبوع", "هذا الأسبوع", true),
        Notification("n9", "تم إلغاء الطلب", "تم إلغاء طلبك رقم MD-2025-00056 بناءً على طلبك", NotificationType.ORDER_UPDATE, "o5", "قبل أسبوع", "هذا الأسبوع", true),
        Notification("n10", "مرحباً بك!", "أهلاً بك في موارد الدولية — خدمك في راحتك", NotificationType.SYSTEM, null, "قبل شهر", "هذا الأسبوع", true),
    )
}
