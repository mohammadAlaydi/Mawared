/**
 * Mirror of the Prisma OrderStatus enum. Hand-maintained so the shared package
 * does not depend on Prisma. Must stay in sync with apps/backend/prisma/schema.prisma.
 *
 * See docs/backend/06-STATE_MACHINE.md for the legal transition matrix.
 */
export const ORDER_STATUSES = [
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
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const TERMINAL_ORDER_STATUSES: ReadonlySet<OrderStatus> = new Set([
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
]);

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return TERMINAL_ORDER_STATUSES.has(status);
}
