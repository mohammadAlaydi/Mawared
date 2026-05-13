import type { NotificationType } from '@prisma/client';
import type { OrderStatus } from '@mawared/shared-types';

export interface OrderNotificationTemplate {
  type: NotificationType;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
}

/**
 * Maps an order status (after a transition) to the customer-facing
 * notification template. Returns undefined for statuses that should not
 * generate a push (e.g. DRAFT, PAYMENT_PENDING).
 */
export function templateForStatus(
  status: OrderStatus,
  orderNumber: string,
): OrderNotificationTemplate | undefined {
  switch (status) {
    case 'RESERVED':
      return {
        type: 'ORDER_UPDATE',
        titleAr: 'تم حجز العاملة',
        titleEn: 'Worker reserved',
        bodyAr: `طلبك ${orderNumber} قيد الانتظار. أكمل الدفع خلال 15 دقيقة.`,
        bodyEn: `Order ${orderNumber} reserved. Complete payment within 15 minutes.`,
      };
    case 'PAID':
      return {
        type: 'PAYMENT',
        titleAr: 'تم استلام الدفع',
        titleEn: 'Payment received',
        bodyAr: `تم تأكيد دفع طلبك ${orderNumber}.`,
        bodyEn: `Payment for order ${orderNumber} confirmed.`,
      };
    case 'PAYMENT_FAILED':
      return {
        type: 'PAYMENT',
        titleAr: 'فشلت عملية الدفع',
        titleEn: 'Payment failed',
        bodyAr: `لم يتم إتمام الدفع لطلبك ${orderNumber}. حاول مرة أخرى.`,
        bodyEn: `Payment for order ${orderNumber} failed. Please try again.`,
      };
    case 'CONFIRMED':
      return {
        type: 'ORDER_UPDATE',
        titleAr: 'تم تأكيد الطلب',
        titleEn: 'Order confirmed',
        bodyAr: `تم تأكيد طلبك ${orderNumber} وإصدار العقد.`,
        bodyEn: `Order ${orderNumber} confirmed; contract issued.`,
      };
    case 'IN_PROGRESS':
      return {
        type: 'ORDER_UPDATE',
        titleAr: 'الخدمة قيد التنفيذ',
        titleEn: 'Service in progress',
        bodyAr: `طلبك ${orderNumber} قيد التنفيذ.`,
        bodyEn: `Order ${orderNumber} is in progress.`,
      };
    case 'COMPLETED':
      return {
        type: 'ORDER_UPDATE',
        titleAr: 'تم اكتمال الخدمة',
        titleEn: 'Service completed',
        bodyAr: `تم اكتمال طلبك ${orderNumber}. شكراً لاختيارك موارد.`,
        bodyEn: `Order ${orderNumber} completed. Thank you for choosing Mawared.`,
      };
    case 'CANCELLED':
      return {
        type: 'ORDER_UPDATE',
        titleAr: 'تم إلغاء الطلب',
        titleEn: 'Order cancelled',
        bodyAr: `تم إلغاء طلبك ${orderNumber}.`,
        bodyEn: `Order ${orderNumber} cancelled.`,
      };
    case 'REFUNDED':
      return {
        type: 'PAYMENT',
        titleAr: 'تم استرداد المبلغ',
        titleEn: 'Refund issued',
        bodyAr: `تم استرداد المبلغ بالكامل لطلبك ${orderNumber}.`,
        bodyEn: `Order ${orderNumber} has been fully refunded.`,
      };
    default:
      return undefined;
  }
}
