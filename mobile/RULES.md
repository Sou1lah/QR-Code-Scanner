# AMANE DZ — Project Rules & Developer Guide

Welcome to the AMANE DZ project. This document serves as the single source of truth for new and existing team members. Follow these guidelines to navigate the codebase, adhere to our visual style, run simulations, build standalone APKs, and respect core architectural constraints.

---

## 1. Project Navigation & Architecture

The workspace is organized into web and mobile workspaces:

```
network/
├── mobile/                      # Expo / React Native Android & iOS application
│   ├── app.json                 # Expo app configuration & native plugins
│   ├── assets/                  # App icons, splash screens, brand marks
│   ├── dist/                    # Built standalone APKs (AMANE-DZ-debug.apk)
│   ├── scripts/
│   │   └── build-apk.mjs        # Automated APK compiler & emulator auto-installer
│   └── src/
│       ├── app/                 # Expo Router file-based screens & navigators
│       │   ├── _layout.tsx      # Root layout: ThemeProvider, GlassRoot, BootOverlay
│       │   └── (tabs)/          # Floating Glass tab navigator
│       │       ├── _layout.tsx  # Tabs layout: GlassTabBar, 200ms cross-fade
│       │       ├── index.tsx    # Home screen: Scanner, viewfinder, icon controls
│       │       ├── history.tsx  # History screen: Scan log, audit records, clear all
│       │       └── settings.tsx # Settings screen: Threat engine toggles & Dark Mode
│       ├── context/
│       │   └── AppContext.tsx   # Global state: settings, history, theme (parallel storage)
│       ├── lib/                 # Parsing utilities (parsePayload)
│       ├── services/            # Threat engine API client & mock data
│       ├── types/               # TypeScript interfaces for ScanResult, payload, etc.
│       ├── ui/                  # Liquid Glass Design System
│       │   ├── BootOverlay.tsx  # Reanimated + SVG high-performance boot animation
│       │   ├── Glass.tsx        # Liquid glass sheen, specular highlight, blur surface
│       │   ├── GlassTabBar.tsx  # Floating pill glass tab bar with scaleX indicator
│       │   ├── Screen.tsx       # Safe area screen wrapper
│       │   ├── theme.ts         # Design tokens, color palette, radius, typography
│       │   └── useReducedMotion.ts # Accessibility motion hook
│       └── utils/
│           └── haptics.ts       # Haptic feedback utilities (verdicts, tab taps)
├── logs.md                      # Detailed development activity log & architecture notes
└── RULES.md                     # This file
```

---

## 2. Style Guide & Design System

The application strictly adheres to the **AMANE Liquid Glass** aesthetic.

### Theme Tokens (`src/ui/theme.ts`)
- **Backgrounds**:
  - Dark: `#02030F` (Base) / `#070b14` (Boot overlay & splash)
  - Light: `#F0F4FC` (Base) / `#f3f6fc` (Boot overlay)
- **Brand Accents**:
  - Primary Electric Accent: `#0A84FF`
  - Safe / Success: `#30D158`
  - Warning: `#FF9F0A`
  - Danger / Malicious: `#FF453A`
  - Text: `#F2F5FF` (Dark) / `#0F172A` (Light)
  - Text Muted: `rgba(235, 240, 255, 0.62)` (Dark) / `rgba(71, 85, 105, 0.85)` (Light)
  - Glass Border: `rgba(255, 255, 255, 0.16)` (Dark) / `rgba(0, 0, 0, 0.08)` (Light)

### UI Rules
1. **Viewfinder**:
   - Size: $270 \times 270\text{ px}$, `borderRadius: 28`.
   - Corner brackets must use `borderTopLeftRadius: 28` (and matching corners) with `top: 0, left: 0` so brackets follow the card's curvature seamlessly.
   - Laser line sweeps continuously via Reanimated UI-thread ping-pong; never halt abruptly; render only when `cameraIsOpen && !resultOpen`.
   - Center QR watermark guide is displayed when camera is active.
2. **Scanner Controls**:
   - Only two circular glass buttons ($54 \times 54\text{ px}$, radius 27) centered together: **Light** and **Image**.
   - No text labels on scanner controls.
   - Close Cam button is removed; "OPEN CAMERA" blue pill button is centered inside the viewfinder when paused.
3. **Theme Toggle**:
   - **Do NOT** place a dark/light mode toggle on the Home screen header.
   - Theme toggle lives exclusively in the **Settings** tab.
4. **Active Tab Indicator**:
   - Independent $26 \times 3\text{ px}$ pill (`borderRadius: 1.5`, `marginBottom: 4`) with `alignSelf: 'center'` positioned directly above the tab icon.
   - Animated with `scaleX` and opacity ($0 \rightarrow 1$).
5. **Animations**:
   - Always run on the UI thread (`useSharedValue`, `useAnimatedStyle`, `withSpring`, `withTiming`).
   - Never use JS-thread `setInterval` or non-native animations.
   - Respect `useReducedMotion()`.

---

## 3. How to Run Simulation (Android Emulator)

### Prerequisites
- Android SDK installed (`$ANDROID_HOME` or `~/Android/Sdk`).
- Android emulator running (e.g. `emulator-5554`).

### Checking Connected Devices
```bash
$ANDROID_HOME/platform-tools/adb devices
```

### Launching the App on Emulator
To start or bring the installed app to the foreground:
```bash
$ANDROID_HOME/platform-tools/adb shell am start -n dz.amane.app/.MainActivity
```

To take a screenshot of the simulation:
```bash
$ANDROID_HOME/platform-tools/adb exec-out screencap -p > screenshot.png
```

### Starting the Expo Development Server
If developing interactively with live reload:
```bash
cd mobile
npm start
# Press 'a' in the terminal to connect to the Android emulator
```

---

## 4. How to Build the App & Create `.apk`

The project includes a single automated command to prebuild, compile, package, and auto-install a standalone Android debug APK.

### Build Command
```bash
cd mobile
npm run apk
```

### What `npm run apk` Does Under the Hood:
1. **Prebuild**: Runs `expo prebuild --platform android` to update native Android project files from `app.json`.
2. **Bundle Injection**: Configures `debuggableVariants = []` in `android/app/build.gradle` so Metro bundles JavaScript and assets directly into the APK for standalone offline execution.
3. **Gradle Compilation**: Runs `./gradlew assembleDebug` targeting `arm64-v8a`, `armeabi-v7a`, and `x86_64`.
4. **Output APK**: Copies the final APK to:
   ```
   mobile/dist/AMANE-DZ-debug.apk
   ```
5. **Auto-Installation**: If an emulator or physical device is detected via `adb devices`, the script automatically executes:
   ```bash
   adb install -r mobile/dist/AMANE-DZ-debug.apk
   ```
   This updates the launcher icon and app on your device immediately.

---

## 5. General Development & Safety Rules

1. **Never set `"cameraPermission": false` on plugins**:
   - Setting `"cameraPermission": false` on secondary plugins (such as `expo-image-picker`) causes Expo to insert `tools:node="remove"` for `android.permission.CAMERA` into the merged Android Manifest. This completely breaks camera access.
2. **Always refresh camera permissions on foreground**:
   - Always call `getPermission()` inside an `AppState` listener (`nextState === 'active'`) so returning from system settings instantly re-activates the camera.
3. **Zero Startup Blocking**:
   - Boot overlay mounts with zero data dependencies and immediately hides the native splash (`SplashScreen.hideAsync()`).
   - App data (`AppContext`) restores settings, history, and theme in parallel using `Promise.all`.
   - Never block initial render on secondary fetches or network calls.
4. **Preserve Tab State & Memoize Screens**:
   - Wrap tab screen components with `React.memo` (e.g. `export default memo(ScannerScreen)`).
   - In `(tabs)/_layout.tsx`, keep `detachInactiveScreens={false}` and `freezeOnBlur={true}` so screen state is never destroyed when switching tabs.
5. **Always Typecheck**:
   - Run `npm run typecheck` (`tsc --noEmit`) before declaring any task complete. No TypeScript errors are permitted in commits.
6. **Maintain `logs.md`**:
   - Document every meaningful architecture, UI, and performance change in `logs.md`.
