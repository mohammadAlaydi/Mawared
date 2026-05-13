/**
 * Stable queue identifiers. Defined in one place so producers and
 * consumers never drift.
 */
export const QUEUES = {
  RESERVATION_EXPIRY: 'reservation-expiry',
  STRIPE_EVENT: 'stripe-event',
  NOTIFICATIONS: 'notifications',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
