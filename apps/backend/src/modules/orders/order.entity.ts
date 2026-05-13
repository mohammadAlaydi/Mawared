import {
  ORDER_STATUSES,
  TERMINAL_ORDER_STATUSES,
  type OrderStatus,
} from '@mawared/shared-types';

/**
 * Pure-domain Order state machine.
 *
 * Source of truth: docs/backend/06-STATE_MACHINE.md
 *
 * The matrix below MUST match the docs row-for-row. If you change one,
 * change the other in the same PR.
 *
 * `nextStatus()` is a pure function: no side effects, no I/O. Side effects
 * (writing the new row, releasing reservations, enqueuing notifications,
 * etc.) belong in OrdersService — see ADR-001.
 */

export type OrderCancelActor = 'customer' | 'staff' | 'system';

export type OrderCancelReason =
  | 'CUSTOMER_REQUEST'
  | 'PAYMENT_TIMEOUT'
  | 'STAFF_DECISION'
  | 'WORKER_UNAVAILABLE'
  | 'SYSTEM_TIMEOUT';

export type OrderEvent =
  | { type: 'submit' }
  | { type: 'paymentIntentCreated'; paymentIntentId: string }
  | { type: 'paymentSucceeded' }
  | { type: 'paymentFailed'; errorCode: string }
  | { type: 'retryPayment' }
  | { type: 'submitForReview' }
  | { type: 'confirm'; staffId: string }
  | { type: 'startService'; staffId: string }
  | { type: 'complete'; staffId: string }
  | { type: 'cancel'; actor: OrderCancelActor; reason?: OrderCancelReason }
  | { type: 'expire' };

export type OrderEventType = OrderEvent['type'];

export class InvalidTransitionError extends Error {
  readonly code = 'ORDER_INVALID_TRANSITION';

  constructor(
    public readonly from: OrderStatus,
    public readonly event: OrderEventType,
  ) {
    super(`Illegal order transition: ${from} -[${event}]-> ?`);
    this.name = 'InvalidTransitionError';
  }
}

/**
 * The transition matrix. Keys are `${fromStatus}:${eventType}`.
 *
 * IMPORTANT: any change here must keep docs/backend/06-STATE_MACHINE.md in
 * sync. See the row numbers below for the cross-reference.
 */
const TRANSITIONS: Readonly<Record<string, OrderStatus>> = Object.freeze({
  // Row 1
  'DRAFT:submit': 'RESERVED',
  // Row 2
  'RESERVED:paymentIntentCreated': 'PAYMENT_PENDING',
  // Row 3
  'PAYMENT_PENDING:paymentSucceeded': 'PAID',
  // Row 4
  'PAYMENT_PENDING:paymentFailed': 'PAYMENT_FAILED',
  // Row 5
  'PAYMENT_FAILED:retryPayment': 'PAYMENT_PENDING',
  // Row 6
  'PAID:submitForReview': 'UNDER_REVIEW',
  // Row 7
  'UNDER_REVIEW:confirm': 'CONFIRMED',
  // Row 8
  'CONFIRMED:startService': 'IN_PROGRESS',
  // Row 9
  'IN_PROGRESS:complete': 'COMPLETED',
  // Rows 10–14 (cancel before money changes hands)
  'DRAFT:cancel': 'CANCELLED',
  'RESERVED:cancel': 'CANCELLED',
  'RESERVED:expire': 'CANCELLED',
  'PAYMENT_PENDING:cancel': 'CANCELLED',
  'PAYMENT_FAILED:cancel': 'CANCELLED',
  // Rows 15–18 (cancel after money → refund)
  'PAID:cancel': 'REFUNDED',
  'UNDER_REVIEW:cancel': 'REFUNDED',
  'CONFIRMED:cancel': 'REFUNDED',
  'IN_PROGRESS:cancel': 'REFUNDED',
});

/**
 * Returns the next legal status, or throws InvalidTransitionError.
 * Pure: no logging, no DB, no clock.
 */
export function nextStatus(current: OrderStatus, event: OrderEvent): OrderStatus {
  if (TERMINAL_ORDER_STATUSES.has(current)) {
    throw new InvalidTransitionError(current, event.type);
  }
  const key = `${current}:${event.type}`;
  const next = TRANSITIONS[key];
  if (!next) throw new InvalidTransitionError(current, event.type);
  return next;
}

/** Exposed for tests; do not import from production code. */
export const ALL_ORDER_STATUSES: readonly OrderStatus[] = ORDER_STATUSES;
export const ALL_TRANSITION_KEYS: readonly string[] = Object.freeze(Object.keys(TRANSITIONS));
