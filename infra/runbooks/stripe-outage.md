# Stripe outage runbook

## Symptoms

- `POST /v1/payments/intents` returns 5xx or hangs > 5 s.
- Sentry: spike in `stripe.api` errors (`createIntent` / `refund`).
- Webhook deliveries paused (Stripe Dashboard → Developers → Webhooks).
- Customer-facing: "Unable to process payment, please try again" on checkout.

## Diagnose (≤ 2 minutes)

1. Check **<https://status.stripe.com>** — is it Stripe or us?
2. Tail the API logs for `stripe` errors:
   ```bash
   railway logs --service api | grep -E 'stripe|StripePaymentProvider'
   ```
3. Check our outbound TLS: `curl -I https://api.stripe.com/v1` from the API container.
4. Confirm `STRIPE_SECRET_KEY` rotation isn't the cause — see Stripe Dashboard for key activity.

## Mitigate

### If Stripe is degraded

- Do nothing on the backend. PaymentIntent creation is wrapped in BullMQ-backed retries on the consumer side (`stripe-event` queue, exponential backoff, 5 attempts).
- For inbound webhooks: we ACK fast and enqueue. Once Stripe recovers, replays flow through `StripeEventConsumer` and dedupe on `stripeEventId`.
- Surface a banner in the admin dashboard (manual; toggle the `payments_degraded` feature flag via `POST /v1/admin/flags`).
- **Do not** flush the BullMQ `stripe-event` queue — those are unprocessed webhook ACKs, losing them means losing money state.

### If our key is bad / rotated

1. Confirm with Stripe dashboard.
2. Update `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` in Railway.
3. Redeploy the api + worker services.
4. Re-process any unprocessed `StripeEvent` rows:
   ```sql
   SELECT "stripeEventId", "type", "processingErrors", "lastError"
   FROM "StripeEvent"
   WHERE "processedAt" IS NULL
   ORDER BY "receivedAt" ASC;
   ```
   Re-enqueue them via the worker REPL (`payments.processStripeEvent(...)`).

## Postmortem checklist

- [ ] How long was the outage?
- [ ] How many orders were stuck in `PAYMENT_PENDING` past the 15-min reservation? They auto-expire; confirm zero stale reservations.
- [ ] Drift check (next morning): `SUM(Order.totalMinor WHERE status='PAID') ≈ SUM(Stripe charges)`. If > $0 drift, file a ticket.
- [ ] Did any orders advance illegally? Audit `OrderStatusHistory` for invalid transitions during the window.
