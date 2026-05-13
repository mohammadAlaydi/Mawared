#!/usr/bin/env -S node --import tsx
/* eslint-disable no-console */
/**
 * Signit.sa smoke test.
 *
 * Walks a fake customer through:
 *   1. OTP verify (auto-creates customer)
 *   2. GET /v1/me/verification              → expect NOT_VERIFIED
 *   3. POST /v1/me/verification/start       → returns redirectUrl
 *   4. (manual) complete Signit flow in browser
 *   5. GET /v1/me/verification              → expect VERIFIED
 *   6. POST /v1/orders (without VERIFIED → 403; with VERIFIED → 201)
 *
 * Usage:
 *   API_URL=http://localhost:3000 \
 *   PHONE=+966500000001 \
 *   tsx infra/scripts/signit-smoke.ts
 *
 * If running against the stub provider (no SIGNIT_API_KEY set), step 4
 * is automatic — the stub's redirectUrl is itself the webhook callback.
 */

import { randomUUID } from 'node:crypto';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';
const PHONE = process.env.PHONE ?? '+966500000001';
const DEVICE_ID = process.env.DEVICE_ID ?? '00000000-0000-0000-0000-000000000001';

async function jsonFetch<T>(method: string, path: string, init: {
  headers?: Record<string, string>;
  body?: unknown;
} = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers ?? {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}\n${JSON.stringify(body, null, 2)}`);
  }
  return body as T;
}

async function main() {
  console.log(`[signit-smoke] target: ${API_URL}`);
  console.log(`[signit-smoke] phone:  ${PHONE}\n`);

  // Step 1 — request + verify OTP. In dev/log-SMS mode the code is printed
  // to the API server logs; default to 123456 which the stub accepts.
  console.log('1. Requesting OTP...');
  await jsonFetch('POST', '/v1/auth/otp/request', { body: { phone: PHONE, locale: 'ar' } });
  const code = process.env.OTP_CODE ?? '123456';
  console.log(`   (using code: ${code})`);

  console.log('2. Verifying OTP...');
  const auth = await jsonFetch<{ accessToken: string; user: { id: string } }>(
    'POST',
    '/v1/auth/otp/verify',
    { body: { phone: PHONE, code, deviceId: DEVICE_ID } },
  );
  const accessToken = auth.accessToken;
  const customerId = auth.user.id;
  console.log(`   ✅ customerId=${customerId}\n`);

  const authHeader = { Authorization: `Bearer ${accessToken}` };

  // Step 2 — current state
  console.log('3. Reading current verification state...');
  const initial = await jsonFetch<{ status: string; canOrder: boolean }>(
    'GET',
    '/v1/me/verification',
    { headers: authHeader },
  );
  console.log(`   status=${initial.status}  canOrder=${initial.canOrder}\n`);

  // Step 3 — initiate
  console.log('4. Initiating Signit verification session...');
  const started = await jsonFetch<{ redirectUrl: string; providerSessionId: string; status: string }>(
    'POST',
    '/v1/me/verification/start',
    { headers: authHeader, body: { locale: 'ar' } },
  );
  console.log(`   ✅ sessionId=${started.providerSessionId}`);
  console.log(`   redirectUrl=${started.redirectUrl}\n`);

  // Step 4 — try to place an order while still PENDING (should fail)
  console.log('5. Attempting an order while verification is PENDING — should fail with 403 VERIFICATION_REQUIRED');
  try {
    await jsonFetch('POST', '/v1/orders', {
      headers: { ...authHeader, 'Idempotency-Key': randomUUID() },
      body: {
        workerId: '00000000-0000-0000-0000-000000000101',
        packageId: 'placeholder',
        addressId: 'placeholder',
      },
    });
    console.log('   ⚠️  Unexpectedly succeeded — order gate may not be wired.');
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('VERIFICATION_REQUIRED')) {
      console.log('   ✅ Got 403 VERIFICATION_REQUIRED as expected.');
    } else {
      console.log(`   ℹ️  Got a different error (probably workerId/addressId not seeded):\n   ${msg.split('\n')[0]}`);
    }
  }

  console.log(
    '\n--- complete Signit flow manually now ---\n' +
      `Open ${started.redirectUrl} in a browser. After Signit calls our webhook,\n` +
      `re-run this script with VERIFY_ONLY=1 to confirm the new state.`,
  );

  if (process.env.VERIFY_ONLY === '1') {
    console.log('\n6. Re-reading verification state (post-callback)...');
    const after = await jsonFetch<{ status: string; canOrder: boolean }>(
      'GET',
      '/v1/me/verification',
      { headers: authHeader },
    );
    console.log(`   status=${after.status}  canOrder=${after.canOrder}`);
    if (after.canOrder) {
      console.log('   ✅ Customer can now place orders.');
    } else {
      console.log('   ⚠️  Still cannot order — check IdentityVerification rows + webhook logs.');
    }
  }
}

main().catch((err) => {
  console.error('[signit-smoke] FAILED');
  console.error(err);
  process.exit(1);
});
