# AMANE DZ — Engineering & UI Modification Log

**Last Modified:** November 18, 2026 (06:56 CET)
**Project:** AMANE DZ QR Security Scanner (React Native / Expo 58)

---

## 1. Summary of Changes

### A. Camera Permissions & Android System Dimming Fix

- **Problem:** Camera permission toggle on physical Android devices was dimmed/disabled in system settings and denied inside the app.
- **Root Cause:** In `mobile/app.json`, `"expo-image-picker"` had `"cameraPermission": false`. During `expo prebuild`, Expo injected `<uses-permission android:name="android.permission.CAMERA" tools:node="remove"/>` into the Android manifest. This stripped the permission entirely from the merged Android APK manifest.
- **Solution:**
  - Removed `"cameraPermission": false` from `expo-image-picker` plugin configuration in [app.json](file:///home/wael/Projects/5+5/network/mobile/app.json).
  - Explicitly restored `<uses-permission android:name="android.permission.CAMERA"/>` and hardware camera features in [AndroidManifest.xml](file:///home/wael/Projects/5+5/network/mobile/android/app/src/main/AndroidManifest.xml).
  - Updated [PermissionCard](file:///home/wael/Projects/5+5/network/mobile/src/ui/components.tsx) to provide two clickable buttons: **Allow Camera** (`requestPermission`) and **Open Phone Settings** (`Linking.openSettings()`).
  - Added an `AppState` listener in [index.tsx](<file:///home/wael/Projects/5+5/network/mobile/src/app/(tabs)/index.tsx>) to automatically call `getPermission()` whenever the user returns to the app from Android Settings.

### B. Navigation Bar Transitions & Button Redesign

- **Problem:** Tab bar buttons had clunky square-rounded container boxes around the icons, and active tab switching felt instant without animation.
- **Solution:**
  - Removed `pillActiveBackground` (the boxy container enclosing tab icons) from [GlassTabBar.tsx](file:///home/wael/Projects/5+5/network/mobile/src/ui/GlassTabBar.tsx).
  - Implemented an animated sliding indicator pill at the top edge of the tab bar that smoothly glides horizontally between tabs using `duration: 260` and `Easing.out(Easing.cubic)`, matching the page route transitions in `_layout.tsx`.
  - Added smooth icon scale interpolation (`1.0` -> `1.14`) and opacity interpolation (`0.5` -> `1.0`) on active tab focus.

### C. Replaced "QR SAFETY SCANNER" with Dark / Light Mode Toggle

- **Problem:** Scanner screen header displayed an informational badge chip (`QR SAFETY SCANNER`) instead of an interactive theme switcher.
- **Solution:**
  - Replaced the badge in [index.tsx](<file:///home/wael/Projects/5+5/network/mobile/src/app/(tabs)/index.tsx>) with an interactive glass theme button displaying the current mode icon (`moon` / `sunny`) and label (`Dark` / `Light`).
  - Connected the toggle to `useAppState().toggleTheme()` and persisted state to `AsyncStorage` under `amane-theme`.
  - Added a matching theme toggle row inside [settings.tsx](<file:///home/wael/Projects/5+5/network/mobile/src/app/(tabs)/settings.tsx>).
  - Updated [Glass.tsx](file:///home/wael/Projects/5+5/network/mobile/src/ui/Glass.tsx), [GlassTabBar.tsx](file:///home/wael/Projects/5+5/network/mobile/src/ui/GlassTabBar.tsx), [AppText.tsx](file:///home/wael/Projects/5+5/network/mobile/src/ui/AppText.tsx), and [_layout.tsx](file:///home/wael/Projects/5+5/network/mobile/src/app/_layout.tsx) to adapt background, card tints, borders, text colors, and `StatusBar` dynamically.

### D. Demo Mode Disabled by Default & Official Inspection Engine

- **Problem:** The app defaulted to demo mode, cluttering the scanner UI with sample payload buttons and returning mock demo strings even on real QR codes.
- **Solution:**
  - In [AppContext.tsx](file:///home/wael/Projects/5+5/network/mobile/src/context/AppContext.tsx), set `demoMode: false` by default. Added an `explicit` flag check when restoring from `AsyncStorage` so existing installs do not stay trapped in demo mode.
  - When `demoMode` is `false`, sample payload buttons are hidden on the scanner screen.
  - In [api.ts](file:///home/wael/Projects/5+5/network/mobile/src/services/api.ts), implemented an on-device heuristic security engine (`analyzePayloadLocally`) that evaluates URL protocols, raw IP addresses, shorteners, phishing keywords, and Wi-Fi configurations without requiring a remote server or falling back to static mock data.

### E. Launch Time Optimization

- **Problem:** The app had a noticeable delay on cold start due to a full-screen loading spinner blocking route rendering until `AsyncStorage` calls resolved.
- **Solution:**
  - Removed the blocking `if (!ready)` spinner in [_layout.tsx](file:///home/wael/Projects/5+5/network/mobile/src/app/_layout.tsx).
  - Initialized default application state synchronously in [AppContext.tsx](file:///home/wael/Projects/5+5/network/mobile/src/context/AppContext.tsx) and hydrated persistent data in the background with a `hasLoaded` reference safeguard, making initial screen rendering instantaneous.

### F. Confined Camera View & Camera Close Toggle

- **Problem:** The camera view covered the entire screen background (`StyleSheet.absoluteFill`), making the whole app background show the camera feed behind all glass components.
- **Solution:**
  - Placed the `CameraView` strictly inside the 260x260 rounded `viewfinder` frame in [index.tsx](<file:///home/wael/Projects/5+5/network/mobile/src/app/(tabs)/index.tsx>). The main app background now preserves its clean glass gradient.
  - Added a camera state toggle (`cameraEnabled`) with a dedicated **Close Cam / Open Cam** button in the controls.
  - When closed/paused, the camera sensor is unmounted and the viewfinder displays a sleek paused card with a "Resume Camera" action.

### G. Animated Scanning Laser on QR Code Frame

- **Problem:** The scanner frame had a static, unmoving horizontal line.
- **Solution:**
  - Implemented a continuous looping vertical scanning laser in [index.tsx](<file:///home/wael/Projects/5+5/network/mobile/src/app/(tabs)/index.tsx>) using `Animated.loop` with `Easing.inOut(Easing.quad)` over a 2000ms duration.
  - Styled with a radiant cyan/electric blue laser beam and vertical glow diffusion.

### H. Complete Light Mode Contrast Resolution (No White Text on White)

- **Problem:** In light mode, several screens and the result modal rendered white text on light backgrounds because `colors.text` and `colors.muted` were statically hardcoded.
- **Solution:**
  - Updated [AppText.tsx](file:///home/wael/Projects/5+5/network/mobile/src/ui/AppText.tsx) to dynamically resolve `#0F172A` (dark) and `rgba(71,85,105,0.88)` (muted) whenever light mode is active.
  - Converted raw `<Text>` in the Result Modal, History screen, and Settings screen to `<AppText>`.
  - Removed static white colors from style sheets in [index.tsx](<file:///home/wael/Projects/5+5/network/mobile/src/app/(tabs)/index.tsx>), [history.tsx](<file:///home/wael/Projects/5+5/network/mobile/src/app/(tabs)/history.tsx>), and [settings.tsx](<file:///home/wael/Projects/5+5/network/mobile/src/app/(tabs)/settings.tsx>).
  - Added `buttonLight` and `secondaryButtonLight` in [components.tsx](file:///home/wael/Projects/5+5/network/mobile/src/ui/components.tsx) for crisp, accessible button contrast.

---

## 2. Modified Files

| File                                                                                                                                      | Changes Made                                                                                                                           |
| :---------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| [mobile/app.json](file:///home/wael/Projects/5+5/network/mobile/app.json)                                                                 | Removed `"cameraPermission": false` from `expo-image-picker`; set `userInterfaceStyle` to `"automatic"`.                               |
| [mobile/android/app/src/main/AndroidManifest.xml](file:///home/wael/Projects/5+5/network/mobile/android/app/src/main/AndroidManifest.xml) | Replaced `tools:node="remove"` with proper `<uses-permission android:name="android.permission.CAMERA"/>` and camera hardware features. |
| [mobile/src/context/AppContext.tsx](file:///home/wael/Projects/5+5/network/mobile/src/context/AppContext.tsx)                             | `demoMode: false` default; `isDark` state and `toggleTheme` method; persisted theme in AsyncStorage.                                   |
| [mobile/src/services/api.ts](file:///home/wael/Projects/5+5/network/mobile/src/services/api.ts)                                           | Added live on-device security analysis engine; only uses mock data if `EXPO_PUBLIC_USE_MOCK === 'true'`.                               |
| [mobile/src/app/(tabs)/index.tsx](<file:///home/wael/Projects/5+5/network/mobile/src/app/(tabs)/index.tsx>)                               | Replaced `QR SAFETY SCANNER` with theme toggle; added `AppState` listener for camera permissions; updated `PermissionCard` actions.    |
| [mobile/src/ui/GlassTabBar.tsx](file:///home/wael/Projects/5+5/network/mobile/src/ui/GlassTabBar.tsx)                                     | Removed square-rounded button container; added smooth sliding indicator pill; animated icon scale and opacity; added theme support.    |
| [mobile/src/ui/Glass.tsx](file:///home/wael/Projects/5+5/network/mobile/src/ui/Glass.tsx)                                                 | Added `isDark` awareness to `GlassRoot` and `GlassCard` (light/dark tinting and fallback colors).                                      |
| [mobile/src/ui/AppText.tsx](file:///home/wael/Projects/5+5/network/mobile/src/ui/AppText.tsx)                                             | Automatic text contrast resolution based on `isDark` (`#F2F5FF` in dark mode, `#0F172A` in light mode).                                |
| [mobile/src/ui/components.tsx](file:///home/wael/Projects/5+5/network/mobile/src/ui/components.tsx)                                       | Updated `PermissionCard`, `ScreenHeader`, `PageHeader`, and `ToggleRow` for dual-theme support.                                        |
| [mobile/src/app/_layout.tsx](file:///home/wael/Projects/5+5/network/mobile/src/app/_layout.tsx)                                           | Dynamic `StatusBar` style (`light` / `dark`) and navigation theme based on `isDark`.                                                   |
| [mobile/src/app/(tabs)/history.tsx](<file:///home/wael/Projects/5+5/network/mobile/src/app/(tabs)/history.tsx>)                           | Replaced plain `Text` with `AppText` for consistent dark/light rendering.                                                              |
| [mobile/src/app/(tabs)/settings.tsx](<file:///home/wael/Projects/5+5/network/mobile/src/app/(tabs)/settings.tsx>)                         | Added Dark Mode toggle row; migrated static text to `AppText`.                                                                         |

---

## 3. Critical Traps & Things to Avoid in Future

1. **NEVER set `"cameraPermission": false` on secondary plugins (e.g. `expo-image-picker`)**:
   - In Expo, configuring `"cameraPermission": false` on any plugin injects `tools:node="remove"` for `android.permission.CAMERA` into the merged manifest.
   - This strips camera permissions globally from the app, breaking `expo-camera` and causing the permission switch in Android phone settings to be dimmed/disabled.

2. **Always refresh camera permissions on `AppState === 'active'`**:
   - If a user opens phone settings to grant camera access and navigates back to the app, `useCameraPermissions()` will not update automatically.
   - Always invoke `getPermission()` in an `AppState` listener so the viewfinder activates immediately upon return.

3. **Avoid enclosing tab bar buttons in boxy/square-rounded containers**:
   - Tab buttons in glassmorphism bars should use pure icon + label layouts with subtle scale and color transitions.
   - Use a single shared sliding indicator pill (with `Easing.out(Easing.cubic)`) rather than isolated background boxes on each button.

4. **Do not use static dark colors in `AppText` or components**:
   - Always reference the dynamic `isDark` state from `useAppState()` or use `<AppText />` which resolves text color automatically (`#F2F5FF` for dark, `#0F172A` for light).

5. **Remember bottom safe area space with custom floating tab bars**:
   - Always use `useTabBarSpace()` for `paddingBottom` on scroll views and absolute containers to prevent UI elements from being clipped behind the floating tab bar or Android gesture bar.

---

## 4. UI Design Rules & Tokens

- **Border Radii:**
  - Cards & Viewfinder: `radius.lg` (24px) or `radius.xl` (32px).
  - Floating Tab Bar & Pills: `radius.pill` (999px).
  - Small chips & buttons: `radius.sm` (12px) to `radius.md` (18px).

- **Colors & Accents:**
  - Accent / Primary: `#0A84FF` (Electric Blue).
  - Safe / Success: `#30D158` (Vibrant Emerald).
  - Warning: `#FF9F0A` (Amber).
  - Danger: `#FF453A` (Coral Red).
  - Glass Border: `rgba(255, 255, 255, 0.16)` (Dark) / `rgba(0, 0, 0, 0.08)` (Light).

- **Transitions:**
  - Standard transition duration: `260ms`.
  - Standard easing: `Easing.out(Easing.cubic)`.
  - Coordinate tab bar indicator movement and page transitions to share the same easing curve.

---

## 5. Mobile Session 2026-11-16: Core 8 Tasks, Boot Optimization & Layout Refinements

### Key Deliverables Implemented

1. **Tab Switching Performance & Memory (`src/app/(tabs)/_layout.tsx`)**:
   - Added `detachInactiveScreens={false}` to preserve tab views in memory and eliminate remount lag.
   - Preserved `lazy: true`, `freezeOnBlur: true`, and a snappy 200 ms cross-fade (`opacity` and `translateY` only) via `sceneStyleInterpolator`.
   - Wrapped screens (`index.tsx`, `history.tsx`, `settings.tsx`) with `React.memo` to eliminate redundant renders on tab switch.

2. **Tab Bar Alignment & Indicator (`src/ui/GlassTabBar.tsx`)**:
   - Normalized `'homepage'` / `'index'` labels to `'Home'`.
   - Extracted active indicator from `iconWrap` into an independent centered $26 \times 3\text{ px}$ pill (`borderRadius: 1.5`, `marginBottom: 4`) with `alignSelf: 'center'`.
   - Animated via `scaleX` and opacity, eliminating any icon-relative misalignment across all tabs.

3. **Scanner Viewfinder Layout & Watermark Alignment (`src/app/(tabs)/index.tsx`)**:
   - Fixed corner bracket curves: updated border radii to `28` with zero offsets (`top: 0, left: 0`, etc.) to match the outer card contour seamlessly.
   - Added central stylized QR watermark guide (`react-native-svg`) inside the viewfinder.
   - Ensured the Reanimated laser beam renders only while camera is active (`cameraIsOpen && !resultOpen`), preventing laser bar artifacts when paused.
   - Centered "Open Camera" blue pill button in paused state (`#0A84FF`, uppercase bold text, camera icon).
   - Confined content to scanner; removed stats row from Home.

4. **Centered Two-Button Controls (`src/app/(tabs)/index.tsx`)**:
   - Removed "Close Cam" button from bottom controls.
   - Replaced text buttons with two centered circular glass icon buttons ($54 \times 54\text{ px}$, radius 27): **Light / Torch** and **Image picker**.
   - Removed Dark Mode toggle from the Home screen header; kept exclusively on the Settings tab.

5. **Camera Lifecycle & Scan Result Flow (`src/app/(tabs)/index.tsx`)**:
   - Guarded camera lifecycle with `useIsFocused()`, `openCamera`, `closeCamera`, and unmount cleanup.
   - Scan line ping-pongs continuously via Reanimated `withRepeat(withTiming(frameHeight, { duration: 1800 }), -1, true)`, smoothly dims to 0.25 on scan processing, and cancels only on unmount.
   - Staged scan feedback: locks scan via ref, displays `"Reading QR code…"` for $\ge 1.2\text{ s}$, transitions to `"Checking link safety…"`, executes scan API with haptic response, and displays bottom sheet with 4 security diagnostics (**HTTPS**, **Domain Age**, **Redirects**, **Blocklist**) and contextual action button (`"Open link"` / `"Block link"`).

6. **Boot Animation & Launch Speed Optimization (`src/ui/BootOverlay.tsx`, `app.json`)**:
   - Native splash synchronized with `#070b14` dark background in `app.json` to eliminate white flash.
   - UI-thread pure Reanimated + SVG boot overlay.
   - Accelerated boot sequence by ~50%:
     - Three finder squares pop in with spring at 30, 90, 160 ms.
     - Four data dots fade in staggered at 240, 290, 340, 390 ms.
     - Scan beam sweeps from 360 ms over 480 ms.
     - Status text switches to `"Preparing scanner…"` at 350 ms.
     - Reduced `MIN_VISIBLE_MS` from 1700 ms to 950 ms and `HARD_CAP_MS` from 2500 ms to 1400 ms.
     - Instant parallel hydration with `AppContext` `Promise.all`.
     - Smooth 260 ms exit fade and unmount.

7. **Standalone APK Build & Live Simulation Verification**:
   - Executed `npm run apk` producing standalone debug APK at `dist/AMANE-DZ-debug.apk` (202 MB, multi-ABI: `arm64-v8a`, `armeabi-v7a`, `x86_64`).
   - Automatically installed via `adb install -r` to connected Android emulator (`emulator-5554`).
   - Verified live in simulation: launched `dz.amane.app/.MainActivity` and captured screenshot confirming all UI updates (centered icon buttons, corner alignment, QR watermark, header cleanup, and active tab indicator).

8. **Developer Onboarding & Project Rules (`RULES.md`)**:
   - Created comprehensive project rules and developer onboarding document at `RULES.md` and `mobile/RULES.md`.
   - Outlines architecture navigation, design tokens, UI rules, simulation workflows, APK build instructions, and core safety constraints.

## 6. iOS Simulator on Mac: Side-by-Side Development

AMANE DZ uses shared Expo / React Native screens for Android and iOS. The iOS app identifier is `dz.amane.app`, the Expo camera and image-picker plugins provide their iOS permission descriptions, and `mobile/package.json` defines the local `ios` script. A Mac with Xcode is required to build and run the local iOS Simulator app. A paid Apple Developer membership is **not** required for Simulator testing.

### Mac prerequisites (one-time setup)

1. Install Xcode from the Mac App Store and open it once.
2. In **Xcode → Settings → Locations**, select an installed version in **Command Line Tools**.
3. In **Xcode → Settings → Components** (or **Platforms**, depending on the Xcode version), download an iOS Simulator runtime.
4. Install Node.js/npm if they are not already installed.
5. From the repository root, install project dependencies:

   ```sh
   npm install
   npm --prefix mobile install
   ```

6. Confirm Xcode and the simulator runtime are available:

   ```sh
   xcodebuild -version
   xcode-select -p
   xcrun simctl list devices available
   ```

If Xcode asks to accept its license or install additional components, follow the prompt in the Mac terminal/Xcode before continuing.

### Open the iOS Simulator and launch AMANE DZ

From the repository root:

```sh
# Xcode 26 and earlier
open -a Simulator
```

For Xcode 27, Apple replaced Simulator with Device Hub:

```sh
open -a DeviceHub
```

Then build and launch AMANE DZ:

```sh
npm --prefix mobile run ios
```

`npm --prefix mobile run ios` invokes the mobile package's `expo run:ios` command. On the first run, Expo generates the ignored `mobile/ios/` native project from `mobile/app.json`, Xcode builds the app, installs it in the selected simulator, and starts Metro for development. Select an iPhone simulator in Simulator/Device Hub if one is not already booted.

> **Important:** There is no root-level `npm run ios` script. Use `npm --prefix mobile run ios` from the repository root, or `cd mobile && npm run ios`.

The iOS native project is generated by Expo Continuous Native Generation and is ignored by Git. Do not hand-edit or commit generated `mobile/ios/` files; put persistent native configuration in `mobile/app.json` or an Expo config plugin.

### Set up the Mac like the Android side-by-side workflow

1. Put the code editor and the terminal running `npm --prefix mobile run ios` on the left.
2. Put **Simulator** on the right. Use the green window button's **Tile Window to Left/Right of Screen** option (or drag the windows into the left and right halves).
3. Keep the Metro terminal open while editing. Saving JavaScript/TypeScript files in `mobile/src/` triggers React Native Fast Refresh in the simulator, just as it does on Android.
4. If the simulator does not open automatically, open it manually and inspect the available device names with `xcrun simctl list devices available`, then rerun the iOS command.

For comparison:

| Workflow | Command from repository root |
| --- | --- |
| Launch Android emulator and app | `npm run android` |
| Launch iOS Simulator and app on Mac | `npm --prefix mobile run ios` |
| Start Expo/Metro without selecting a native platform | `npm run dev` (Android: press `a`; on macOS, press `i` for the iOS Simulator) |

Use the mobile `ios` run command when testing the native iOS app configuration and permission strings. The Expo CLI `i` shortcut is a convenient alternative for opening the project from the development server. Press `Shift + I` to choose a specific installed iOS simulator.

### Test camera and gallery features

- The iOS Simulator has **no camera hardware**. A live camera preview, flashlight/torch, and real camera capture cannot be verified there.
- To test the scanner flow in Simulator, tap the **image** button and choose a simulator photo containing a QR code. Add a test image to Simulator first (for example, drag a QR image file onto the Simulator window).
- Use a physical iPhone to test live camera scanning, the torch, and actual iOS camera permission behavior. On first camera use, choose **Allow** in the iOS permission prompt.
- The app does not open QR links automatically. Review the scan result before choosing an action.

### iPhone distribution is separate from Simulator development

- The `preview-simulator` profile in `mobile/eas.json` is for an iOS Simulator build. It does not need an Apple Developer membership, but an Expo/EAS account is needed for an EAS cloud build.
- The `preview` profile is for internal installation on real iPhones. Register each tester's device UDID before building; Apple Developer signing is required.
- TestFlight uses the `production` App Store build profile and an App Store Connect app record. Apple Developer Program membership and signing are required.
- This Mac Simulator workflow is local and is the fastest way to code side-by-side without waiting for cloud builds or TestFlight.

### Troubleshooting

| Problem | Check |
| --- | --- |
| `xcodebuild` or Xcode tools are not found | Open Xcode, install/select Command Line Tools in **Xcode → Settings → Locations**, and rerun `xcodebuild -version`. |
| No simulator device is available | Download an iOS runtime in Xcode Settings, then run `xcrun simctl list devices available`. |
| Simulator is stuck opening | Open Simulator manually. On Xcode 26 use `open -a Simulator`; Xcode 27 uses Device Hub (`open -a DeviceHub`). |
| Camera preview is blank or cannot scan live | Expected in Simulator; scan a QR image from the gallery or use a physical iPhone. |
| A native configuration change is not visible | Rebuild and reinstall with `npm --prefix mobile run ios`; Fast Refresh updates JavaScript, not native project settings. |
| Build is being run on Linux | Local iOS Simulator/Xcode builds require macOS. Use a Mac or an EAS cloud build; a cloud simulator build can be installed only on a Mac simulator. |

Expo references: [iOS Simulator setup](https://docs.expo.dev/workflow/ios-simulator/) · [Expo CLI shortcuts](https://docs.expo.dev/more/expo-cli/) · [Build for iOS Simulators](https://docs.expo.dev/build-reference/simulators/).
