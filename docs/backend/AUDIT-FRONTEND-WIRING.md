# Frontend ⇄ Backend Wiring Audit

**Date:** 2026-05-14
**Scope:** admin-dashboard, website-next, android — vs. NestJS backend at `apps/backend/`
**Verdict:** The backend API surface is ~90% complete. The frontends are ~10% wired. Most of the work is on the client side, with a small number of backend changes (public-read endpoints, public stats, FAQ/CMS, active-workers report, payment refund GET).

---

## 1. Headline findings

| App | Wired | Mock / static | Severity |
|---|---|---|---|
| **admin-dashboard** | `/login` only | Every dashboard page (orders, customers, workers, packages, services, payments, reports, settings) | 🔴 **BROKEN** — looks live, persists to localStorage |
| **website-next** | Contact form → `/v1/leads` | Hero, Services, Pricing, Stats, FAQ, Testimonials, About, DownloadCTA, WhatsApp, Footer | 🟠 **STATIC** — needs catalog/stats wiring + env-driven config |
| **android** | Nothing | Every screen (30+ Composables) | 🔴 **BROKEN** — Retrofit client exists in `packages/api-client-kotlin` but never copied into the app; no FCM, no token storage, no idempotency |
| **backend** | 90% endpoints exist | Public catalog, public stats, FAQ, active-workers report, contract signing, refund initiation | 🟡 **GAPS** — handful of new endpoints + auth-gate changes |

---

## 2. Admin Dashboard

### Architecture problem (root cause)

`src/lib/dashboard-context.tsx` seeds every page from `src/data/mockData.ts` and persists to `localStorage`. The generated `@mawared/api-client` singleton is instantiated in `src/lib/api.ts` and only used by `src/lib/auth.tsx` for login. Every CRUD action is a client-side state mutation.

### Per-route state

| Route | Status | Required endpoint(s) | Notes |
|---|---|---|---|
| `/` | ✅ OK | n/a | Pure router |
| `/login` | ✅ OK | `POST /v1/admin/auth/login`, `POST /v1/admin/auth/totp/verify` | Already correctly wired, handles `AUTH_2FA_REQUIRED` |
| `/dashboard` (overview) | 🔴 MOCK | new `GET /v1/admin/reports/overview` (KPIs + chart data) | Reuses revenue/orders reports; might need a single rollup endpoint |
| `/dashboard/customers` | 🔴 MOCK | `GET /v1/admin/customers?cursor=…&q=…` | Local string filter today — replace with backend search |
| `/dashboard/orders` | 🔴 MOCK | `GET /v1/admin/orders?cursor=…&status=…`, `POST /:id/transition`, `POST /:id/refund` | **Offset pagination** today; must convert to cursor |
| `/dashboard/workers` | 🔴 MOCK | `GET /v1/admin/workers?cursor=…`, `POST/PATCH/DELETE`, file upload via `POST /v1/files/upload-url` → `POST /v1/admin/workers/:id/photo` | Photos currently stored as base64 in localStorage |
| `/dashboard/workers/[id]` | 🔴 MOCK | `GET /v1/admin/workers/:id`, PATCH same path, `POST /:id/documents` | Document uploads same problem |
| `/dashboard/packages` | 🔴 MOCK | `GET/POST/PATCH /v1/admin/packages`, deactivate endpoint exists | Float arithmetic on prices |
| `/dashboard/services` | 🔴 MOCK | `GET/POST/PATCH /v1/admin/services` | Same |
| `/dashboard/payments` | 🔴 MOCK | `GET /v1/admin/payments?cursor=…`, `GET /v1/admin/payments/refunds` | No filter UI |
| `/dashboard/reports` | 🔴 MOCK | `GET /v1/admin/reports/revenue`, `/orders`, `/refunds`, new `/active-workers` | All charts hardcoded |
| `/dashboard/settings` | 🟠 PARTIAL | Feature flags via `GET/POST /v1/admin/flags`; staff via `/v1/admin/staff` | Roles table is hardcoded; toggles don't persist |

### Cross-cutting issues
- **Money:** `src/lib/utils.ts` `formatCurrency` takes `number`. Must take `bigint` minor units + currency string.
- **Idempotency:** Zero `Idempotency-Key` headers on any mutation. Need a client wrapper that auto-adds a UUIDv4 for `POST` and `PATCH`.
- **Pagination:** Switch every list to cursor-based (`{ data: T[], nextCursor: string | null }`).
- **Errors:** RFC 7807 parsing only exists in login. Need a shared `parseProblemDetails(err)` helper used everywhere.
- **Validation:** Forms have no Zod schemas. Use the same DTOs that the backend exports via `@mawared/shared-types` where possible.

---

## 3. Website-Next (marketing)

### Status by component

| Component | State | Action |
|---|---|---|
| `ContactSection` | ✅ Wired to `POST /v1/leads` with idempotency + RFC 7807 | Keep as reference implementation |
| `HeroSection` | Static "+500 client", "4.9 rating" badges | Wire to new `GET /v1/public/stats` |
| `ServicesSection` | 4 hardcoded service cards | `GET /v1/services` (make **public**) |
| `PricingSection` | 3 hardcoded tiers | `GET /v1/services/:id/packages` (make **public**) |
| `StatsSection` | 4 hardcoded counters | `GET /v1/public/stats` |
| `FAQSection` | 6 hardcoded Q/A | Either keep static + document, or add `GET /v1/faqs` |
| `TestimonialsSection` | 6 hardcoded testimonials | Same decision as FAQ |
| `HowItWorksSection` | Static, fine as-is | None |
| `AboutSection` | Static branding | None |
| `DownloadCTASection` | App store links are `#` | Move to env vars: `NEXT_PUBLIC_GOOGLE_PLAY_URL`, `NEXT_PUBLIC_APP_STORE_URL` |
| `WhatsAppButton` | Hardcoded number `966112345678` | `NEXT_PUBLIC_WHATSAPP_NUMBER` |
| `Footer` | Social links `#`, hardcoded WhatsApp | Move to env vars; legal pages need to exist or be removed |

### Infrastructure
- No `@mawared/api-client` dependency — `ContactSection` uses raw `fetch`. Add the client (or a thin wrapper) for the new catalog/stats reads.
- `next.config.ts` is empty; no rewrites needed if backend CORS is configured.

---

## 4. Android app

### What's there
30+ Compose screens covering the whole customer journey. Visual UX is in good shape. Auth ViewModel uses `delay()` to fake latency. Everything reads from `data/mock/*.kt` (`MockWorkers`, `MockServices`, `MockOrders`, etc.).

### What's missing
1. **Retrofit client not in the app**. `packages/api-client-kotlin/src/{Apis,Client,Dtos}.kt` is complete but never copied into `android/app/src/main/kotlin/com/mawared/dawliah/data/remote/`. No Retrofit/Moshi/OkHttp deps in `build.gradle.kts`.
2. **No token persistence**. `AndroidTokenStorage` (EncryptedSharedPreferences-backed) is referenced in the package README but never instantiated. Tokens currently die when the app process dies.
3. **No FCM**. No Firebase BOM, no `FirebaseMessagingService`, no `POST /v1/devices` call. `AndroidManifest.xml` is missing `POST_NOTIFICATIONS` permission.
4. **No idempotency interceptor**. The Retrofit DTOs accept the header but nothing generates a UUID per request.
5. **No payment integration**. `OrderStep4Screen` is a stub. Stripe PaymentSheet not wired.
6. **Money types**. Backend DTOs use `priceMinor: String`; Android domain models use `Int`. Loses currency code, won't survive a non-SAR market.
7. **Order state machine** rendering exists (`OrderStatusChip`) but reads from mock. No polling / no realtime.

### Per-screen impact

Every screen except splash/onboarding hits `MockX` — same fix pattern repeated 25+ times: inject `MawaredApi` into the ViewModel, replace the mock collection with the API call, add a loading/error state.

---

## 5. Backend gap analysis

The backend has ~95% of the endpoints we need. The gaps:

| Need | Status | Action |
|---|---|---|
| Public catalog read (`GET /v1/services`, `/v1/services/:id/packages`) for the marketing site | 🟠 Customer-JWT today | Add `@Public()` variants OR split into `/v1/public/services` |
| Public aggregate stats (`GET /v1/public/stats` — clients, workers, satisfaction, nationality count) | ❌ Missing | Add new endpoint with 5-min Redis cache |
| FAQ content (`GET /v1/faqs`) | ❌ Missing | Decide: static or backend-managed |
| Active workers report (`GET /v1/admin/reports/active-workers`) | ❌ Missing | Add — counts by status |
| Stripe event viewer (`GET /v1/admin/payments/:id/events`) | ❌ Missing | Add for audit trail |
| Direct payment refund endpoint | 🟠 Only via order refund | Probably fine — confirm UX |
| Contract sign action (PATCH/POST) | ❌ Missing | Likely external Signit redirect; confirm |
| Idempotency on `POST /v1/payments/intents` | ⚠️ Verify | Add `@Idempotent()` decorator if not present |
| Worker availability mark (admin) | 🟠 Conflated with status PATCH | Confirm if explicit endpoint wanted |
| Dashboard rollup `GET /v1/admin/reports/overview` (KPIs in one call) | ❌ Missing | Add a single endpoint that combines revenue + order counts + worker counts for the homepage cards |

---

## 6. Recommended execution order

This is a large project. Here's the order I'd execute in:

### Phase A — Backend foundation (≈1–2 days)
1. Make catalog `GET` endpoints public (or add `/v1/public/*` variants).
2. Add `GET /v1/public/stats` (cached).
3. Add `GET /v1/admin/reports/overview` (dashboard KPI rollup).
4. Add `GET /v1/admin/reports/active-workers`.
5. Add `@Idempotent()` to payment intent creation if missing.
6. Regenerate OpenAPI + `@mawared/api-client` + Kotlin client.

### Phase B — Admin dashboard (≈3–5 days)
7. Build shared infrastructure: `useApiClient` hook, idempotency wrapper, RFC 7807 helper, `formatMoney(bigint, currency)`, cursor-pagination hook.
8. Delete `DashboardProvider` + mock data file.
9. Rewrite each route to fetch from API (orders → workers → customers → packages → services → payments → reports → settings).
10. Add Zod validation to all forms.
11. Add file upload flow (presigned URL → finalize → bind to worker).

### Phase C — Website-next (≈1 day)
12. Add API client dependency.
13. Wire ServicesSection, PricingSection, StatsSection, HeroSection to the public endpoints.
14. Move WhatsApp/app-store/social links to env vars.
15. Decide FAQ/Testimonials path.

### Phase D — Android (≈4–7 days)
16. Add Retrofit/Moshi/OkHttp/Firebase deps to `app/build.gradle.kts`.
17. Copy API client into `data/remote/` (or depend on the package directly).
18. Instantiate the client in `MawaredApp.onCreate()`; wire `AndroidTokenStorage`.
19. Add `IdempotencyInterceptor`.
20. Wire `AuthViewModel` to real OTP request/verify.
21. Implement `FirebaseMessagingService` + `POST /v1/devices` on login, `DELETE` on logout.
22. Replace mocks ViewModel-by-ViewModel (Auth → Home → Workers → Catalog → Order flow → Payment → Orders list/detail → Notifications → Profile → Addresses → Favorites → Offers → Branches → Contracts).
23. Wire Stripe PaymentSheet to `POST /v1/payments/intents`.
24. Add money mappers (`priceMinor: String` → `Long`, with currency code).
25. Add order detail polling / status refresh.

### Phase E — Validation
26. `pnpm typecheck` + `pnpm lint` clean across all packages.
27. Add integration tests for any new backend endpoints.
28. Manual smoke: full customer journey on Android, full admin journey on dashboard, lead capture on marketing site.
