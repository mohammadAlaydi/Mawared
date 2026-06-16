# Mawared — QA Test Plan (PRD for Testing)

> What to test, how to test it, and how to know it passed — for the Mawared platform
> (marketing website + admin dashboard + backend API).

**Status:** Ready for QA
**Owner:** QA lead
**Last updated:** 2026-06-15
**Applies to commit:** `eedebc0` (branch `main`) and later

---

## 1. Purpose & scope

This document tells the testing team **exactly what to test**. It covers the full platform plus
the areas changed in the latest release. Use it to plan test runs, write test cases in your tracker,
and sign off a build.

**In scope**
- **Marketing website** (`website-next`) — public Arabic single-page site.
- **Admin dashboard** (`admin-dashboard`) — staff operations console.
- **Backend API** (`apps/backend`) — the system of record that both apps call.

**Out of scope (do not test in this cycle)**
- Android customer app (not part of this build).
- Live Stripe payments, Twilio SMS OTP, Signit national-ID, FCM push, Cloudflare R2 uploads —
  these integrations are **not configured in the test environment** (see §10).

**What changed in this release (focus regression here — §8):**
1. **Branding** — new official colors, fonts (Alexandria/Manrope/Glancyr), and logos on both apps.
2. **Responsiveness** — every page reworked for mobile→desktop.
3. **Drive imagery** — real brand photos/banners on the website.
4. **Rate limiting** — relaxed so normal use no longer triggers "too many requests".
5. **Money display fix** — worker/order/payment lists previously failed to load; now fixed.
6. **Notifications bell** — new live activity feed in the dashboard header.

---

## 2. Test environment & access

| Item | Value |
|---|---|
| Marketing website | http://localhost:3102 |
| Admin dashboard | http://localhost:3101 (login: http://localhost:3101/login) |
| Backend API | http://localhost:3100 |
| Admin login | **Email:** `admin@mawared.local` **Password:** `ChangeMe!2026` |
| Language / direction | Arabic, **RTL** (right-to-left) |

> Ports 3100–3102 are the **local test ports**. In a normal deploy the API is `:3000`, dashboard `:3001`,
> website `:3000`. Confirm the actual URLs with the dev team for your environment.

**Seed data available for testing**
- 1 branch: *فرع الرياض الرئيسي (RUH-01)*
- 1 super-admin (the login above)
- 4 nationalities (🇵🇭 الفلبين, 🇪🇹 إثيوبيا, 🇰🇪 كينيا, 🇧🇩 بنغلاديش)
- 1 service (*عاملة منزلية — شهري*) + 1 package (*الباقة الشهرية الأساسية*)
- 2 workers: *مارتا بيكيلي* (Ethiopia, متعاقد/BOOKED) and *ماريا سانتوس* (Philippines, متاح/AVAILABLE)
- 0 orders, 0 customers initially (you will create these during testing)
- ≥1 lead notification (visible in the bell)

**Browsers & devices to cover**
- Desktop: Chrome, Firefox, Safari (latest).
- Mobile: real or emulated iOS Safari + Android Chrome.
- Responsive widths to verify: **320, 375, 768, 1024, 1440, 1920 px**.

---

## 3. How to start the system (if not already running)

From the repo root:
```
pnpm infra:up            # Postgres + Redis + Mailhog (Docker)
pnpm backend:migrate     # apply DB migrations
pnpm backend:seed        # load the seed data above
pnpm backend:dev         # API
# dashboard + website: run their dev servers (see app READMEs)
```
If any list page shows a persistent spinner or an error, capture it — the backend may not be running
or may need a restart. Note the exact URL + time so devs can match it to logs.

---

## 4. Severity & priority definitions

| Severity | Meaning |
|---|---|
| **S1 – Critical** | Blocks a core flow, data loss, security exposure, page won't load, login broken. |
| **S2 – High** | Major feature broken or wrong; bad layout breaking usability on a supported screen. |
| **S3 – Medium** | Noticeable but with a workaround; minor layout/branding deviation. |
| **S4 – Low** | Cosmetic, copy, polish. |

Mark each test **Pass / Fail / Blocked** and attach a screenshot for any Fail.

---

## 5. Cross-cutting checks (apply to EVERY screen)

| ID | Check | Expected | Sev |
|---|---|---|---|
| X-01 | **No horizontal scroll** at 320/375/768/1024/1440/1920 | Page never scrolls sideways; nothing clipped off-screen | S2 |
| X-02 | **RTL correctness** | Text right-aligned; icons/arrows/chevrons mirrored; layout flows right→left | S2 |
| X-03 | **Brand fonts** | Arabic renders in **Alexandria** (not the old Cairo or a system serif) | S3 |
| X-04 | **Brand colors only** | Blues = Royal `#2D5BE4` / Sky `#6599FE` / Navy `#0F234C`; gold `#ECA423`; green `#5DF285`. **No teal/green-teal or old palette** anywhere | S3 |
| X-05 | **Logo** | Clean "موارد" wordmark/badge; **no** image with a design caption baked in; sharp at all sizes | S2 |
| X-06 | **Favicon** | Blue Mawared badge shows in the browser tab | S4 |
| X-07 | **Tap targets** | Buttons/links ≥ ~40px on mobile; easy to tap | S3 |
| X-08 | **Loading & empty states** | Spinners/skeletons appear briefly; empty lists show a friendly message (not a blank or error) | S3 |
| X-09 | **No console errors** | Browser devtools console shows no red errors during normal use | S3 |

---

## 6. Admin dashboard — test suites

### 6.1 Authentication
| ID | Steps | Expected | Sev |
|---|---|---|---|
| A-01 | Open `/login` | Two-panel login (brand panel + form); **logo shown**; blue brand gradient | S2 |
| A-02 | Submit empty / invalid email | Inline validation; no crash | S2 |
| A-03 | Wrong password ×N | Friendly error; after several rapid attempts the **auth limit** triggers a calm "try again later" (login is intentionally strictly limited) | S2 |
| A-04 | Correct credentials (`admin@mawared.local` / `ChangeMe!2026`) | Redirects to `/dashboard` | S1 |
| A-05 | Refresh after login | Stays logged in (session persists) | S2 |
| A-06 | Visit `/dashboard/*` while logged out | Redirected to `/login` | S1 |
| A-07 | Logout (sidebar) | Returns to login; protected pages no longer accessible | S2 |
| A-08 | Login on a 375px screen | Layout collapses to single column, no overflow, logo visible | S2 |

### 6.2 Dashboard shell, navigation & branding
| ID | Steps | Expected | Sev |
|---|---|---|---|
| N-01 | View sidebar (desktop ≥1024) | Navy sidebar, blue gradient "م" badge, all 9 nav items, active item highlighted blue | S2 |
| N-02 | Collapse/expand sidebar (toggle) | Sidebar narrows to icons-only and back; content reflows | S3 |
| N-03 | **Mobile drawer** (≤768): tap hamburger in header | Sidebar **slides in from the right** with a dark backdrop | S1 |
| N-04 | Tap backdrop or a nav item or the X | Drawer closes; tapping a nav item also navigates | S2 |
| N-05 | Navigate to each page via sidebar | All 9 pages load; active highlight follows; page title in header updates | S2 |
| N-06 | Header on mobile | Hamburger visible; search hidden on the smallest screens; avatar/bell don't overflow | S3 |

### 6.3 Notifications bell (NEW)
| ID | Steps | Expected | Sev |
|---|---|---|---|
| B-01 | Look at the bell in the header | Shows an **unread count badge** if there are notifications (seed has ≥1 lead) | S2 |
| B-02 | Click the bell | Dropdown opens listing real activity (e.g. *استفسار جديد من الموقع*) with name + phone/email | S2 |
| B-03 | Click "تعليم الكل كمقروء" | Unread badge clears; items marked read | S3 |
| B-04 | Click a notification with a link | Navigates to the related record; dropdown closes | S3 |
| B-05 | Click outside / press Esc | Dropdown closes | S3 |
| B-06 | If the feed can't load | Shows a calm error with a retry button — **not** a crash or infinite spinner | S2 |

### 6.4 الاستقطاب / Recruitment — Workers (إدارة العمالة) — CORE
| ID | Steps | Expected | Sev |
|---|---|---|---|
| W-01 | Open `/dashboard/workers` | Table loads the seeded workers; **salary shows formatted (e.g. ١٬٨٠٠ ريال)** — must NOT hang on "جاري التحميل" or error | S1 |
| W-02 | Filter by nationality / profession / availability | List filters correctly | S2 |
| W-03 | Search by name | Matching workers shown | S2 |
| W-04 | Click "إضافة عامل جديد" | Modal opens with branch, nationality, name (ar/en), profession, availability, age, experience, salary, bio | S2 |
| W-05 | Submit with required fields blank | Validation blocks submit; clear messages | S2 |
| W-06 | Create a valid worker | Success toast "تم إضافة العامل بنجاح"; worker appears in the list with correct data & salary formatting | S1 |
| W-07 | Edit a worker | Changes save and reflect in the list | S2 |
| W-08 | Delete/archive a worker | Removed from the active list (soft delete) | S2 |
| W-09 | Open a worker detail page | Profile renders; two-column on desktop, single column on mobile | S2 |
| W-10 | Workers table at 375px | Wraps in a horizontal scroll / reduces columns — page itself does not overflow | S2 |

### 6.5 Orders (إدارة الطلبات) — order lifecycle
> Orders are normally created by customers; in this environment there are 0 orders and customer
> order creation needs Stripe/SMS (not configured). Test what the dashboard exposes; if the dev team
> seeds a test order, verify the state transitions below.

| ID | Steps | Expected | Sev |
|---|---|---|---|
| O-01 | Open `/dashboard/orders` | Loads (empty state "لا توجد طلبات بعد" is acceptable); **no error/hang** | S1 |
| O-02 | Status filter dropdown | Lists the 11 statuses (مسودة, محجوز, بانتظار الدفع, فشل الدفع, تم الدفع, قيد المراجعة, مؤكد, جاري التنفيذ, مكتمل, ملغي, مسترد) | S3 |
| O-03 | "تصدير Excel" | Triggers an export (or a clear "no data" if empty) | S3 |
| O-04 *(if a test order exists)* | Open order detail | Customer, worker, amount, status timeline render | S2 |
| O-05 *(if a test order exists)* | Move order through states (review → confirm → in-progress → complete) | Each allowed transition succeeds; illegal transitions are blocked; status badge updates | S1 |
| O-06 *(if a test order exists)* | Cancel a paid order | Triggers refund path; status → ملغي/مسترد | S2 |
| O-07 | Orders table at 375px | Horizontal scroll, no page overflow | S2 |

### 6.6 Other dashboard pages
| ID | Page | Checks | Sev |
|---|---|---|---|
| P-01 | Home `/dashboard` | KPI cards show real numbers (e.g. *عمال متاحون ١ من أصل ٢*, top nationality 🇪🇹); cards stack 1-col on mobile, 4-col on desktop | S2 |
| P-02 | العملاء (customers) | Loads (empty OK); create/list customers; table scrolls on mobile | S2 |
| P-03 | الخدمات (services) | Shows the seeded service; add/edit works | S2 |
| P-04 | الباقات (packages) | Shows the seeded package with price/VAT; add/edit works | S2 |
| P-05 | المدفوعات (payments) | Loads (read-only Stripe view; empty OK); **no money-formatting error** | S2 |
| P-06 | التقارير (reports) | Revenue/series widgets load (zeros OK); charts/cards stack on mobile | S2 |
| P-07 | الإعدادات (settings) | Roles & permissions render; cards single-column on mobile | S3 |

### 6.7 Rate limiting (NEW behaviour)
| ID | Steps | Expected | Sev |
|---|---|---|---|
| R-01 | Navigate the dashboard normally for several minutes (open many pages, refresh) | **Never** see a "too many requests / 429 / rate limited" message during ordinary use | S1 |
| R-02 | Rapidly hammer one list (refresh repeatedly very fast, dozens of times) | App degrades gracefully (brief backoff/retry) rather than showing aggressive error spam; recovers on its own | S2 |
| R-03 | Repeated **failed logins** in quick succession | Auth still gets limited (this is intentional — login is the protected surface) | S2 |

---

## 7. Marketing website — test suites

The site is a single Arabic page with sections. Test each section + the global nav/footer.

| ID | Area | Checks | Sev |
|---|---|---|---|
| M-01 | **Navbar** | Clean logo; links scroll to sections; turns to a glass/solid bar on scroll; **mobile hamburger** opens a working menu | S2 |
| M-02 | **Hero** | Auto-rotating **slider** of the real brand banners; dots work; uses taller mobile banner images on small screens; app-store CTA buttons present; no duplicated text over the banners | S2 |
| M-03 | **Services (خدماتنا)** | Four cards with the real worker photos (instant / mediation / resident / hourly); grid 1→2→4 columns by width | S2 |
| M-04 | **How it works** | Steps render; stack on mobile; connectors don't overflow | S3 |
| M-05 | **About (من نحن)** | Real about image; text + image side-by-side on desktop, stacked on mobile | S3 |
| M-06 | **Stats** | Numbers render with tabular alignment; responsive grid | S3 |
| M-07 | **Pricing** | Cards stack on mobile; featured plan highlighted; brand colors | S3 |
| M-08 | **FAQ** | Accordion expands/collapses; full-width comfortable tap targets on mobile | S3 |
| M-09 | **Testimonials** | Cards/carousel scroll without page overflow on mobile | S3 |
| M-10 | **Contact** | Form fields full-width on mobile, 2-col on desktop; blue focus rings; validation | S3 |
| M-11 | **CTA / Download** | Brand banner; app-store buttons | S3 |
| M-12 | **Footer** | White logo on the dark navy footer; columns stack on mobile; links present | S3 |
| M-13 | **WhatsApp button** | Floating button visible, doesn't cover content, opens WhatsApp | S3 |
| M-14 | **Full page** | Run through all widths in §5 — **zero horizontal overflow**, brand-consistent throughout | S2 |

---

## 8. Regression focus (this release)

Spend extra time here — these are the things that changed:

1. **Money display** (was broken): every list with an amount — Workers (salary), Orders (total),
   Payments, Packages (price), Reports (revenue) — must **load and show formatted SAR**. A page stuck
   on "جاري التحميل" or showing an error is an **S1 regression**.
2. **Responsiveness**: re-check every dashboard page and website section at 320 & 375px for overflow,
   the **mobile sidebar drawer**, and table horizontal-scroll.
3. **Branding**: confirm fonts (Alexandria), the 5 official colors, and the new logos everywhere; no
   leftover teal/old-blue.
4. **Rate limiting**: confirm normal browsing never trips a 429 (R-01).
5. **Notifications bell**: new — exercise the full §6.3 suite.
6. **Images from Drive**: confirm the website shows the real brand banners/photos (not placeholders).

---

## 9. Accessibility & quality spot-checks (nice-to-have)
- Keyboard: can you tab to and activate the login form, sidebar items, the bell, and modals?
- Reduced motion: with OS "reduce motion" on, the hero slider / animations shouldn't be jarring.
- Color contrast: white text on blue buttons and navy sidebar should be readable.
- Screen-reader labels exist on icon-only buttons (hamburger = "فتح القائمة", bell = "الإشعارات").

---

## 10. Known limitations / not-bugs in the test environment
- **Payments, SMS OTP, national-ID verification, push, file uploads are not configured** — flows that
  depend on them will stop at the integration boundary. Don't log these as bugs unless the dev team
  says the integration is enabled.
- **Orders/customers start empty** — creating real orders needs the customer app + Stripe. Ask the dev
  team to seed a test order if you need to exercise the order lifecycle (O-04…O-06).
- **Healthcheck path**: `/healthz` may 404; the API is healthy if `/v1/...` endpoints respond.
- The dashboard may surface some pre-existing TypeScript strictness warnings in dev tooling; these do
  not affect the running app.

---

## 11. Bug report template

```
Title:        [Area] Short summary
Severity:     S1 / S2 / S3 / S4
Environment:  Website / Dashboard | URL | Browser+version | Screen width
Build:        commit hash (or date/time tested)
Steps to reproduce:
  1.
  2.
Expected:
Actual:
Evidence:     screenshot / screen recording / console log
Notes:        (network 429? data state? login as which user?)
```

---

## 12. Sign-off criteria
A build is **ready to ship** when:
- All **S1** test cases **Pass** (login, page loads, money displays, mobile drawer, no rate-limit on normal use).
- No open **S1/S2** defects in the regression areas (§8).
- Branding (fonts/colors/logos) and responsiveness verified on at least Chrome desktop + one real mobile device.
- Remaining S3/S4 items are triaged and accepted by the product owner.
