# Order State Machine

> The legal transitions for the `Order` aggregate. This is the source of truth — the entity class `Order.transition(event)` and unit tests must match this matrix exactly.

**Status**: Accepted · **Last reviewed**: 2026-05-13

---

## States (11 total)

```
DRAFT ─► RESERVED ─► PAYMENT_PENDING ─► PAID ─► UNDER_REVIEW ─► CONFIRMED ─► IN_PROGRESS ─► COMPLETED
   │         │              │            │           │              │
   └────►    └──►    PAYMENT_FAILED      │           │              │
                            │            │           │              │
                            └──► CANCELLED ◄─────────┴──────────────┘
                                    │
                                    └──► REFUNDED (if PAID before cancel)
```

### State meanings

| State | Meaning | Worker held? | Money state |
|---|---|---|---|
| `DRAFT` | Order being assembled in app. Not yet placed. | No | None |
| `RESERVED` | Worker held under 15-min advisory lock; customer is paying. | **Yes** | None |
| `PAYMENT_PENDING` | PaymentIntent created; awaiting Stripe confirmation. | Yes | Authorized? |
| `PAYMENT_FAILED` | Last payment attempt failed. Customer may retry within reservation window. | Yes (until expiry) | None |
| `PAID` | Stripe confirmed funds captured. | Yes | Captured |
| `UNDER_REVIEW` | Staff reviewing the order before confirming worker assignment. | Yes | Captured |
| `CONFIRMED` | Staff confirmed. Contract issued. Worker definitively assigned. | **No** (now BOOKED) | Captured |
| `IN_PROGRESS` | Service is being delivered. | Worker = BOOKED | Captured |
| `COMPLETED` | Service delivered. Terminal-happy. | Worker = AVAILABLE again | Captured |
| `CANCELLED` | Cancelled before or after payment. Terminal. | No | If unpaid: nothing. If paid: triggers refund → REFUNDED. |
| `REFUNDED` | Order was paid and has been fully refunded. Terminal. | No | Refunded |

---

## Transition matrix

Each row is a legal transition. Anything not in this table is illegal and `Order.transition()` must throw `InvalidTransitionError`.

| # | From | Event | To | Trigger / Actor | Effects |
|---|------|-------|-----|----------------|---------|
| 1 | `DRAFT` | `submit` | `RESERVED` | Customer (`POST /orders`) | Acquire advisory lock on `workerId`; insert `Reservation(expiresAt = now+15min)`; set `placedAt = now()`; enqueue `expire-reservation` delayed job. |
| 2 | `RESERVED` | `paymentIntentCreated` | `PAYMENT_PENDING` | System (`POST /payments/intents`) | Persist `PaymentIntent` row with status `REQUIRES_PAYMENT_METHOD`. |
| 3 | `PAYMENT_PENDING` | `paymentSucceeded` | `PAID` | Stripe webhook (`payment_intent.succeeded`) | Mark PaymentIntent `SUCCEEDED`; set `Order.paidAt`; enqueue `notify-paid`. |
| 4 | `PAYMENT_PENDING` | `paymentFailed` | `PAYMENT_FAILED` | Stripe webhook (`payment_intent.payment_failed`) | Mark PaymentIntent `FAILED`; record last error; enqueue `notify-payment-failed`. |
| 5 | `PAYMENT_FAILED` | `retryPayment` | `PAYMENT_PENDING` | Customer (`POST /payments/intents` for same order) | Only while reservation is still active. New PaymentIntent. |
| 6 | `PAID` | `submitForReview` | `UNDER_REVIEW` | System (auto, if `feature_flags.auto_review = true` skip and go straight to CONFIRMED) | No state effects beyond status. |
| 7 | `UNDER_REVIEW` | `confirm` | `CONFIRMED` | Staff (`POST /admin/orders/:id/transition`) | Issue Contract; set `Order.confirmedAt`; set `Worker.availability = BOOKED`; release Reservation (`releasedAt = now`); enqueue contract PDF generation; enqueue `notify-confirmed`. |
| 8 | `CONFIRMED` | `startService` | `IN_PROGRESS` | Staff | Set `Order.startedAt`; enqueue `notify-in-progress`. |
| 9 | `IN_PROGRESS` | `complete` | `COMPLETED` | Staff | Set `Order.completedAt`; set `Worker.availability = AVAILABLE`; mark Contract status `ACTIVE`; enqueue `notify-completed`. |
| 10 | `DRAFT` | `cancel` | `CANCELLED` | Customer or system (timeout) | No-op (no reservation, no payment). |
| 11 | `RESERVED` | `cancel` | `CANCELLED` | Customer (`POST /orders/:id/cancel`) or system | Release Reservation. |
| 12 | `RESERVED` | `expire` | `CANCELLED` | System (`expire-reservation` job) | Set `cancelReason = SYSTEM_TIMEOUT`. Release Reservation. |
| 13 | `PAYMENT_PENDING` | `cancel` | `CANCELLED` | Customer | Cancel Stripe PaymentIntent; release Reservation. |
| 14 | `PAYMENT_FAILED` | `cancel` | `CANCELLED` | Customer or system (timeout) | Release Reservation. Set `cancelReason = PAYMENT_TIMEOUT` if system. |
| 15 | `PAID` | `cancel` | `REFUNDED` | Staff (`POST /admin/orders/:id/refund` with full amount) | Issue Stripe full refund; on `charge.refunded` webhook → finalize transition. |
| 16 | `UNDER_REVIEW` | `cancel` | `REFUNDED` | Staff | Same as above. |
| 17 | `CONFIRMED` | `cancel` | `REFUNDED` | Staff | Void Contract; set `Worker.availability = AVAILABLE`; refund. |
| 18 | `IN_PROGRESS` | `cancel` | `REFUNDED` | Staff (rare) | Void Contract; release Worker; partial-refund decision left to staff input. |

### Terminal states

`COMPLETED`, `CANCELLED`, `REFUNDED` are terminal. No further transitions are allowed.

### Special cases

- **`PAYMENT_FAILED` → `RESERVED`** is **not** a legal transition. The customer either retries (→ `PAYMENT_PENDING`) or cancels (→ `CANCELLED`).
- **`CANCELLED` and `REFUNDED`** are distinct: `CANCELLED` means "no money ever moved" (or pre-payment cancellation). `REFUNDED` always implies money moved both ways.
- **Staff-initiated cancellation of an unpaid order** transitions to `CANCELLED` (rows 11, 13, 14) — staff doesn't have to wait for the customer.

---

## Reference implementation (skeleton)

```ts
// apps/backend/src/modules/orders/order.entity.ts

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
  | { type: 'cancel'; actor: 'customer' | 'staff' | 'system'; reason?: OrderCancelReason };

export class InvalidTransitionError extends Error {
  constructor(public from: OrderStatus, public event: OrderEvent['type']) {
    super(`Illegal transition: ${from} -[${event}]-> ?`);
  }
}

// Pure function — no side effects. Effects are applied by the service.
export function nextStatus(current: OrderStatus, event: OrderEvent): OrderStatus {
  const key = `${current}:${event.type}`;
  const next = TRANSITIONS[key];
  if (!next) throw new InvalidTransitionError(current, event.type);
  return next;
}

const TRANSITIONS: Record<string, OrderStatus> = {
  // Row 1
  'DRAFT:submit':                          'RESERVED',
  // Row 2
  'RESERVED:paymentIntentCreated':         'PAYMENT_PENDING',
  // Row 3
  'PAYMENT_PENDING:paymentSucceeded':      'PAID',
  // Row 4
  'PAYMENT_PENDING:paymentFailed':         'PAYMENT_FAILED',
  // Row 5
  'PAYMENT_FAILED:retryPayment':           'PAYMENT_PENDING',
  // Row 6
  'PAID:submitForReview':                  'UNDER_REVIEW',
  // Row 7
  'UNDER_REVIEW:confirm':                  'CONFIRMED',
  // Row 8
  'CONFIRMED:startService':                'IN_PROGRESS',
  // Row 9
  'IN_PROGRESS:complete':                  'COMPLETED',
  // Rows 10-14 (cancel before money)
  'DRAFT:cancel':                          'CANCELLED',
  'RESERVED:cancel':                       'CANCELLED',
  'RESERVED:expire':                       'CANCELLED',
  'PAYMENT_PENDING:cancel':                'CANCELLED',
  'PAYMENT_FAILED:cancel':                 'CANCELLED',
  // Rows 15-18 (cancel after money → refund)
  'PAID:cancel':                           'REFUNDED',
  'UNDER_REVIEW:cancel':                   'REFUNDED',
  'CONFIRMED:cancel':                      'REFUNDED',
  'IN_PROGRESS:cancel':                    'REFUNDED',
};
```

## Test obligations

The implementing AI MUST add these unit tests (Vitest) in `apps/backend/src/modules/orders/order.entity.spec.ts`:

1. Every legal transition in the matrix above returns the correct `to` status.
2. Every transition NOT in the matrix throws `InvalidTransitionError`.
3. Terminal states (`COMPLETED`, `CANCELLED`, `REFUNDED`) throw on any event.
4. Property-based fuzz: random `(state, event)` pairs across the full enum × event-type space should never produce an unexpected legal transition.

Aim for >95% line coverage on `order.entity.ts`. State transitions are the heart of the domain — if there's one file in the codebase that deserves obsessive test discipline, this is it.
