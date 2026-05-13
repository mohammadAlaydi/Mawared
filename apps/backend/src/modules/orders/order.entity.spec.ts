import { describe, expect, it } from 'vitest';
import { TERMINAL_ORDER_STATUSES, type OrderStatus } from '@mawared/shared-types';
import {
  ALL_ORDER_STATUSES,
  ALL_TRANSITION_KEYS,
  InvalidTransitionError,
  nextStatus,
  type OrderEvent,
  type OrderEventType,
} from './order.entity';

/**
 * The transition matrix from docs/backend/06-STATE_MACHINE.md.
 *
 * If you add or remove a row, mirror the change here AND in order.entity.ts.
 * The fuzz test below verifies the two stay in sync.
 */
const LEGAL_TRANSITIONS: ReadonlyArray<{
  from: OrderStatus;
  event: OrderEvent;
  to: OrderStatus;
}> = [
  { from: 'DRAFT', event: { type: 'submit' }, to: 'RESERVED' },
  {
    from: 'RESERVED',
    event: { type: 'paymentIntentCreated', paymentIntentId: 'pi_1' },
    to: 'PAYMENT_PENDING',
  },
  { from: 'PAYMENT_PENDING', event: { type: 'paymentSucceeded' }, to: 'PAID' },
  {
    from: 'PAYMENT_PENDING',
    event: { type: 'paymentFailed', errorCode: 'card_declined' },
    to: 'PAYMENT_FAILED',
  },
  { from: 'PAYMENT_FAILED', event: { type: 'retryPayment' }, to: 'PAYMENT_PENDING' },
  { from: 'PAID', event: { type: 'submitForReview' }, to: 'UNDER_REVIEW' },
  { from: 'UNDER_REVIEW', event: { type: 'confirm', staffId: 'u1' }, to: 'CONFIRMED' },
  { from: 'CONFIRMED', event: { type: 'startService', staffId: 'u1' }, to: 'IN_PROGRESS' },
  { from: 'IN_PROGRESS', event: { type: 'complete', staffId: 'u1' }, to: 'COMPLETED' },
  { from: 'DRAFT', event: { type: 'cancel', actor: 'customer' }, to: 'CANCELLED' },
  { from: 'RESERVED', event: { type: 'cancel', actor: 'customer' }, to: 'CANCELLED' },
  { from: 'RESERVED', event: { type: 'expire' }, to: 'CANCELLED' },
  { from: 'PAYMENT_PENDING', event: { type: 'cancel', actor: 'customer' }, to: 'CANCELLED' },
  { from: 'PAYMENT_FAILED', event: { type: 'cancel', actor: 'customer' }, to: 'CANCELLED' },
  { from: 'PAID', event: { type: 'cancel', actor: 'staff' }, to: 'REFUNDED' },
  { from: 'UNDER_REVIEW', event: { type: 'cancel', actor: 'staff' }, to: 'REFUNDED' },
  { from: 'CONFIRMED', event: { type: 'cancel', actor: 'staff' }, to: 'REFUNDED' },
  { from: 'IN_PROGRESS', event: { type: 'cancel', actor: 'staff' }, to: 'REFUNDED' },
];

const ALL_EVENT_TYPES: readonly OrderEventType[] = [
  'submit',
  'paymentIntentCreated',
  'paymentSucceeded',
  'paymentFailed',
  'retryPayment',
  'submitForReview',
  'confirm',
  'startService',
  'complete',
  'cancel',
  'expire',
];

function buildEvent(type: OrderEventType): OrderEvent {
  switch (type) {
    case 'submit':
      return { type };
    case 'paymentIntentCreated':
      return { type, paymentIntentId: 'pi_fuzz' };
    case 'paymentSucceeded':
      return { type };
    case 'paymentFailed':
      return { type, errorCode: 'card_declined' };
    case 'retryPayment':
      return { type };
    case 'submitForReview':
      return { type };
    case 'confirm':
      return { type, staffId: 's' };
    case 'startService':
      return { type, staffId: 's' };
    case 'complete':
      return { type, staffId: 's' };
    case 'cancel':
      return { type, actor: 'system' };
    case 'expire':
      return { type };
  }
}

describe('Order state machine — legal transitions (matrix coverage)', () => {
  for (const { from, event, to } of LEGAL_TRANSITIONS) {
    it(`${from} -[${event.type}]-> ${to}`, () => {
      expect(nextStatus(from, event)).toBe(to);
    });
  }

  it('exactly matches the production matrix size (no drift between spec and entity)', () => {
    expect(LEGAL_TRANSITIONS).toHaveLength(ALL_TRANSITION_KEYS.length);
  });
});

describe('Order state machine — terminal states reject every event', () => {
  for (const terminal of [...TERMINAL_ORDER_STATUSES]) {
    for (const eventType of ALL_EVENT_TYPES) {
      it(`${terminal} cannot accept ${eventType}`, () => {
        expect(() => nextStatus(terminal, buildEvent(eventType))).toThrow(
          InvalidTransitionError,
        );
      });
    }
  }
});

describe('Order state machine — fuzz: every (state, event) not in the matrix is illegal', () => {
  it('exhaustively verifies all (state × event) pairs', () => {
    const legalKeys = new Set(LEGAL_TRANSITIONS.map((t) => `${t.from}:${t.event.type}`));
    for (const status of ALL_ORDER_STATUSES) {
      for (const eventType of ALL_EVENT_TYPES) {
        const key = `${status}:${eventType}`;
        if (legalKeys.has(key)) {
          expect(() => nextStatus(status, buildEvent(eventType))).not.toThrow();
        } else {
          expect(() => nextStatus(status, buildEvent(eventType))).toThrow(
            InvalidTransitionError,
          );
        }
      }
    }
  });
});

describe('InvalidTransitionError', () => {
  it('carries from / event metadata for logs and audit', () => {
    try {
      nextStatus('COMPLETED', { type: 'cancel', actor: 'staff' });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidTransitionError);
      const e = err as InvalidTransitionError;
      expect(e.from).toBe('COMPLETED');
      expect(e.event).toBe('cancel');
      expect(e.code).toBe('ORDER_INVALID_TRANSITION');
    }
  });
});
