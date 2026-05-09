# موارد الدولية للإستقدام — Mawared International

> شركة موارد الدولية للإستقدام — Mawarid International Company For Recruitment

Full-stack platform for domestic worker recruitment in Saudi Arabia.

---

## 📁 Project Structure

```
Mawared/
├── android/                  # 📱 Android APK (Kotlin + Jetpack Compose)
│   ├── app/
│   │   └── src/main/
│   │       ├── kotlin/com/mawared/dawliah/
│   │       │   ├── data/          # Models & mock data
│   │       │   ├── ui/
│   │       │   │   ├── components/  # Reusable UI components
│   │       │   │   ├── navigation/  # NavGraph & Screen routes
│   │       │   │   ├── screens/     # All app screens
│   │       │   │   └── theme/       # Colors, typography, shapes
│   │       │   └── viewmodel/       # ViewModels (MVVM)
│   │       └── res/
│   │           ├── drawable/        # App images (used in-app)
│   │           ├── mipmap-*/        # App launcher icons
│   │           └── values/          # XML configs
│   ├── build.gradle.kts
│   └── AndroidCommands.md          # Build & deploy commands
│
├── website-next/             # 🌐 Landing Website (Next.js)
│   ├── src/app/                    # App router pages
│   └── public/images/              # Website images
│
├── brand-assets/             # 🎨 Brand Identity Assets
│   ├── logo_asset_*.jpeg           # Logo variations & mockups
│   └── logo_page_*.png             # Brand guideline pages
│
└── README.md
```

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
