import type { OrderStatus } from '@mawared/shared-types';
import type { ContractStatus } from '@prisma/client';

/**
 * Customer-facing labels for order tracking. The product spec (§7) defines
 * 10 customer-facing statuses; our internal state machine uses 11 statuses
 * for legal/accounting clarity (DRAFT, PAYMENT_FAILED, REFUNDED are
 * internal). This file maps internal → display.
 *
 * Spec labels (in order):
 *   1. Order submitted          → DRAFT | RESERVED
 *   2. Payment pending          → PAYMENT_PENDING | PAYMENT_FAILED
 *   3. Payment completed        → PAID
 *   4. Under review             → UNDER_REVIEW
 *   5. Processing               → UNDER_REVIEW (auto-review on) or transient
 *   6. Worker selected          → CONFIRMED, contract not yet ACTIVE
 *   7. Contract in progress     → CONFIRMED, contract pending PDF / signing
 *   8. Arrival in progress      → IN_PROGRESS
 *   9. Completed                → COMPLETED
 *  10. Cancelled                → CANCELLED | REFUNDED
 */

export type DisplayKey =
  | 'ORDER_SUBMITTED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_COMPLETED'
  | 'UNDER_REVIEW'
  | 'PROCESSING'
  | 'WORKER_SELECTED'
  | 'CONTRACT_IN_PROGRESS'
  | 'ARRIVAL_IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface DisplayLabel {
  key: DisplayKey;
  labelAr: string;
  labelEn: string;
  /** 1-based index into the 10-step tracker for the timeline UI. */
  step: number;
  /** True if this step is terminal (don't advance past it). */
  terminal: boolean;
}

const LABELS: Record<DisplayKey, Omit<DisplayLabel, 'key'>> = {
  ORDER_SUBMITTED:      { labelAr: 'تم استلام الطلب',       labelEn: 'Order submitted',       step: 1,  terminal: false },
  PAYMENT_PENDING:      { labelAr: 'بانتظار الدفع',         labelEn: 'Payment pending',       step: 2,  terminal: false },
  PAYMENT_COMPLETED:    { labelAr: 'تم الدفع',              labelEn: 'Payment completed',     step: 3,  terminal: false },
  UNDER_REVIEW:         { labelAr: 'قيد المراجعة',          labelEn: 'Under review',          step: 4,  terminal: false },
  PROCESSING:           { labelAr: 'قيد المعالجة',          labelEn: 'Processing',            step: 5,  terminal: false },
  WORKER_SELECTED:      { labelAr: 'تم اختيار العاملة',     labelEn: 'Worker selected',       step: 6,  terminal: false },
  CONTRACT_IN_PROGRESS: { labelAr: 'العقد قيد الإصدار',     labelEn: 'Contract in progress',  step: 7,  terminal: false },
  ARRIVAL_IN_PROGRESS:  { labelAr: 'الوصول قيد التنفيذ',     labelEn: 'Arrival in progress',   step: 8,  terminal: false },
  COMPLETED:            { labelAr: 'مكتمل',                 labelEn: 'Completed',             step: 9,  terminal: true  },
  CANCELLED:            { labelAr: 'ملغي',                  labelEn: 'Cancelled',             step: 10, terminal: true  },
};

export function displayForOrder(input: {
  status: OrderStatus;
  hasContract: boolean;
  contractStatus?: ContractStatus | null;
}): DisplayLabel {
  const key = mapStatus(input);
  return { key, ...LABELS[key] };
}

function mapStatus(input: {
  status: OrderStatus;
  hasContract: boolean;
  contractStatus?: ContractStatus | null;
}): DisplayKey {
  switch (input.status) {
    case 'DRAFT':
    case 'RESERVED':
      return 'ORDER_SUBMITTED';
    case 'PAYMENT_PENDING':
    case 'PAYMENT_FAILED':
      return 'PAYMENT_PENDING';
    case 'PAID':
      return 'PAYMENT_COMPLETED';
    case 'UNDER_REVIEW':
      return 'UNDER_REVIEW';
    case 'CONFIRMED':
      // Use contract presence to distinguish "Worker selected" from
      // "Contract in progress" from "Arrival in progress".
      if (!input.hasContract) return 'WORKER_SELECTED';
      if (input.contractStatus !== 'ACTIVE') return 'CONTRACT_IN_PROGRESS';
      return 'CONTRACT_IN_PROGRESS';
    case 'IN_PROGRESS':
      return 'ARRIVAL_IN_PROGRESS';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'CANCELLED':
    case 'REFUNDED':
      return 'CANCELLED';
  }
}
