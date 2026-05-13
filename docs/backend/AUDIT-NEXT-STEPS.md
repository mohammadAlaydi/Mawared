# Handoff Plan: Frontend ⇄ Backend Wiring

> **For the next AI session.** Read this entire file before touching code. Then read `docs/backend/AUDIT-FRONTEND-WIRING.md` for the full audit findings.

---

## Status as of handoff (2026-05-14)

**Phase A — Backend foundation: ✅ DONE**

Changes already committed to disk (NOT git-committed yet):

| File | Change |
|---|---|
| `apps/backend/src/modules/catalog/catalog.controller.ts` | Added `@Public()` to `GET /v1/services` and `GET /v1/services/:id/packages` |
| `apps/backend/src/modules/public/public.module.ts` | **NEW** PublicModule |
| `apps/backend/src/modules/public/public-stats.service.ts` | **NEW** Aggregates verified customer count, available worker count, nationality count, avg rating. Redis-cached 5min at `public:stats:v1` |
| `apps/backend/src/modules/public/public-stats.controller.ts` | **NEW** `GET /v1/public/stats` |
| `apps/backend/src/app.module.ts` | Wired `PublicModule` into imports |
| `apps/backend/src/modules/admin/reports/dto/overview-query.dto.ts` | **NEW** Zod schema for optional `branchId` query |
| `apps/backend/src/modules/admin/reports/reports.service.ts` | Added `overview()` and `activeWorkers()` methods |
| `apps/backend/src/modules/admin/reports/reports.controller.ts` | Added `GET /v1/admin/reports/overview` and `GET /v1/admin/reports/active-workers` |
| `apps/backend/src/modules/payments/payments.controller.ts` | Added `@Idempotent()` + `@UseInterceptors(IdempotencyInterceptor)` to `POST /v1/payments/intents` |
| `packages/api-client-ts/src/types.ts` | Added `PublicStats`, `AdminOverviewResponse`, `AdminActiveWorkersResponse`, `AdminPaymentIntent`, `AdminRefund`, `AdminCustomer`, `AdminStaff`, `FeatureFlag` types |
| `packages/api-client-ts/src/client.ts` | Rewrote with: idempotency-key auto-generation, full admin coverage (totp, catalog services+packages, payments+refunds, customer verification, staff, audit, flags), `publicStats.get()`, `admin.reports.overview()`, `admin.reports.activeWorkers()` |
| `packages/api-client-kotlin/src/Apis.kt` | Added `PublicApi`, `AdminReportsApi`; `PaymentsApi.createIntent` now takes `@Header("Idempotency-Key")` |
| `packages/api-client-kotlin/src/Dtos.kt` | Added `PublicStats`, `AdminOverviewResponse`, `AdminActiveWorkersResponse`, supporting types |
| `packages/api-client-kotlin/src/Client.kt` | `MawaredApi` now exposes `marketing: PublicApi` (renamed from `public` because Kotlin keyword) and `adminReports: AdminReportsApi` |

**Important nuance about Phase A:**
- I could not run `pnpm openapi:generate` in the sandbox (pnpm not installed; pnpm symlinks under `node_modules/@mawared/*` are broken). The user must run it locally to regenerate `apps/backend/openapi.json` before the openapi-drift CI check passes.
- The TS API client is **hand-written**, not generated — so my edits to `packages/api-client-ts/src/client.ts` are the source of truth, not openapi.json.
- Typecheck in the sandbox is broken (`Cannot find module '@nestjs/common'`) due to the same symlink problem. Run `pnpm typecheck` locally to verify.

**File-encoding gotcha that ate hours:** This repo uses **CRLF** line endings on Windows. The `Write`/`Edit` tools occasionally truncate CRLF files mid-line. Workaround: write content via bash heredoc, then `sed -i 's/\r$//; s/$/\r/' file` to normalize CRLF. Verify with `tail -3 file | cat -A` — every line should end with `^M$`.

---

## What's still TODO

### Phase B — Admin dashboard rewrite (3–5 days)

**Root cause of dashboard brokenness:** `admin-dashboard/src/lib/dashboard-context.tsx` is a localStorage-backed `DashboardProvider` that seeds every page from `src/data/mockData.ts`. Login works (`src/lib/auth.tsx` calls `api.adminAuth.login()`), but every dashboard page mutates client state only.

**B.1 — Shared infra (do this first)**
Create in `admin-dashboard/src/lib/`:

```ts
// src/lib/problem-details.ts
import type { ApiError } from '@mawared/api-client';
export function parseProblemDetails(err: unknown): { code: string; message: string; fields?: Record<string,string> } { ... }

// src/lib/money.ts
export function formatMoney(minor: string | bigint, currency: string, locale = 'ar-SA'): string {
  const n = typeof minor === 'bigint' ? minor : BigInt(minor);
  // 2-decimal places assumption is fine for SAR; if you go multi-currency, look up minor units per ISO 4217
  const major = Number(n) / 100;
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(major);
}

// src/lib/use-cursor-pagination.ts
// SWR-style hook that wraps any list endpoint returning { items, nextCursor }
// Returns { items, isLoading, error, loadMore, hasMore, refresh }
```

Update `src/lib/api.ts` if needed — confirm it still uses the singleton `MawaredClient`. The client now auto-generates `Idempotency-Key` headers when callers don't pass one, so no extra wrapper needed.

**B.2 — Delete the mocks**
- Delete `admin-dashboard/src/lib/dashboard-context.tsx`
- Delete `admin-dashboard/src/data/mockData.ts`
- Remove `DashboardProvider` from `src/app/dashboard/layout.tsx`

**B.3 — Dashboard homepage** (`src/app/dashboard/page.tsx`)
- Call `api.admin.reports.overview()` on mount (or in a server component)
- Render KPI cards from `revenue.yesterday[0].minor`, `newCustomers30d`, `workersByAvailability.find(a => a.availability === 'AVAILABLE')?.count`
- Render the revenue chart from `revenue.last30Days` (group by day, use recharts)
- Render recent orders table from `recentOrders`
- All money uses `formatMoney()`

**B.4 — Orders** (`src/app/dashboard/orders/page.tsx`)
- Replace `useDashboard().orders` with `useCursorPagination(cursor => api.admin.orders.list({ cursor, limit: 20, status: filter }))`
- Replace status-update button with `api.admin.orders.transition(id, { event: 'CONFIRM' })` — client auto-adds Idempotency-Key
- Add a "refund" button → modal with amount input → `api.admin.orders.refund(id, { amountMinor, reason })`

**B.5 — Workers** (`src/app/dashboard/workers/page.tsx` + `[id]/page.tsx`)
- List: `api.admin.workers.list({ cursor, limit: 20 })`
- Detail: `api.admin.workers.findById(id)`
- Create/update: `api.admin.workers.create({ ... })` / `update(id, { ... })`
- Photo upload: 3-step — `api.admin.files.uploadUrl({ scope: 'WORKER_PHOTO', mimeType, sizeBytes })` → PUT the file to the returned URL → `api.admin.files.finalize(fileId)` → `api.admin.workers.bindPhoto(workerId, fileId)`
- Document upload: same flow but call `api.admin.workers.addDocument(id, { fileId, kind, expiresAt })`

**B.6 — Remaining pages**
- `/dashboard/customers` → `api.admin.customers.list({ q, cursor })`
- `/dashboard/packages` → `api.admin.catalog.packages.{list,create,update,deactivate}`
- `/dashboard/services` → `api.admin.catalog.services.{list,create,update,deactivate}`
- `/dashboard/payments` → `api.admin.payments.list({ cursor, status, from, to })`
- `/dashboard/reports` → `api.admin.reports.{revenue,ordersByStatus,refunds,activeWorkers}` driven by a date-range picker
- `/dashboard/settings` → `api.admin.flags.{list,set}` for feature flags; `api.admin.staff.{list,create,update,deactivate}` for staff; TOTP: `api.adminAuth.totp.{enroll,verify,disable}`

All forms must use Zod (admin-dashboard already has `zod` installed via `@mawared/api-client`). Mirror the backend DTOs in `apps/backend/src/modules/<feature>/dto/`.

### Phase C — website-next (1 day)

Add `@mawared/api-client` dependency. Initialize the client without auth (it'll just hit public endpoints):

```ts
// website-next/lib/api.ts
import { MawaredClient } from '@mawared/api-client';
export const api = new MawaredClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL!,
});
```

Wire:
- `components/sections/ServicesSection.tsx` → server-fetch `api.catalog.services()` and render cards from `items[]`
- `components/sections/PricingSection.tsx` → server-fetch `api.catalog.packages(serviceId)` for each service
- `components/sections/StatsSection.tsx` + Hero badges → server-fetch `api.publicStats.get()`
- Move hardcoded URLs to env vars:
  - `NEXT_PUBLIC_WHATSAPP_NUMBER` → used by `WhatsAppButton.tsx`, `Footer.tsx`, `ContactSection.tsx`
  - `NEXT_PUBLIC_GOOGLE_PLAY_URL`, `NEXT_PUBLIC_APP_STORE_URL` → `DownloadCTASection.tsx`
  - `NEXT_PUBLIC_TWITTER_URL`, `NEXT_PUBLIC_INSTAGRAM_URL` → `Footer.tsx`
- ContactSection is already wired to `/v1/leads` — verify it still works after dependency upgrade

Update `website-next/.env.example` with the new vars.

### Phase D — Android (4–7 days)

**Critical: the Retrofit client at `packages/api-client-kotlin/` is complete but NOT consumed by the app.** The app's `data/mock/*.kt` files drive every screen.

**D.1 — Build setup** (`android/app/build.gradle.kts`)
Add deps:
```kotlin
implementation("com.squareup.retrofit2:retrofit:2.11.0")
implementation("com.squareup.retrofit2:converter-moshi:2.11.0")
implementation("com.squareup.moshi:moshi-kotlin:1.15.1")
implementation("com.squareup.okhttp3:okhttp:4.12.0")
implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
implementation(platform("com.google.firebase:firebase-bom:33.5.1"))
implementation("com.google.firebase:firebase-messaging-ktx")
implementation("androidx.security:security-crypto:1.1.0-alpha06") // EncryptedSharedPreferences
implementation("com.stripe:stripe-android:21.5.0")
implementation(project(":api-client-kotlin")) // OR copy files into app/data/remote/
```

Add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<service android:name=".services.MawaredMessagingService" android:exported="false">
  <intent-filter><action android:name="com.google.firebase.MESSAGING_EVENT" /></intent-filter>
</service>
```

Add `google-services.json` (user supplies); apply `com.google.gms.google-services` plugin.

**D.2 — Wire API + token storage** (`MawaredApp.onCreate()`)
```kotlin
val storage = AndroidTokenStorage(this) // already exists
val api = MawaredApiClientFactory.create(
    baseUrl = BuildConfig.API_BASE_URL,
    tokenStorage = storage,
    debugLogging = BuildConfig.DEBUG,
)
// Expose via service locator or Hilt
```

Add `IdempotencyInterceptor` (NEW file in `data/remote/`):
```kotlin
class IdempotencyInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val req = chain.request()
        if (req.method in listOf("POST","PATCH") && req.header("Idempotency-Key") == null) {
            return chain.proceed(req.newBuilder().header("Idempotency-Key", java.util.UUID.randomUUID().toString()).build())
        }
        return chain.proceed(req)
    }
}
```
Add it to the OkHttp client in `MawaredApiClientFactory.create()` — edit `packages/api-client-kotlin/src/Client.kt`.

**D.3 — Replace mocks ViewModel by ViewModel**

Order of attack (each VM is small, ~30 min each):
1. `AuthViewModel` — replace `delay()` with `api.auth.requestOtp(phone)` / `verifyOtp(phone, code, deviceId, deviceName)`. Save tokens via `storage.save()`. On success, also register FCM token: `FirebaseMessaging.getInstance().token.await()` → `api.notifications.registerDevice(...)`.
2. `HomeViewModel` — `api.workers.search()` + `api.catalog.services()`.
3. `WorkersViewModel`, `NationalityWorkersViewModel`, `WorkerDetailViewModel` — `api.workers.search()`, `api.workers.findById()`. Favorites via `api.me.favorites.{list,add,remove}`.
4. `PackagesViewModel` — `api.catalog.services()` + `api.catalog.packages(serviceId)`.
5. `BranchesViewModel` — `api.branches.list()`.
6. `OffersViewModel` — `api.offers.list()`.
7. `OrderViewModel` — `placeOrder()` → `api.orders.create(body)` (idempotency key added by interceptor). `loadOrders()` → `api.orders.list()`. `getOrderById()` → `api.orders.findById(id)`.
8. **Payment** (`OrderStep4Screen`) — `api.payments.createIntent(orderId, idempotencyKey = UUID.randomUUID().toString())` → use the returned `clientSecret` with Stripe PaymentSheet.
9. `NotificationsViewModel` — `api.notifications.list()` + `markRead(id)`.
10. `ProfileViewModel` — `api.me.get()` + `update(...)`.
11. `SavedAddressesViewModel` — `api.me.addresses.{list,create,update,delete}`.
12. `ContractsViewModel` — for now `api.orders.contract(orderId)` per order. If a "list all contracts" view is required, request a new backend endpoint.

**D.4 — FCM service** (NEW file `services/MawaredMessagingService.kt`)
```kotlin
class MawaredMessagingService : FirebaseMessagingService() {
  override fun onNewToken(token: String) {
    // POST /v1/devices
    // Use service locator to get api + tokenStorage
  }
  override fun onMessageReceived(msg: RemoteMessage) {
    // Show local notification; handle msg.data for deep-links to orders
  }
}
```
Call `api.notifications.unregisterDevice(token)` on logout.

**D.5 — Money mappers**
Domain models (`Order.kt`, `Worker.kt`, `Package.kt`) currently use `Int`. Either:
- Convert them to `Long` + add `currency: String`, OR
- Keep them as `Int` (SAR halalas fit in Int up to 21M SAR per order — fine for now) but parse via `dto.priceMinor.toInt()` and never do float math.

Display: continue using `"%,d".format(price)` — safe for integers.

**D.6 — Order state machine UI**
`OrderDetailScreen` already uses `OrderStatusChip(status = order.status)`. Once wired to real API, also implement polling — every 30s on resume, call `api.orders.findById(id)` and update state. Or implement a long-poll/WebSocket later.

---

## Backend gaps still open (do these if/when the frontend hits them)

Not done in Phase A; document for the next session:

1. **Contract signing endpoint** — `api.orders.contract(id)` only returns metadata. If the customer needs to sign, add `POST /v1/orders/:id/contract/sign` that kicks off Signit.sa flow.
2. **FAQ / CMS** — Marketing site has 6 hardcoded FAQs. If we want admin-editable FAQs, add `GET /v1/faqs` + admin CRUD. Otherwise leave as static.
3. **Stripe event viewer** — Admin can list payments but can't see individual webhook events. Add `GET /v1/admin/payments/:id/events` if needed.
4. **Worker availability action** — There's no explicit "mark available/reserved" endpoint; it's currently done via worker PATCH. If the admin dashboard needs a one-click toggle, add `POST /v1/admin/workers/:id/availability`.
5. **Direct payment refund** — `api.admin.orders.refund(orderId)` exists but no `api.admin.payments.refund(paymentIntentId)`. Probably fine.

---

## Verification checklist before merging

Run locally (sandbox can't):

```bash
pnpm install
pnpm infra:up                     # Postgres + Redis + Mailhog
pnpm backend:migrate               # apply any pending migrations
pnpm backend:dev                   # API on :3000
# In another shell
pnpm --filter @mawared/backend openapi:generate  # commit the updated openapi.json
pnpm typecheck                     # MUST pass across all packages
pnpm lint                          # MUST pass
pnpm test:unit                     # MUST pass
pnpm test:integration              # if you touched reports.service.ts or public-stats.service.ts
```

Manual smokes:
- `curl http://localhost:3000/v1/services` → should return 200 (was 401 before; Phase A.1)
- `curl http://localhost:3000/v1/public/stats` → 200 with all 5 fields
- `curl http://localhost:3000/v1/admin/reports/overview -H "Authorization: Bearer $ADMIN_JWT"` → 200
- `curl http://localhost:3000/v1/admin/reports/active-workers -H "Authorization: Bearer $ADMIN_JWT"` → 200
- Replay a `POST /v1/payments/intents` with the same `Idempotency-Key` → second response should be byte-identical to the first

---

## How to start a session

```
"Continue the Mawared frontend wiring. Read docs/backend/AUDIT-NEXT-STEPS.md first, then docs/backend/AUDIT-FRONTEND-WIRING.md. Phase A is done; start at Phase B.1 (admin-dashboard shared helpers). Commit logically per phase."
```

If you hit any file that ends mid-line after editing, you've been bitten by the CRLF tool bug — rewrite with bash heredoc and `sed`.
