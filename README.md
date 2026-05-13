# موارد الدولية للإستقدام — Mawared International

> شركة موارد الدولية للإستقدام — Mawarid International Company For Recruitment

Full-stack platform for domestic worker recruitment in Saudi Arabia.

📊 **[Project Status](docs/PROJECT_STATUS.md)** — what's done, what's remaining, how to pick up

---

## 📁 Project Structure

```
Mawared/
├── apps/
│   └── backend/              # ⚙️  NestJS API (Postgres, Redis, Stripe, Twilio, FCM)
├── packages/
│   ├── shared-types/         # Error codes, enums shared with clients
│   └── tsconfig/             # Shared TS base configs
├── admin-dashboard/          # 🖥️  Admin dashboard (Next.js)
├── website-next/             # 🌐 Marketing site (Next.js)
├── android/                  # 📱 Android customer app (Kotlin + Compose)
├── brand-assets/             # 🎨 Brand identity assets
├── docs/
│   └── backend/              # 📚 PRD, architecture, schema, ADRs, state machine
├── infra/
│   ├── docker-compose.yml    # Local Postgres + Redis + Mailhog
│   ├── railway.toml          # Railway deployment config
│   └── runbooks/             # On-call + local-dev runbooks
└── .github/workflows/        # CI: lint, typecheck, tests, OpenAPI drift
```

### Backend quick start

```bash
pnpm install
cp apps/backend/.env.example apps/backend/.env
pnpm infra:up                                       # postgres + redis + mailhog
pnpm --filter @mawared/backend prisma migrate dev
pnpm --filter @mawared/backend prisma db seed
pnpm backend:dev                                    # API on :3000
```

Read [`docs/backend/07-IMPLEMENTATION_GUIDE.md`](docs/backend/07-IMPLEMENTATION_GUIDE.md) before contributing.

---

## 📱 Android App

**Stack:** Kotlin · Jetpack Compose · Material Design 3 · MVVM

### Features
- 🏠 **Home** — Service cards, promo carousel, featured workers
- 🔍 **Workers** — Browse & filter by nationality, service type
- 📋 **Contracts** — View active contracts & history
- 🎯 **Offers** — Limited-time offers carousel
- 📍 **Branches** — All offices with maps & call
- 👤 **Profile** — Edit profile, verification, saved addresses
- 🔔 **Notifications** — Real-time alerts
- 📦 **Orders** — Full order flow with tracking
- ⭐ **Save List** — Save workers for later

### Premium UX
- Spring-physics animations (logo bounce, staggered entrances)
- Parallax scroll on carousels & onboarding
- Worm-style animated dot indicators
- Cubic-eased screen transitions with depth
- Real brand photographs in service cards, banners, and onboarding
- Full RTL Arabic support

### Build & Run
```bash
cd android
# Set JAVA_HOME to Android Studio JBR
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.mawared.dawliah/.MainActivity
```

---

## 🌐 Landing Website

**Stack:** Next.js 14 · Tailwind CSS · Arabic RTL

A marketing landing page for Mawared International, featuring service highlights, contact info, and brand imagery.

---

## 🎨 Brand Assets

The `brand-assets/` folder contains the official brand identity files:
- Logo variations (Arabic calligraphy + icon)
- Brand value diagrams
- Marketing mockups (flags, signage, posters)
- Photography guidelines

---

## 📄 License

Proprietary — © 2026 Mawared International Company For Recruitment
