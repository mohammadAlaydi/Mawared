# Mawared International — Product Requirements Document (Master, v1)

> The single product-level PRD for the Mawared platform: the customer Android app, the staff admin
> dashboard, the public marketing website, and the API that powers all three.
>
> This is the **product** master. For deep engineering specs see
> [backend PRD](./backend/01-PRD.md), [architecture](./backend/02-ARCHITECTURE.md),
> [state machine](./backend/06-STATE_MACHINE.md), and [decisions/ADRs](./backend/05-DECISIONS.md).
> For QA, see [QA-TEST-PLAN.md](./QA-TEST-PLAN.md).

| | |
|---|---|
| **Status** | Living document — v1 build |
| **Product** | Mawared International (موارد الدولية للإستقدام) — domestic-worker recruitment platform |
| **Market** | Saudi Arabia / GCC, Arabic-first |
| **Owner** | Product lead |
| **Last updated** | 2026-06-15 |

---

## 1. Executive summary

Mawared is a **curated domestic-worker recruitment marketplace** for Saudi Arabia. Customers browse a
vetted catalog of workers (maids, drivers, caregivers, nannies), book a worker under a chosen service
package, pay online, and track fulfillment to a signed contract — from their phone. Mawared staff run
the whole operation (worker intake, order processing, contracts, payments, reporting) from one web
dashboard. A public marketing website drives acquisition and captures leads.

It is **one API serving three clients** (Android app, admin dashboard, marketing website) and is the
system of record for every business-critical entity: customers, workers, orders, contracts, payments.

**Core differentiator:** a *curated* (not open) marketplace with a human-in-the-loop confirmation step.
Mawared owns every worker CV; customers book specific known workers; staff confirm and issue contracts.

---

## 2. Goals & non-goals

### 2.1 Product goals (v1)
1. Let a customer go from "I need a worker" to "paid & contract issued" on a phone, in Arabic, in minutes.
2. Give staff a single console to run the business with full auditability and role-based access.
3. Present a credible, on-brand public presence that converts visitors into leads/app installs.
4. Be correct and safe with money, inventory (worker availability), and customer data.

### 2.2 Non-goals (v1) — deliberately deferred
- Saudi government integrations (Musaned, Nafath, ZATCA e-invoicing).
- Local payment rails (Mada, STC Pay, Tamara, Tabby) — **Stripe only** for v1 (flagged risk: Stripe does not support Mada).
- iOS app, customer web app, web push.
- Multi-tenant SaaS / agency self-serve portal.
- AI/vector worker matching; in-app live chat (WhatsApp deep-link instead).
- Wallet/store credit (refunds go to original method only).

---

## 3. Personas & roles

| Persona | Surface | Auth | Summary |
|---|---|---|---|
| **Customer** | Android app | Phone OTP → JWT | Arabic-speaking adult in KSA/GCC hiring a worker for hourly/monthly service. Not technical. |
| **Staff / Operator** | Admin dashboard | Email + password (+ TOTP) | Branch office staff: worker intake, order processing, contracts, payments, support. |
| **Branch Manager** | Admin dashboard | Email + password (+ TOTP) | Staff powers scoped to their branch + branch-level reports. |
| **Super Admin** | Admin dashboard | Email + password (+ TOTP) | Full access: staff, branches, catalog, pricing, promos, system reports, audit. |
| **Public visitor** | Marketing website | None | Browses brand info, submits a lead/contact form. |

System roles (enforced in the API): `CUSTOMER`, `STAFF`, `BRANCH_MANAGER`, `SUPER_ADMIN`.

---

## 4. The recruitment lifecycle (الاستقطاب) — the spine of the product

Everything centers on the **order lifecycle**. An order is a customer booking a specific worker under a
service package, taken through a strict state machine with a human confirmation step.

**States (11):** `DRAFT → RESERVED → PAYMENT_PENDING → PAID → UNDER_REVIEW → CONFIRMED → IN_PROGRESS → COMPLETED`,
plus `PAYMENT_FAILED`, `CANCELLED`, `REFUNDED`.

| State | Meaning | Worker locked? | Money |
|---|---|---|---|
| DRAFT | Being assembled in the app | No | — |
| RESERVED | 15-min advisory hold while customer pays | Yes | — |
| PAYMENT_PENDING | Stripe PaymentIntent created | Yes | Authorizing |
| PAYMENT_FAILED | Last attempt failed; retry within hold | Yes (until expiry) | — |
| PAID | Funds captured | Yes | Captured |
| UNDER_REVIEW | Staff reviewing before confirming | Yes | Captured |
| CONFIRMED | Staff confirmed; **contract issued**; worker BOOKED | Worker=BOOKED | Captured |
| IN_PROGRESS | Service being delivered | Worker=BOOKED | Captured |
| COMPLETED | Service delivered (terminal-happy); worker AVAILABLE again | Released | Captured |
| CANCELLED | Cancelled before/after payment (terminal) | Released | Refund if was paid |
| REFUNDED | Paid order fully refunded (terminal) | Released | Refunded |

Rules: transitions are enforced by a pure `nextStatus(current, event)` function; illegal transitions are
rejected. `CONFIRMED` is only reachable when payment is captured. Reservations auto-expire via a delayed
job. Full transition matrix: [06-STATE_MACHINE.md](./backend/06-STATE_MACHINE.md).

**Service types offered** (from the brand/catalog): الاستلام الفوري (instant), الاستقدام بالتوسط (mediation/recruitment),
العاملة المقيمة (resident worker), الزيارة بالساعة (hourly visit) — sold via hourly/monthly packages.

---

## 5. Functional requirements

> Convention: **MUST** = required for v1 acceptance; **SHOULD** = strongly desired; **MAY** = optional.

### 5.1 Customer Android app (via API)
- **FR-C1 (MUST):** Phone-OTP signup/login; JWT access (15-min) + rotated refresh (30-day); per-device sessions with theft detection.
- **FR-C2 (MUST):** Profile: name, photo, default language, saved addresses, notification preferences.
- **FR-C3 (MUST):** Browse/search workers — filters: profession, nationality, language, salary range, age, experience; sort: price, rating, newest. Cursor pagination.
- **FR-C4 (MUST):** Worker detail: photo, bio, skills, languages, salary, availability, rating.
- **FR-C5 (SHOULD):** Favorites (save/unsave workers).
- **FR-C6 (MUST):** Browse service catalog & packages (hourly/monthly tiers); view active offers/promo codes.
- **FR-C7 (MUST):** Place order: worker → package → address → promo → pay (Stripe). 15-min reservation hold during checkout.
- **FR-C8 (MUST):** Order tracking with the status timeline (§4) + push notification on every status change.
- **FR-C9 (MUST):** Contracts: view active/historical, **PDF download**.
- **FR-C10 (MUST):** Payment history + receipts.
- **FR-C11 (SHOULD):** Branch directory (phone, hours, map coordinates).
- **FR-C12 (MUST):** In-app notification center; FCM device-token registration.
- **FR-C13 (MUST):** Soft-delete account (PDPL-style data removal within 30 days).

### 5.2 Admin dashboard
- **FR-A1 (MUST):** Staff/manager/super-admin login: email + password (argon2id) + TOTP 2FA; RBAC enforced server-side.
- **FR-A2 (MUST):** **Dashboard home** — KPIs (total orders, revenue, new customers, available/booked workers, top nationality, orders-by-status, latest orders).
- **FR-A3 (MUST):** **Workers (إدارة العمالة)** — create, edit, set availability, archive (soft delete); filter by nationality/profession/availability; search by name; upload photo + documents (when storage configured). Salary stored in minor units, displayed formatted SAR.
- **FR-A4 (MUST):** **Orders (إدارة الطلبات)** — list with filters (status, branch, date, customer); detail with status timeline; transition status (audited, rule-enforced); manual worker assignment; cancel; refund; Excel export.
- **FR-A5 (MUST):** **Customers (العملاء)** — list, search, detail, edit, suspend, delete.
- **FR-A6 (MUST):** **Catalog** — services (الخدمات) and packages (الباقات): create, edit, deprecate; price + VAT.
- **FR-A7 (MUST):** **Payments (المدفوعات)** — list, view (read-only Stripe view), manual refund (from order detail), reconcile.
- **FR-A8 (SHOULD):** **Promo codes** — create, edit, deactivate; usage report.
- **FR-A9 (MUST):** **Contracts** — generate PDF on confirmation, regenerate, void.
- **FR-A10 (MUST):** **Reports (التقارير)** — revenue, orders by status, top workers, refund rate, customer cohorts; date-range filter; branch-scoped for managers.
- **FR-A11 (MUST):** **Settings (الإعدادات)** — roles & permissions; staff/branch management (super-admin).
- **FR-A12 (MUST):** **Notifications bell** — live activity feed (leads, orders to review, paid orders, new customers, pending verifications) derived from real data, with quick contact affordances (call/email); per-browser read state; unread badge.
- **FR-A13 (MUST):** **Audit log viewer** — actor, target, before/after, timestamp for every state-changing action.

### 5.3 Marketing website
- **FR-W1 (MUST):** Single-page Arabic RTL site with sections: Hero (rotating brand slider), Services, How-it-works, About, Stats, Pricing, Testimonials, FAQ, Contact/Lead, Download-CTA, Footer.
- **FR-W2 (MUST):** Lead/contact form → rate-limited POST (no auth). Honeypot/light anti-abuse.
- **FR-W3 (MUST):** App-store CTAs (Google Play / App Store).
- **FR-W4 (SHOULD):** WhatsApp Business deep-link button.
- **FR-W5 (MUST):** SEO basics — title/description/OpenGraph, semantic HTML, fast LCP.

### 5.4 Cross-cutting platform
- **FR-P1 (MUST):** Arabic-first content, English fallback (`{ar, en}` labels).
- **FR-P2 (MUST):** Money = **BigInt minor units + `Char(3)` currency**; never float/Decimal. SAR primary; SDK-ready for AED/KWD/BHD/QAR/OMR. Serialized as string over the wire.
- **FR-P3 (MUST):** Idempotent write endpoints (`Idempotency-Key`, 24h TTL).
- **FR-P4 (MUST):** RFC 7807 `application/problem+json` errors with a structured `code`.
- **FR-P5 (MUST):** Cursor-based pagination only.
- **FR-P6 (MUST):** Soft deletes with audit history (customers, workers, orders, contracts).
- **FR-P7 (MUST):** Request-ID correlation on every log line; PII redaction in logs.
- **FR-P8 (MUST):** Rate limiting per IP / phone / user / endpoint family — tuned so **normal interactive use never trips it**; the auth/OTP surface stays strict (real abuse surface). Clients degrade gracefully on 429 (respect `Retry-After`, back off, no error spam).

---

## 6. Brand & design system (official kit)

The platform must look intentional and on-brand across all surfaces (website + dashboard).

### 6.1 Colors
| Token | Hex | Use |
|---|---|---|
| Royal Blue (primary) | `#2D5BE4` | Primary actions, links, active states |
| Electric Sky Blue | `#6599FE` | Light accents, gradients, highlights |
| Midnight Navy | `#0F234C` | Dark text, dark surfaces, sidebar, footer |
| White | `#FFFFFF` | Surfaces |
| Gold (secondary) | `#ECA423` | Accents, badges, KPI highlights |
| Green (secondary) | `#5DF285` | Success, "available" states |

Brand gradient: `linear-gradient(90deg, #6599FE, #2D5BE4)`. Warm-neutral surface `#F7F6F2`.

### 6.2 Typography
- **Alexandria** — Arabic + primary UI font (applied site-wide).
- **Manrope** — Latin body/numerals.
- **Glancyr** — Latin display/headings.
- Self-hosted via `next/font/local`. (Cairo is fully retired.)

### 6.3 Logo & icon
- Clean vector wordmark "موارد" + blue rounded-square "م" badge.
- Variants: wide on light, white on dark, square icon (used for favicons).
- Never ship the annotated/mockup logo files.

### 6.4 UX principles
- **Arabic RTL** throughout: right-aligned text, mirrored icons/arrows.
- **Responsive** at 320 / 375 / 768 / 1024 / 1440 / 1920 with **zero horizontal overflow**.
- Dashboard mobile: sidebar becomes an off-canvas drawer; tables scroll horizontally; grids/filters stack.
- Designed hover/focus/active states; accessible labels on icon-only controls.

---

## 7. System architecture (summary)

Monorepo (pnpm + Turborepo):
- `apps/backend` — **NestJS** modular monolith. Two entrypoints: HTTP API (`main.ts`) and BullMQ worker (`worker.ts`). Modules: auth, users, workers, catalog, orders, payments, contracts, notifications, branches, offers, verifications, leads, files, health, admin (audit/orders/workers/customers/staff/promos/payments/reports/catalog/verifications/flags).
- `admin-dashboard` — **Next.js 16** (React 19, Tailwind 4, App Router), depends on `@mawared/api-client`.
- `website-next` — **Next.js 16** marketing site (read-only, no API client beyond the lead form).
- `android` — **Kotlin/Compose** customer app.
- `packages/` — `@mawared/api-client` (TS, generated from OpenAPI), `@mawared/api-client-kotlin`, `@mawared/shared-types` (error codes/enums), `@mawared/tsconfig`.
- `infra/` — docker-compose (Postgres 16, Redis 7, Mailhog), Railway config, k6 load tests.

**Data:** Postgres 16 via Prisma 5 (extensions: pgcrypto, citext, pg_trgm). Key models: User, Customer, StaffProfile, Session, RefreshToken, Worker, Order, Reservation, Payment, Contract, Notification, AuditLog, IdentityVerification, FeatureFlag.

**Auth:** Customer OTP → JWT (RS256 in prod, HS256 dev fallback), rotated refresh, per-device theft detection, JWKS endpoint. Admin: email + argon2id + TOTP.

Full detail: [02-ARCHITECTURE.md](./backend/02-ARCHITECTURE.md).

---

## 8. External integrations (all interface-abstracted + env-gated)

| Service | Purpose | v1 status |
|---|---|---|
| Stripe | Payments + async webhook processing (BullMQ) | Required for paid flow |
| Twilio | OTP SMS | Required for customer auth |
| FCM | Push notifications | Required for app |
| Signit.sa | Saudi national-ID verification | Reserved (schema ready) |
| Cloudflare R2 | S3-compatible storage (contracts, photos) | Required for uploads |
| Resend | Transactional email | Optional |
| Sentry | Error tracking | Recommended |

---

## 9. Non-functional requirements

| Concern | v1 target |
|---|---|
| Availability | 99.5% (single-region Railway) |
| API latency | p95 < 400ms reads, < 800ms writes (excl. 3rd-party) |
| OTP send | < 5s end-to-end |
| Push latency | < 30s after status change |
| Scale (designed headroom) | 1,000 concurrent users (10× arch), 500 daily orders (5,000 arch), < 5,000 worker catalog |
| Core Web Vitals (website) | LCP < 2.5s, INP < 200ms, CLS < 0.1 |
| Backup | RPO 24h, RTO 4h (quarterly restore drill) |
| Security | OWASP ASVS L2 baseline; TLS only; secrets never logged; PII redaction; CSP/security headers |
| Accessibility | WCAG 2.2 AA targets; keyboard + reduced-motion support |

---

## 10. KPIs (instrumented from day 1)

**Business:** DAU/WAU/MAU, order conversion (view→reserve→pay), promo redemption, refund rate, repeat-order rate (30/90d), AOV by category/currency.
**Operational:** order→contract time, worker utilization, staff productivity (orders/day).
**System:** API error rate by endpoint/status, Stripe webhook lag p95, BullMQ failure rate, active sessions, OTP send/success rate, DB pool utilization.

---

## 11. Key user stories

**Customer:** sign in by phone; search by profession/nationality/budget; reserve a worker for 15 min while paying; apply a promo and see the discount; get push within 30s of any status change; download contract PDF; delete account + data.
**Staff:** upload a worker CV in < 60s; filter the order queue; can only confirm an order when payment is captured (system-enforced); refund + void contract + notify in one action; see exactly what each customer paid.
**Branch Manager:** dashboard defaults to my branch; see branch revenue/orders/refunds for any date range.
**Super Admin:** create staff (role+branch); deactivate a promo instantly (in-flight checkouts fail gracefully); read the full audit log with before/after diffs.

---

## 12. Acceptance criteria (v1 ship gate)

A release ships when:
1. **Auth** works on both surfaces (customer OTP, admin email+password); RBAC enforced server-side.
2. **Recruitment lifecycle** is correct: a paid order can be reviewed → confirmed (contract issued) → in-progress → completed; cancel/refund works; illegal transitions are rejected.
3. **Admin dashboard** loads every page with real data — **no money-serialization or load failures** — and supports worker/customer/catalog CRUD + order processing.
4. **Marketing website** presents all sections on-brand with the real brand imagery.
5. **Branding** (official colors, Alexandria fonts, logos) and **responsiveness** (no horizontal overflow at all six breakpoints; mobile drawer; scrollable tables) verified on Chrome desktop + a real mobile device.
6. **Rate limiting** never blocks normal interactive use; auth surface stays protected.
7. **Money** correct everywhere (BigInt minor units; correct VAT/total; no float).
8. NFR targets in §9 met or explicitly waived; no open S1/S2 QA defects (see [QA-TEST-PLAN.md](./QA-TEST-PLAN.md)).

---

## 13. Milestones

| Milestone | Outcome |
|---|---|
| M0 Foundations | Repo, CI, envs, healthcheck |
| M1 Auth & catalog | Customer OTP login, browse workers, detail |
| M2 Orders & payments | End-to-end booking with Stripe + FCM |
| M3 Admin backend | Staff manage everything; RBAC |
| M4 Polish & hardening | Reports, audit UI, observability, load tests, **branding + responsive + QA** |
| M5 AWS migration | Same system on ECS Fargate + RDS, no behavior change |

---

## 14. Risks & open questions

1. **Mada support** — Stripe can't process Mada-only cards; decide before paid marketing in KSA.
2. **Identity verification** before first contract — reserved in schema (`IdentityVerification`), not enforced in v1.
3. **WhatsApp transactional notifications** — FCM only for v1; `NotificationChannel` abstraction allows later add.
4. **Contract PDF templating** — engine decided; legal/signature content needs business sign-off.
5. **VAT / revenue recognition** — flat 15% KSA stored per line; multi-jurisdiction VAT is post-MVP.
6. **Secret hygiene** — ensure no real credentials live in committed `.env.example` files (rotate any exposed).

---

## 15. Glossary

| Term | Meaning |
|---|---|
| استقطاب / استقدام | Recruitment / sourcing of domestic workers (the core business) |
| Worker / CV | A domestic worker profile in the catalog (maid, driver, caregiver, nanny) |
| Reservation | 15-minute advisory hold on a worker during checkout |
| Order | A customer's booking of a worker under a package, tracked through the state machine |
| Contract | The legal agreement PDF issued when an order is CONFIRMED |
| Branch | A Mawared office location; scopes Branch Manager access |
| Minor units | Money as integer (e.g. 1,800 SAR = `180000`) — never float |

---

**Related docs:** [Backend PRD](./backend/01-PRD.md) · [Architecture](./backend/02-ARCHITECTURE.md) ·
[Schema](./backend/03-SCHEMA.prisma) · [Roadmap](./backend/04-ROADMAP.md) · [Decisions/ADRs](./backend/05-DECISIONS.md) ·
[State machine](./backend/06-STATE_MACHINE.md) · [QA Test Plan](./QA-TEST-PLAN.md)
