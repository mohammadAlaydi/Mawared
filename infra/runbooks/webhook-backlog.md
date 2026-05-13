# Webhook backlog runbook

## Symptoms

- BullMQ `stripe-event` queue depth growing in `/admin/_bull` (M4+).
- `StripeEvent` rows with `processedAt IS NULL` and `processingErrors > 0`.
- Order statuses lagging Stripe (e.g. PaymentIntent succeeded in Stripe but order still `PAYMENT_PENDING`).
- Sentry: `webhook processing failed` errors from `PaymentsService.processStripeEvent`.

## Diagnose

1. Queue health:
   ```bash
   redis-cli -u "$REDIS_URL" XLEN bull:stripe-event:wait
   redis-cli -u "$REDIS_URL" XLEN bull:stripe-event:failed
   ```
2. Unprocessed events in DB:
   ```sql
   SELECT type, COUNT(*), MAX("receivedAt") AS newest
   FROM "StripeEvent"
   WHERE "processedAt" IS NULL
   GROUP BY type
   ORDER BY 2 DESC;
   ```
3. Are the failures consistent (a code bug) or transient (a downstream)?

## Mitigate

### Code bug in event handler

1. Find the failing event:
   ```sql
   SELECT "stripeEventId", "type", "lastError", "processingErrors"
   FROM "StripeEvent"
   WHERE "processedAt" IS NULL AND "processingErrors" > 0
   ORDER BY "processingErrors" DESC LIMIT 5;
   ```
2. Reproduce locally with the persisted payload (`SELECT payload FROM ...`).
3. Ship a fix. The next BullMQ retry picks the event back up (events stay in the queue until `processedAt` is set).

### Storm / replay flood

- `StripeEventConsumer` has `concurrency: 4` — DB writes are bounded.
- If Stripe is replaying a huge backlog, the queue catches up naturally (5–10 min).
- DO NOT clear the queue. Each event is the only durable signal of a payment side-effect.

### Catastrophic Redis loss

- StripeEvent rows persist in Postgres regardless of Redis state.
- Re-enqueue all unprocessed events:
  ```bash
  pnpm --filter @mawared/backend ts-node scripts/reprocess-stripe-events.ts
  ```
  (Script to be added in M4 — until then, run a one-liner via the worker REPL.)

## Prevention

- Sentry alert: `webhook processing failed` count > 10 in 10 minutes.
- Daily reconciliation job (M4): `SUM(Order.totalMinor WHERE status='PAID') ≈ SUM(Stripe charges)` — drift > $0 pages on-call.
