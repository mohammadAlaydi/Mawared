/* eslint-disable */
/**
 * k6 — workers search smoke + load test.
 *
 *   k6 run --vus 50 --duration 2m infra/load-tests/workers-search.k6.js
 *
 * Target (per docs/backend/04-ROADMAP.md M4):
 *   - 50 RPS sustained on /v1/workers
 *   - p95 < 400ms
 *   - error rate < 1%
 *
 * Requires:
 *   - BASE_URL env (default http://localhost:3000)
 *   - ACCESS_TOKEN env — short-lived customer JWT. Obtain via:
 *       curl -X POST $BASE_URL/v1/auth/otp/verify ...
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
const token = __ENV.ACCESS_TOKEN || '';

export const options = {
  scenarios: {
    steady_50rps: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 50,
      maxVUs: 200,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<400', 'p(99)<800'],
  },
};

const errorRate = new Rate('errors');
const searchLatency = new Trend('search_latency');

const filters = [
  '',
  '?profession=DOMESTIC_WORKER',
  '?nationalityCode=PH',
  '?profession=CAREGIVER_ELDERLY&sort=rating_desc',
  '?minSalaryMinor=100000&maxSalaryMinor=200000',
];

export default function () {
  const q = filters[Math.floor(Math.random() * filters.length)];
  const res = http.get(`${baseUrl}/v1/workers${q}`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { endpoint: 'workers.search' },
  });
  searchLatency.add(res.timings.duration);
  const ok = check(res, {
    'status is 200': (r) => r.status === 200,
    'has items array': (r) => Array.isArray(r.json('items')),
  });
  errorRate.add(!ok);
  sleep(0.1);
}
