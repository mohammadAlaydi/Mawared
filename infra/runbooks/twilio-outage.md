# Twilio outage runbook

## Symptoms

- `POST /v1/auth/otp/request` returns 503 (`SERVICE_UNAVAILABLE`).
- Sentry: spike in `TwilioSmsProvider` errors (HTTP 5xx from `api.twilio.com`).
- Twilio Console → Debugger shows queued / failing messages.
- Customer-facing: cannot sign in (no OTP arrives).

## Diagnose

1. **<https://status.twilio.com>** — Twilio or us?
2. Tail logs:
   ```bash
   railway logs --service api | grep -E 'TwilioSmsProvider|otp.send'
   ```
3. Check the sender number's regulatory state in Twilio Console (KSA short codes need active registration).
4. `curl -u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID.json` — should be 200.

## Mitigate

### Twilio is degraded

- Customers without an active access token can't sign in. There is no graceful workaround for the first sign-in; we eat the unavailability.
- Customers with a valid refresh token can keep using the app — they don't touch Twilio.
- Flip the `auth_otp_disabled_banner` feature flag to show "we're having SMS trouble, try again in a few minutes" in the app.

### Our creds / sender are bad

1. Update `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` in Railway.
2. Redeploy api + worker.
3. Smoke test: request an OTP for an internal phone, confirm receipt.

### Regulatory block (KSA / GCC)

- Twilio sender IDs in Saudi require pre-approval; a deny may take days.
- Backup: temporarily route OTP through Resend email-as-OTP if we have email on file (not implemented yet — escalate to PM).

## Prevention

- Keep `OtpAttempt` rate-limit windows tight (1/min/phone, 5/hour/phone).
- Watch the OTP success rate (Pino → Sentry tag `otp.outcome`). Sentry alert rule: success rate < 90 % for 5 minutes → page on-call.
