# Mawared — Migration & Handoff Notes

**Living document.** Updated as we go. Tracks the dashboard ↔ backend
wiring effort, deployment readiness, and outstanding work.

Last update: 2026-05-14

---

## TL;DR — where we are right now

| Surface | State |
|---|---|
| **Railway deploy** | ✅ Ready — `railway.toml`, patched `Dockerfile`, runbook in `infra/runbooks/railway-first-deploy.md`. |
| **Backend (NestJS API)** | ✅ All controllers wired to real services. Stubs are env-gated dev fallbacks (Stripe / Twilio / Signit). Test coverage is thin (only domain + money specs). |
| **website-next** | ✅ Contact form POSTs to `/v1/leads`. Sitemap + robots + `.env.example` in place. |
| **admin-dashboard auth** | ✅ Real `/v1/admin/auth/login`. TOTP step-up. Session in `sessionStorage`, single-flight refresh via `MawaredClient`. |
| **admin-dashboard data layer** | ✅ TanStack Query wired. **9 / 9 data pages on real backend.** Mock layer decommissioned. |
| **android** | 🟢 **All 6 ViewModels migrated** (Auth, Home, Workers, Order, Profile, Contracts). Retrofit/Moshi/OkHttp deps in place, api-client embedded, encrypted token storage live, idempotency interceptor stamping every mutation. FCM + Stripe + photo-URL lookup still deferred. |

---

## Page-by-page status (admin-dashboard)

| Page | Real API? | Notes |
|---|---|---|
| `/login` | ✅ | `useAuth().login()` → `/v1/admin/auth/login`. TOTP field appears when backend returns `AUTH_2FA_REQUIRED`. |
| `/dashboard` (home) | ✅ | KPIs + 30-day revenue area + status donut + recent orders from `/v1/admin/reports/overview` and `/active-workers`. |
| `/dashboard/orders` (list) | ✅ | Cursor pagination, status filter, transition modal (5 events, state-machine aware), detail modal with full status history. |
| `/dashboard/workers` (list) | ✅ | Filters by nationality/profession/availability. Create modal uses real `branches` + `nationalities` endpoints. Edit/Delete wired. |
| `/dashboard/workers/[id]` | ✅ | Read-only profile with languages, skills, rating. Photo + document upload deferred (4-step S3 flow). |
| `/dashboard/customers` | ✅ | Cursor pagination, phone-substring filter, suspend/reactivate row actions. |
| `/dashboard/payments` | ✅ | Read-only Stripe intents list, status + date filters, page-local KPI totals. |
| `/dashboard/services` | ✅ | Card grid with profession chips. Create/edit modal posts to `/v1/admin/services`. "Delete" is a soft `deactivate`. |
| `/dashboard/packages` | ✅ | Tabbed table (monthly / hourly), service FK picker, full price + VAT % editor (auto-converts to halalas + ppm). |
| `/dashboard/reports` | ✅ | Date-range + presets. 4 KPI cards. Revenue dual-area (gross vs net), order status donut, nationality bar, refund summary. |
| `/dashboard/settings` | UI-only | No backend behavior yet. |

---

## Backend endpoints added this migration

| Method | Path | Reason |
|---|---|---|
| `GET` | `/v1/nationalities` | Public reference list. Unblocked the worker-create form. New module: `apps/backend/src/modules/nationalities/`. Registered in `app.module.ts`. |

## Backend response shapes tightened (api-client types)

| Endpoint | Was | Now |
|---|---|---|
| `GET /v1/admin/reports/revenue` | `unknown` | `AdminRevenueReport` |
| `GET /v1/admin/reports/orders` | `unknown` | `AdminOrdersByStatusReport` |
| `GET /v1/admin/reports/refunds` | `unknown` | `AdminRefundsReport` |
| `GET /v1/admin/customers` | `Paged<AdminCustomer>` (was unimplemented) | Cursor-paged `Paged<AdminCustomerRow>` with backend service rewritten to match. |
| `GET /v1/admin/customers/:id` | `AdminCustomer` | `AdminCustomerDetail` (orders count, lifetime value, addresses, sessions). |

---

## Backend changes (non-additive)

| File | Change |
|---|---|
| `apps/backend/Dockerfile` | Added `RUN npm i -g prisma@^5.22.0` so `prisma migrate deploy` works at Railway preDeploy time. Also adopted `pnpm --filter @mawared/shared-types build` + `npx nest build` flow. |
| `apps/backend/src/modules/admin/customers/admin-customers.service.ts` | Rewritten to project rows into `AdminCustomerRow` and use cursor pagination — matches the api-client `AdminCustomer` contract. `findById` returns the richer `AdminCustomerDetail` (orders count, lifetime value, addresses, active sessions). |
| `apps/backend/src/modules/admin/customers/admin-customers.controller.ts` | Switched to Zod-validated `ListCustomersDto` with cursor + `q` filter. |
| `apps/backend/src/modules/admin/customers/dto/list-customers.dto.ts` | New DTO. |
| `infra/railway.toml` | `preDeployCommand` now uses the global `prisma` CLI (was `pnpm prisma` — pnpm isn't in the runtime image). |
| `railway.toml` (root) | New, mirrors infra config. Railway picks this up by default. |
| `.dockerignore` (root) | New. Repo-root build context is what Railway uses. |

---

## API client changes

`packages/api-client-ts/src/types.ts`:
- Added `Nationality`.
- Added `AdminCustomerDetail extends AdminCustomer` with `totalOrders`, `lifetimeValueMinor`, `activeSessions`, `addresses[]`.

`packages/api-client-ts/src/client.ts`:
- New namespace: `client.nationalities.list()` → `GET /v1/nationalities`.
- `client.admin.customers.findById` return type lifted to `AdminCustomerDetail`.

---

## Frontend infrastructure (admin-dashboard)

| File | Purpose |
|---|---|
| `src/lib/auth.tsx` | Real auth context (login / logout / TOTP / error mapping). Source of truth. |
| `src/lib/api.ts` | `MawaredClient` singleton with sessionStorage token storage + single-flight refresh. |
| `src/lib/query-client.tsx` | TanStack Query provider. Wraps `AuthProvider` in the root layout. |
| `src/lib/order-status.ts` | 11-state taxonomy + transition matrix for the order state machine. |
| `src/lib/worker-display.ts` | Profession + availability labels and color classes. |
| `src/lib/hooks/use-admin-orders.ts` | list / detail / transition / refund |
| `src/lib/hooks/use-admin-workers.ts` | list / detail / create / update / delete |
| `src/lib/hooks/use-admin-customers.ts` | list / detail / suspend / reactivate |
| `src/lib/hooks/use-admin-payments.ts` | list / detail / refunds + status taxonomy |
| `src/lib/hooks/use-admin-catalog.ts` | services + packages CRUD + display helpers |
| `src/lib/hooks/use-admin-reports.ts` | overview / activeWorkers / revenue / ordersByStatus / refunds |
| `src/lib/hooks/use-reference-data.ts` | nationalities + branches (30-min staleTime) |
| `src/lib/utils.ts` | `formatMoneyMinor` (BigInt → SAR), `shortOrderRef`, `formatDate` |

---

## Things YOU need to do

Before the dashboard runs against real data:

1. `pnpm install` at the repo root — pulls `@tanstack/react-query` and `@tanstack/react-query-devtools` that were added to `admin-dashboard/package.json`.
2. Restart the backend after pulling — the new `nationalities` module needs to register.
3. Set `NEXT_PUBLIC_API_BASE_URL` in `admin-dashboard/.env.local`. Default is `http://localhost:3000`.
4. Create a staff account in the backend (no UI yet; use `prisma:seed` or insert directly). Argon2id-hashed password. Optional TOTP.
5. Seed the `Nationality` table if it's empty (the seed script likely handles this — `pnpm backend:seed`).

---

## Known gaps / deferred work

| # | Item | Where to start |
|---|---|---|
| 1 | **Photo + document upload** for workers | 4-step flow: `/v1/files/upload-url` → PUT to R2 → `/v1/files/finalize` → `/v1/admin/workers/:id/photo` (or `/documents`). Build a `useFileUpload` hook to drive it. |
| 2 | **Backend test coverage** for `auth`, `orders`, `payments` services + Stripe webhook consumer | `apps/backend/src/modules/*/.spec.ts`. Use the order-entity spec as a template. |
| 3 | **Android real-API integration** | Add Retrofit/OkHttp/Moshi to `android/app/build.gradle.kts`. Add `:packages:api-client-kotlin` to `settings.gradle.kts`. Replace `MockX` references in every ViewModel. |
| 4 | **Excel export buttons** | Orders + payments pages have placeholders. Wire to an `/admin/reports/*` endpoint that streams xlsx. |
| 5 | **i18n English** | Both admin + marketing sites are Arabic-hardcoded. Add `next-intl`. |

---

## Migration cookbook (for the remaining pages)

The pattern is now well-established. For each remaining page:

1. **Inspect** the backend controller, service, DTOs. Note the response shape and any field renames vs. the existing mock UI.
2. **Hook file** under `src/lib/hooks/use-admin-<resource>.ts` — list / detail / mutations with shared cache key. Mirror the orders pattern.
3. **Page rewrite**:
   - Replace `useDashboard()` with the new hook.
   - Import the type from `@mawared/api-client`, not `@/types`.
   - Add loading skeletons, error state (RFC 7807 `code` + `detail`), empty state.
   - For mutations: `toast.success` on resolve, `toast.error` on rejected with `ApiError.detail`.
   - For lists: cursor pagination with a back-stack.
4. **Verify** with `Grep` that no `useDashboard` / `mockX` references remain in the page's directory.

---

## Open questions / decisions made

- **Tokens in sessionStorage** (not httpOnly cookies). Trade-off: simpler, no proxy layer. Acceptable because admin login requires TOTP and the dashboard is internal-only. If we ever expose it to the public internet, revisit.
- **Cursor pagination only** — every list endpoint uses cursor, never offset. The frontend keeps a back-stack of cursors to support "previous page".
- **Status taxonomy** — the original UI used 10 lowercase order statuses; the backend has 11 UPPERCASE. We aligned the UI to the backend rather than maintaining an adapter layer.
- **Mock-only fields dropped** — religion, marital status, height, weight, work history, lead-capture city/orderNumber. These never existed in the schema.

---

## Useful commands

```bash
# repo root
pnpm install                         # install all workspaces
pnpm infra:up                        # postgres + redis + mailhog (docker)
pnpm backend:dev                     # API on :3000
pnpm backend:worker                  # BullMQ consumer
pnpm backend:migrate                 # prisma migrate dev
pnpm backend:seed                    # idempotent dev seed

# admin dashboard
cd admin-dashboard && pnpm dev       # :3001

# website
cd website-next && pnpm dev          # :3000 (conflicts with backend — run separately)
```

---

## Android wiring (Phase D — in progress)

**Done this session:**

| File | What it does |
|---|---|
| `android/app/build.gradle.kts` | Added Retrofit 2.11, Moshi 1.15 + kotlin-codegen, OkHttp 4.12 + logging, EncryptedSharedPreferences 1.1.0-alpha06, kotlinx-coroutines-android 1.8.1. Enabled `buildConfig`. Added `API_BASE_URL` `buildConfigField` — debug = `http://10.0.2.2:3000` (emulator localhost), release = staging or `-PapiBaseUrl=...` override. |
| `android/app/src/main/kotlin/com/mawared/api/Apis.kt` `Dtos.kt` `Client.kt` | Copied verbatim from `packages/api-client-kotlin/src/`. `Client.kt` patched to include an `IdempotencyInterceptor` that auto-stamps a UUIDv4 `Idempotency-Key` on every POST/PATCH that doesn't already have one. |
| `android/app/src/main/kotlin/com/mawared/dawliah/data/di/AppContainer.kt` | Service locator. Lazy-builds `MawaredApi`. Holds `AndroidTokenStorage` (encrypted) and a stable per-install `deviceId` UUID. Extension: `context.appContainer()`. |
| `android/app/src/main/kotlin/com/mawared/dawliah/MawaredApp.kt` | `onCreate` now builds the `AppContainer`. Exposes `container` for everyone else. |
| `android/app/src/main/kotlin/com/mawared/dawliah/data/remote/ApiErrors.kt` | Translates Retrofit `HttpException` + `IOException` into Arabic UI strings. Parses RFC 7807 `code`/`detail` and maps the common ones (invalid OTP, account locked, verification required, rate limited, etc.). |
| `android/app/src/main/kotlin/com/mawared/dawliah/data/remote/ApiMappers.kt` | DTO → domain mappers. Handles the BigInt-string-halalas → `Int` SAR conversion and profession-code enum mapping so existing Composables don't need to change. |
| `android/app/src/main/kotlin/com/mawared/dawliah/data/remote/WorkersRepository.kt` | Real worker search + favorites. Returns domain `Worker`. |
| `android/app/src/main/kotlin/com/mawared/dawliah/data/remote/CatalogRepository.kt` | `listServices()` against the now-public `/v1/services`. |
| `viewmodel/AuthViewModel.kt` | Real `requestOtp` + `verifyOtp` against `/v1/auth/otp/*`. Persists access+refresh tokens. Probes storage at construction — if a refresh token exists, the user starts the app already authenticated. Logout best-effort revokes server-side then clears storage. |
| `viewmodel/HomeViewModel.kt` | Parallel-loads service catalog + 6 featured available workers + notifications unread count. Falls back to 0 for unread if the user isn't logged in. |
| `viewmodel/WorkersViewModel.kt` | Real `/v1/workers` search. Optimistic favorites toggle with rollback on failure. Client-side filters preserved. |

**All 6 ViewModels are now mock-free.** Verified via `Grep "import com.mawared.dawliah.data.mock"` over `viewmodel/` — zero hits.

**ViewModels and the endpoints they call:**

| ViewModel | Endpoints | Highlights |
|---|---|---|
| `AuthViewModel` | `auth.requestOtp`, `auth.verifyOtp`, `auth.logout` | Persists tokens via `AndroidTokenStorage`. Probes storage at construction → already-logged-in users skip OTP. Best-effort server revoke on logout. |
| `HomeViewModel` | `catalog.listServices`, `workers.search`, `notifications.list` | Parallel fetch via `async`. Unread count falls back to 0 for anonymous users. |
| `WorkersViewModel` | `workers.search`, `me.favorites.*` | Optimistic favorite toggle with rollback. Client-side filters preserved. |
| `OrderViewModel` | `orders.list/findById/create/cancel`, `me.addresses.list` | Explicit idempotency key on create. Surfaces RFC 7807 errors (incl. `VERIFICATION_REQUIRED`). |
| `ProfileViewModel` | `me.getMe/listAddresses/createAddress/deleteAddress`, `notifications.list/markRead` | All sections fail open. Optimistic address removal + mark-all-read with rollback. |
| `ContractsViewModel` | `orders.list` (synthesized) | Backend has no `/v1/me/contracts` — filters orders to CONFIRMED+/CONTRACT_IN_PROGRESS+ and renders them as `Contract` shapes. |

**Migration recipe** (kept here for future ViewModel work):

```kotlin
// 1) Make the VM an AndroidViewModel
class XViewModel(application: Application) : AndroidViewModel(application) {
    private val container = application.appContainer()
    private val api = container.api
}

// 2) Replace every `delay()` + `MockX.all` with a `runCatching { api.<resource>.<method>() }`
viewModelScope.launch {
    _uiState.update { it.copy(isLoading = true) }
    runCatching { api.foo.list() }
        .onSuccess { fresh -> _uiState.update { it.copy(items = fresh.items, isLoading = false) } }
        .onFailure { t -> _uiState.update { it.copy(isLoading = false, error = ApiErrors.toMessage(t)) } }
}

// 3) Map DTOs in ApiMappers.kt if the domain model differs.
```

**Still deferred (require external setup or new backend endpoints):**

1. **Firebase Cloud Messaging** — needs `google-services.json` (project-specific). Add Firebase BOM + messaging SDK to gradle, build `MawaredMessagingService`, call `api.notifications.registerDevice(...)` on login. Add `POST_NOTIFICATIONS` permission.
2. **Stripe PaymentSheet** — wire `OrderStep4Screen` to `api.payments.createIntent(orderId, UUID.randomUUID().toString())` and feed `clientSecret` to `PaymentSheet`. Backend already idempotent on the intent endpoint.
3. **Photo display** — worker DTOs reference `photoFileId`; the URL comes from a `/v1/files/:id/signed-url` lookup that doesn't exist yet. UI uses placeholder.
4. **Contracts list endpoint** — `/v1/me/contracts` doesn't exist. ViewModel synthesizes from orders. When the backend exposes a proper list endpoint, drop the synthesizer.
5. **Profile PATCH** — Kotlin `me.getMe()` returns `Any`. Add a typed DTO + `me.update(...)` method when the profile DTO firms up; replace the defensive map-extractor in `ProfileViewModel`.
6. **Identity verification deep-link** — `ProfileViewModel.startVerification()` is a stub. Wire to `POST /v1/me/verification/start` and open the returned `redirectUrl` in a Chrome Custom Tab. Backend webhook updates status when Signit.sa completes.

**OffersViewModel, BranchesViewModel, PackagesViewModel, etc.** don't exist in the codebase yet — the audit at `docs/backend/AUDIT-FRONTEND-WIRING.md` lists screens (Offers, Branches, Packages) that have UI but no separate ViewModel. They consume `MockOffers/MockBranches/MockPackages` directly from Composables. When promoted to proper ViewModels, follow the recipe above — endpoints are `api.offers.list()`, `api.branches.list()`, `api.catalog.listPackages(serviceId)` respectively.

## Mock layer decommission

- `src/lib/dashboard-context.tsx` — now an empty stub that throws if `useDashboard()` is ever called. Kept as a file because file deletion needs user approval; safe to remove once you `pnpm typecheck` clean.
- `src/data/mockData.ts` — same treatment. All exports are empty `never[]` and `makeWorker()` throws.
- `src/app/dashboard/layout.tsx` — `<DashboardProvider>` wrap removed.

The legacy mock-only types under `src/types/index.ts` (`Order`, `Worker`, `Customer`, `Payment`, `Service`, `Package`, etc.) are still referenced only by themselves. Safe to clean up when convenient — they don't block anything.

---

## Changelog

### 2026-05-14 (this session)

- **Deployment**: Railway config (`railway.toml` + root `.dockerignore`), patched Dockerfile to bundle `prisma` CLI, written first-deploy runbook.
- **website-next**: Contact form wired to `/v1/leads` with E.164 phone normalization, Idempotency-Key, 429 handling. Sitemap + robots + `.env.example` added.
- **admin auth**: Replaced fake `sessionStorage.setItem('mawared_auth','true')` with real `MawaredClient.adminAuth.login`. TOTP step-up. Login page rewrite. Dashboard layout now uses the real auth probe.
- **TanStack Query**: Provider + sensible defaults + devtools (in dev). Added to `admin-dashboard/package.json`.
- **Order status taxonomy**: New `src/lib/order-status.ts` with backend statuses + `getLegalTransitions()` matching the state machine.
- **Orders page**: Full real-data rewrite with cursor pagination, transition modal, detail modal with status history.
- **Workers page (list + detail + create + edit + delete)**: Full real-data rewrite. New `/v1/nationalities` backend endpoint unblocks the create form.
- **Customers page**: Cursor pagination, suspend/reactivate. Backend service reshaped to return the flat `AdminCustomer` projection.
- **Payments page**: Cursor pagination, Stripe status taxonomy, page-local KPIs.
- **API client**: Added `Nationality`, `AdminCustomerDetail`, `client.nationalities.list()`, typed `AdminRevenueReport / AdminOrdersByStatusReport / AdminRefundsReport`.
- **Services page**: Real CRUD via `/v1/admin/services`. Profession-tagged cards. Soft deactivate.
- **Packages page**: Real CRUD via `/v1/admin/packages`. HOURLY/MONTHLY tabs. Service FK picker. VAT% ↔ ppm conversion. Price major ↔ minor conversion. Popular flag.
- **Dashboard home**: Wired to `/v1/admin/reports/overview` and `/active-workers`. Real KPIs (yesterday revenue with day-before delta, new customers 30d, available workers / total), 30-day revenue area, status donut, recent-orders table, top-nationality chip.
- **Reports page**: Wired to `/v1/admin/reports/revenue|orders|refunds` + `active-workers`. Date-range with presets (7d / 30d / 90d / 1y). Dual-area gross vs net, status donut, nationality bar, refund rate card.
- **Mock layer**: `DashboardProvider` unwrapped from dashboard layout. `dashboard-context.tsx` and `mockData.ts` reduced to throwing stubs.

### 2026-05-14 — Android Phase D (complete for all 6 existing ViewModels)

- Gradle deps added (Retrofit/Moshi/OkHttp/Crypto/coroutines). `BuildConfig.API_BASE_URL` wired per build type.
- API client copied from `packages/api-client-kotlin/` into `com.mawared.api` so it compiles in the app module.
- `IdempotencyInterceptor` auto-stamps UUIDv4 on POST/PATCH.
- Service locator (`AppContainer`) initialized in `MawaredApp.onCreate()`. Lazy `MawaredApi`, encrypted token storage, stable per-install `deviceId`.
- Arabic-friendly RFC 7807 error mapper (`ApiErrors`).
- DTO → domain mappers (`ApiMappers`) for `Worker`, `ServiceCategory`, `Address`, `NotificationItem`, `Order` (shallow projection), `ServicePackage`. Handles the 11→10 backend-status enum compression and BigInt-string halalas → `Int` SAR conversion.
- Repositories: `WorkersRepository`, `CatalogRepository`, `OrdersRepository`, `AddressesRepository`.
- `AuthViewModel` → real OTP request/verify + token persistence + best-effort logout revoke.
- `HomeViewModel` → parallel-loads catalog + featured workers + unread notification count.
- `WorkersViewModel` → real search + optimistic favorites with rollback.
- `OrderViewModel` → real list/findById/create (idempotency key)/cancel. Addresses pulled in parallel.
- `ProfileViewModel` → parallel `/v1/me` + addresses + notifications. Optimistic remove-address + mark-all-read with rollback.
- `ContractsViewModel` → synthesized from orders list (no `/v1/me/contracts` endpoint yet). Documented in deferred work.
