# FCM outage runbook

## Symptoms

- Customers stop receiving push notifications for order status changes.
- Sentry: spike in `FcmPushChannel` 5xx (`googleapis.com` 503).
- BullMQ `notifications` queue depth growing in Bull dashboard.

## Diagnose

1. **<https://status.firebase.google.com>**
2. `curl -I https://fcm.googleapis.com/v1` from the worker container — TLS reachable?
3. Validate the service account JSON: try minting an access token manually:
   ```bash
   node -e "console.log(JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON).client_email)"
   ```
4. Check the BullMQ `notifications` queue: `GET /admin/_bull` (super-admin only, M4+).

## Mitigate

### FCM degraded

- BullMQ retries failed sends with exponential backoff up to 5 attempts.
- Notifications are persisted to the `Notification` table BEFORE push send, so the in-app notification center remains correct.
- Customers still see status changes when they open the app — push is a "nice to have" delivery method.

### Dead device tokens

- 404 / 400 responses from FCM mark a token as invalid; our channel returns it in `invalidTokens`.
- Cleanup job (not yet wired): `DELETE FROM "DeviceToken" WHERE token IN (...)` — track in M4 follow-up.

### Service account compromise

- Rotate via Firebase Console → Service accounts → "Generate new private key".
- Update `FCM_SERVICE_ACCOUNT_JSON` in Railway.
- The old key is revokable in the console; do this AFTER the new key works.

## Postmortem

- How many push deliveries failed? Bull job count with `failedReason ~ 'fcm'`.
- Did we miss any state-change notifications? Reconcile against `Notification` rows — if a row exists but its delivery failed > 5 times, manually re-enqueue.
