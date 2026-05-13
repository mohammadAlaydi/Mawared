# Sentry alert rules

> Configure these in Sentry → Alerts → Create alert rule. They mirror the
> "what wakes me up at 3 AM" list from `docs/backend/04-ROADMAP.md` §M4.

All rules send to the `#mawared-prod-alerts` Slack channel + page the
on-call engineer via PagerDuty (or email for non-critical).

## Critical (page on-call)

| Rule | Trigger | Threshold | Notes |
|---|---|---|---|
| 5xx spike | `event.level:error AND event.transaction starts_with /v1/` | > 20 events / 5 min | Excludes /healthz |
| Webhook lag | Custom metric `stripe.event.queue_age` p95 | > 30 s for 5 min | From BullMQ depth metric |
| Reconciliation drift | Custom metric `payments.reconciliation_drift_minor` | > 0 once daily | Nightly cron compares `SUM(Order.totalMinor PAID) vs Stripe charges` |
| OTP success rate | Custom metric `otp.success_rate` | < 90 % for 5 min | From `OtpAttempt.outcome` |
| `/readyz` failing | HTTP status check | 3 consecutive 503s | Driven by UptimeRobot |
| DB connection errors | `PrismaClientInitializationError` count | > 5 / minute | |
| Refund webhook failure | `webhook processing failed AND type:charge.refunded` | any | Refunds MUST process — manual intervention required |

## Warning (Slack only)

| Rule | Trigger | Threshold |
|---|---|---|
| 4xx rate | `event.level:warning AND status:>=400 AND status:<500` | > 5 % of requests for 10 min |
| BullMQ retries | Custom metric `bullmq.attempt_count_p99` | > 3 |
| FCM invalid-token rate | `FcmPushChannel` 400/404 responses | > 10 % of sends |
| Slow query | DB query p95 | > 500 ms for 5 min |
| Disk usage | RDS / Railway disk metric | > 75 % |

## Custom metrics — how they get emitted

We tag Pino log lines with structured fields; `nestjs-pino` + a small
`pino-sentry-transport` (added in M4) forwards them to Sentry's metrics
API. Examples:

```ts
// OTP outcome — already emitted via prisma.otpAttempt rows.
// Add a periodic exporter (M4 cron):
const recentSuccess = await prisma.otpAttempt.count({
  where: { outcome: 'VERIFIED', createdAt: { gt: fiveMinutesAgo } },
});
const recentTotal = await prisma.otpAttempt.count({
  where: { outcome: { in: ['VERIFIED', 'INVALID', 'EXPIRED'] }, createdAt: { gt: fiveMinutesAgo } },
});
metrics.distribution('otp.success_rate', recentTotal ? recentSuccess / recentTotal : 1);
```

## Verifying the alerts

After configuring, fire a synthetic event:

```bash
# 5xx spike — hit /v1/admin/orders without auth twenty times
for i in {1..25}; do curl -s http://localhost:3000/v1/admin/orders > /dev/null; done

# Webhook lag — pause the worker process, send a Stripe test event
stripe trigger payment_intent.succeeded
# wait 1 minute, confirm the alert fires
```

If an alert doesn't fire within its window, the rule isn't right — debug
in Sentry's "Test rule" feature before relying on it in prod.
