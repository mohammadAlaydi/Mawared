# Mawared International — Backend PRD (v1)

> Product Requirements Document for the backend powering the Mawared mobile app, admin dashboard, and marketing website.

**Status**: Draft for engineering kickoff
**Owner**: Backend tech lead
**Last updated**: 2026-05-13

---

## 1. Vision

Build the backend platform that lets customers in the MENA region browse, book, pay for, and manage domestic-worker recruitment services from their phone — and lets Mawared staff operate the business (CV intake, order fulfillment, contracts, payments, reporting) from a single web dashboard.

The backend is **one API serving three clients**: the customer Android app, the staff admin dashboard, and the public marketing website. It is the system of record for every business-critical entity: customers, workers, orders, contracts, payments.

## 2. Product positioning

Mawared is a **curated marketplace**, not an open marketplace. Mawared staff onboard every worker (CV) into the catalog; customers browse and book specific workers; staff confirm orders, generate contracts, and track service delivery. This shapes the entire backend: search is over a *known* small-to-medium catalog (hundreds, not millions, of workers), order flow has a human-in-the-loop confirmation step, and inventory (worker availability) is single-tenant Mawared-managed.

## 3. Users & personas

### 3.1 Customer (Android app)
Arabic-speaking adult in Saudi Arabia / GCC. Wants to hire a domestic worker (maid, driver, caregiver, nanny) for hourly or monthly service. Typically not technical, uses phone-OTP to sign in, expects fast Arabic UI, pays with Stripe-supported cards.

### 3.2 Mawared Staff / Operator (admin dashboard)
Office staff at a Mawared branch. Manages customer accounts, uploads/edits worker CVs, processes orders, generates contracts, handles payments and refunds, answers inbound questions.

### 3.3 Branch Manager (admin dashboard)
Manager of a specific branch. Same powers as Staff but scoped to their branch + read access to branch-level reports.

### 3.4 Super Admin (admin dashboard)
Full system access. Manages staff accounts, branches, service catalog, pricing, promo codes, system-wide reports.

### 3.5 Public visitor (marketing website)
Browses brand info, submits a contact/lead form. No auth, no account.

## 4. In-scope (v1 — first production release)

### 4.1 Customer-facing (Android app via API)
- Phone-OTP signup and login with JWT (access + rotated refresh).
- Profile management: name, photo, default language, saved addresses, notification preferences.
- Browse and search workers with filters (profession, nationality, language, salary range, age, experience) and sort (price, rating, newest).
- View worker detail (photo, bio, skills, languages, salary, availability).
- Save/unsave workers to a favorites list.
- Browse service catalog and packages (hourly/monthly tiers).
- View active offers / promo codes.
- Place an order: pick worker → pick package → pick address → apply promo → pay with Stripe.
- 15-minute worker reservation hold during checkout.
- Order tracking with status timeline (10-state lifecycle) and push notifications on every status change.
- View active and historical contracts with PDF download.
- View payment history and receipts.
- View Mawared branches with phone, hours, map coordinates.
- In-app notification center.
- FCM device-token registration and management.
- Soft-delete account flow (PDPL-style data removal).

### 4.2 Admin dashboard
- Staff/manager/super-admin login with email + password + TOTP 2FA.
- Customer management: list, search, view detail, edit, suspend, delete.
- Worker (CV) management: create, edit, upload photo and supporting documents, set availability, archive.
- Service & package catalog: create, edit, deprecate.
- Order management: list with filters, view detail, transition status (with audit), assign worker manually, cancel, refund.
- Contract management: generate PDF on confirmation, regenerate, void.
- Payments: list, view, manual refund, reconcile with Stripe.
- Promo codes: create, edit, deactivate; usage report.
- Branch management.
- Reports: revenue, orders by status, top workers, refund rate, customer cohorts.
- Staff/role management (super-admin only).
- Audit log viewer.

### 4.3 Marketing website
- Contact / lead form (POST endpoint, rate-limited, no auth).
- Optional: public worker catalog preview (read-only, anonymous), for SEO. Out of scope for v1 backend unless explicitly added.

### 4.4 Cross-cutting platform features
- Arabic-first content with English fallback (JSON `{ar, en}` for labels/descriptions).
- Multi-currency money handling (SAR primary; SDK ready for AED/KWD/BHD/QAR/OMR).
- Idempotent write endpoints (Stripe-style `Idempotency-Key` header).
- Structured error responses (RFC 7807 problem+json).
- Request-ID correlation across every log line and downstream call.
- Soft-delete with auditable history on customers, workers, orders, contracts.
- Full audit log on every state-changing admin action.
- Rate limiting per IP, per phone, per user, per endpoint family.

## 5. Out of scope (v1)

These are deliberately deferred. We design schemas and abstractions so they slot in later without rewrites.

- **Saudi government integrations**: Musaned, Nafath, ZATCA e-invoicing — explicitly excluded by stakeholder. Will be added when expanding regulated operations.
- **Mada / STC Pay / Tamara / Tabby payment rails**: skipped in favor of Stripe-only for speed. Re-evaluate before Saudi-only launch (Stripe does **not** support Mada — flagged risk).
- **Multi-tenant SaaS** (selling the platform to other agencies).
- **Agency portal** — Mawared staff own all CV uploads.
- **AI / vector search** for worker matching.
- **Real-time customer-support chat** — phone + WhatsApp Business via deep-link for v1; in-app chat is v2.
- **Multi-language beyond ar/en** (Urdu, Tagalog) — schema supports it, content does not.
- **Web app for customers** — Android only for v1.
- **iOS app** — Android-first per existing stakeholder direction.
- **Web push** — only FCM Android push.
- **Server-side B2B invoicing** with corporate accounts.
- **Wallet / store credit** — refunds go back to original payment method only.

## 6. Non-functional requirements

| Concern | v1 target | Notes |
|---|---|---|
| Availability | 99.5% (≈3.6h/mo downtime) | Single-region Railway. Higher SLO comes with AWS migration. |
| API p95 latency | < 400ms for reads, < 800ms for writes | Excludes Stripe / Twilio third-party time. |
| OTP send latency | < 5s end-to-end | Twilio SLA + our queue time. |
| Push notification latency | < 30s after status change | FCM-dependent. |
| Concurrent users | 1,000 — over-engineered headroom for MVP | We architect for 10× this. |
| Daily orders | 500 | We architect for 5,000. |
| Worker catalog size | < 5,000 | Postgres-native search sufficient. |
| Data residency | None mandated for v1 | PDPL adds Saudi residency requirements when we re-add Saudi-specific flows. |
| Backup RPO | 24h | Daily Postgres snapshot + nightly `pg_dump` to R2. |
| Backup RTO | 4h | Quarterly restore drill required. |
| Security | OWASP ASVS Level 2 baseline | TLS only, secret rotation, secrets never in logs, PII redaction in Pino. |

## 7. KPIs we instrument from day 1

These metrics get dashboards and Sentry/Pino tags so we can measure product health, not just system health.

**Business**
- Daily / weekly / monthly active customers
- Order conversion rate (worker view → reservation → payment success)
- Promo code redemption rate
- Refund rate (count + total amount)
- Repeat-order rate per customer (30d / 90d)
- Average order value, by service category and currency

**Operational**
- Mean time from order placement → contract issued
- Worker utilization (% available workers booked at least once in the last 30d)
- Staff productivity (orders processed per staff per day)

**System**
- API error rate by endpoint and status family (4xx/5xx)
- Stripe webhook processing lag p95
- BullMQ job failure rate by queue
- Active sessions, OTP send rate, OTP success rate
- DB connection pool utilization, slow-query count

## 8. User stories (high-value cuts)

These are not exhaustive — they're the cuts the backend must explicitly enable. Each maps to an API surface defined in `02-ARCHITECTURE.md`.

### Customer
1. As a customer, I can sign in with my phone number so I don't have to remember a password.
2. As a customer, I can search workers by profession, nationality, and budget so I find the right person fast.
3. As a customer, when I tap "Reserve", the worker becomes unavailable to other customers for 15 minutes so I don't lose them while paying.
4. As a customer, I can apply a promo code at checkout and see the discount before paying.
5. As a customer, I receive a push notification within 30 seconds of every order status change.
6. As a customer, I can download my contract as a PDF.
7. As a customer, I can delete my account and all my personal data is purged or anonymized within 30 days.

### Staff
1. As staff, I can upload a new worker CV with photo, bio, and skills in one form, in under 60 seconds.
2. As staff, I can search/filter the order queue by status, branch, date range, customer phone.
3. As staff, I can transition an order to "Confirmed" only if payment is captured — the system enforces this, not me.
4. As staff, when I issue a refund, the customer is notified and the contract is voided in a single action.
5. As staff, I can see exactly what each customer paid, when, and what method (last 4 digits of card).

### Branch Manager
1. As a branch manager, my dashboard defaults to my branch only.
2. As a branch manager, I can see my branch's revenue, order count, and refund rate for any date range.

### Super Admin
1. As a super admin, I can create a new staff account, assign role and branch, and reset their password.
2. As a super admin, I can deactivate a promo code instantly and any in-flight checkout using it fails gracefully.
3. As a super admin, I can see the full audit log of any sensitive action with actor, target, before/after diff, and timestamp.

## 9. Milestones (linked to `04-ROADMAP.md`)

| Milestone | Headline outcome | Approx. duration (2 backend devs) |
|---|---|---|
| **M0 — Foundations** | Repo scaffolded, CI green, Railway envs live, healthcheck passes | 1 week |
| **M1 — Auth & catalog** | Customer can sign in via OTP, browse workers, view detail | 2 weeks |
| **M2 — Orders & payments** | End-to-end booking flow with Stripe and FCM push | 3 weeks |
| **M3 — Admin dashboard backend** | Staff can manage everything; RBAC enforced | 2 weeks |
| **M4 — Polish & hardening** | Reports, audit log UI, observability dashboards, load tests | 2 weeks |
| **M5 — AWS migration** | Same system, running on ECS Fargate + RDS, no behavior change | 1 week (post-launch) |

Total runway to launch: **~10 weeks of engineering**, parallelizable with Android polish.

## 10. Open questions to track

These are flagged in the doc set but not yet decided. They block specific deliverables, not the overall plan.

1. **Mada support reconsideration before Saudi launch.** Stripe will leave Mada-only cardholders unable to pay. Decision needed before paid marketing turns on.
2. **Identity verification on first contract.** Skipped for v1; we should add a lightweight ID-photo upload + manual review by staff before customers can sign their first contract. Out of scope for v1 but reserved in schema.
3. **WhatsApp Business for transactional notifications.** FCM push only for v1; WhatsApp opt-in for order status is cheap to add later via a `NotificationChannel` abstraction.
4. **Contract PDF templating tooling.** `pdfkit` vs Puppeteer-HTML-to-PDF — decided in `02-ARCHITECTURE`, but template content (legal language, signatures) needs business sign-off.
5. **Revenue recognition / VAT handling.** v1 stores `vat_amount_minor` on each order line but doesn't compute it dynamically — flat 15% configured for KSA. Multi-jurisdiction VAT is post-MVP.

---
**Next**: read [02-ARCHITECTURE.md](./02-ARCHITECTURE.md).
