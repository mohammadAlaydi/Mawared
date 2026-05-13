import type { OrderStatus as BackendOrderStatus } from '@mawared/api-client';

/**
 * Centralized labels, colors, and transition rules for order statuses.
 *
 * The backend uses 11 UPPERCASE enum values (DRAFT, RESERVED, PAYMENT_PENDING,
 * PAYMENT_FAILED, PAID, UNDER_REVIEW, CONFIRMED, IN_PROGRESS, COMPLETED,
 * CANCELLED, REFUNDED) — see packages/shared-types/src/order-status.ts.
 *
 * The original UI mocks used a 10-value lowercase enum
 * ('submitted', 'payment_pending', ...). This module exposes labels for BOTH
 * so components can render real and mock data side-by-side during migration.
 */

export const BACKEND_ORDER_STATUSES = [
  'DRAFT',
  'RESERVED',
  'PAYMENT_PENDING',
  'PAYMENT_FAILED',
  'PAID',
  'UNDER_REVIEW',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
] as const satisfies readonly BackendOrderStatus[];

interface StatusDisplay {
  labelAr: string;
  className: string;
}

export const backendStatusDisplay: Record<BackendOrderStatus, StatusDisplay> = {
  DRAFT: { labelAr: 'مسودة', className: 'bg-gray-100 text-gray-700' },
  RESERVED: { labelAr: 'محجوز', className: 'bg-amber-100 text-amber-700' },
  PAYMENT_PENDING: { labelAr: 'بانتظار الدفع', className: 'bg-yellow-100 text-yellow-700' },
  PAYMENT_FAILED: { labelAr: 'فشل الدفع', className: 'bg-red-100 text-red-700' },
  PAID: { labelAr: 'تم الدفع', className: 'bg-teal-100 text-teal-700' },
  UNDER_REVIEW: { labelAr: 'قيد المراجعة', className: 'bg-purple-100 text-purple-700' },
  CONFIRMED: { labelAr: 'مؤكد', className: 'bg-indigo-100 text-indigo-700' },
  IN_PROGRESS: { labelAr: 'جاري التنفيذ', className: 'bg-cyan-100 text-cyan-700' },
  COMPLETED: { labelAr: 'مكتمل', className: 'bg-green-100 text-green-700' },
  CANCELLED: { labelAr: 'ملغى', className: 'bg-red-100 text-red-700' },
  REFUNDED: { labelAr: 'مسترد', className: 'bg-orange-100 text-orange-700' },
};

// Legacy lowercase labels kept so the still-mocked pages render until they
// are migrated. Remove after every page is on the real API.
export const legacyStatusDisplay: Record<string, StatusDisplay> = {
  submitted: { labelAr: 'تم الإرسال', className: 'bg-blue-100 text-blue-700' },
  payment_pending: { labelAr: 'بانتظار الدفع', className: 'bg-yellow-100 text-yellow-700' },
  payment_completed: { labelAr: 'تم الدفع', className: 'bg-teal-100 text-teal-700' },
  under_review: { labelAr: 'قيد المراجعة', className: 'bg-purple-100 text-purple-700' },
  processing: { labelAr: 'جاري المعالجة', className: 'bg-orange-100 text-orange-700' },
  worker_selected: { labelAr: 'تم اختيار العامل', className: 'bg-amber-100 text-amber-700' },
  contract_in_progress: { labelAr: 'العقد قيد الإعداد', className: 'bg-indigo-100 text-indigo-700' },
  arrival_in_progress: { labelAr: 'العامل في الطريق', className: 'bg-cyan-100 text-cyan-700' },
  completed: { labelAr: 'مكتمل', className: 'bg-green-100 text-green-700' },
  cancelled: { labelAr: 'ملغى', className: 'bg-red-100 text-red-700' },
};

export function getStatusDisplay(status: string): StatusDisplay {
  return (
    backendStatusDisplay[status as BackendOrderStatus] ??
    legacyStatusDisplay[status] ?? { labelAr: status, className: 'bg-gray-100 text-gray-600' }
  );
}

// ---------- Transition events ----------
//
// Mirrors the backend's AdminTransitionOrderSchema (5 events). UI surfaces
// only events that are legal from the current status — kept in sync with
// docs/backend/06-STATE_MACHINE.md.

export type TransitionEvent =
  | 'submitForReview'
  | 'confirm'
  | 'startService'
  | 'complete'
  | 'cancel';

interface TransitionMeta {
  event: TransitionEvent;
  labelAr: string;
  /** Style hint for the button. */
  tone: 'primary' | 'success' | 'danger';
}

const TRANSITION_LABELS: Record<TransitionEvent, Omit<TransitionMeta, 'event'>> = {
  submitForReview: { labelAr: 'إرسال للمراجعة', tone: 'primary' },
  confirm: { labelAr: 'تأكيد الطلب', tone: 'success' },
  startService: { labelAr: 'بدء التنفيذ', tone: 'primary' },
  complete: { labelAr: 'إنهاء الطلب', tone: 'success' },
  cancel: { labelAr: 'إلغاء', tone: 'danger' },
};

/**
 * Returns the transitions an admin can trigger from a given status.
 * Cancel is allowed from every non-terminal status; the backend state
 * machine is the final arbiter — this map only filters the UI.
 */
export function getLegalTransitions(status: BackendOrderStatus): TransitionMeta[] {
  const events: TransitionEvent[] = [];
  switch (status) {
    case 'PAID':
      events.push('submitForReview', 'cancel');
      break;
    case 'UNDER_REVIEW':
      events.push('confirm', 'cancel');
      break;
    case 'CONFIRMED':
      events.push('startService', 'cancel');
      break;
    case 'IN_PROGRESS':
      events.push('complete', 'cancel');
      break;
    case 'DRAFT':
    case 'RESERVED':
    case 'PAYMENT_PENDING':
    case 'PAYMENT_FAILED':
      events.push('cancel');
      break;
    // COMPLETED, CANCELLED, REFUNDED are terminal — no transitions.
    case 'COMPLETED':
    case 'CANCELLED':
    case 'REFUNDED':
      break;
  }
  return events.map((event) => ({ event, ...TRANSITION_LABELS[event] }));
}

export type { BackendOrderStatus };
