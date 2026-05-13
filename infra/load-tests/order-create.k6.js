/* eslint-disable */
/**
 * k6 — order-create happy-path load test.
 *
 *   k6 run --vus 10 --duration 1m infra/load-tests/order-create.k6.js
 *
 * Target (per docs/backend/04-ROADMAP.md M4):
 *   - 5 RPS sustained on POST /v1/orders happy path
 *   - p95 < 800ms
 *
 * NOTE: each iteration reserves a worker for 15 min. To run this against
 * a real env you need either (a) a pool of free workers larger than the
 * VU count, or (b) a teardown step that cancels orders between iterations.
 * For the staging baseline we seed 100 workers, set a 5min limit, and
 * accept reservation churn.
 *
 * Required env:
 *   BASE_URL          (default http://localhost:3000)
 *   ACCESS_TOKEN      customer JWT
 *   ORDER_PACKAGE_ID  uuid of an active ServicePackage
 *   ORDER_ADDRESS_ID  uuid of an address owned by the token's customer
 *   WORKER_IDS        comma-separated worker uuids to rotate through
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
const token = __ENV.ACCESS_TOKEN || '';
const packageId = __ENV.ORDER_PACKAGE_ID;
const addressId = __ENV.ORDER_ADDRESS_ID;
const workerIds = (__ENV.WORKER_IDS || '').split(',').filter(Boolean);

if (!token || !packageId || !addressId || workerIds.length === 0) {
  throw new Error(
    'set BASE_URL, ACCESS_TOKEN, ORDER_PACKAGE_ID, ORDER_ADDRESS_ID, WORKER_IDS',
  );
}

export const options = {
  scenarios: {
    happy_path_5rps: {
      executor: 'constant-arrival-rate',
      rate: 5,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 10,
      maxVUs: 30,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'], // some 409s expected — worker contention
    http_req_duration: ['p(95)<800'],
  },
};

const orderLatency = new Trend('order_create_latency');
const errorRate = new Rate('errors');

export default function () {
  const workerId = workerIds[Math.floor(Math.random() * workerIds.length)];
  const res = http.post(
    `${baseUrl}/v1/orders`,
    JSON.stringify({ workerId, packageId, addressId }),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': uuidv4(),
      },
      tags: { endpoint: 'orders.create' },
    },
  );
  orderLatency.add(res.timings.duration);
  // 201 = success, 409 = worker already reserved (expected under contention).
  const ok = check(res, {
    'status is 201 or 409': (r) => r.status === 201 || r.status === 409,
  });
  errorRate.add(!ok);
  sleep(0.2);
}
