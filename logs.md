# AMANE DZ — Engineering & UI Modification Log

**Last Modified:** November 15, 2026 (12:57 CET)  
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
  - Added an `AppState` listener in [index.tsx](file:///home/wael/Projects/5+5/network/mobile/src/app/(tabs)/index.tsx) to automatically call `getPermission()` whenever the user returns to the app from Android Settings.

### B. Navigation Bar Transitions & Button Redesign
- **Problem:** Tab bar buttons had clunky square-rounded container boxes around the icons, and active tab switching felt instant without animation.
- **Solution:**
  - Removed `pillActiveBackground` (the boxy container enclosing tab icons) from [GlassTabBar.tsx](file:///home/wael/Projects/5+5/network/mobile/src/ui/GlassTabBar.tsx).
  - Implemented an animated sliding indicator pill at the top edge of the tab bar that smoothly glides horizontally between tabs using `duration: 260` and `Easing.out(Easing.cubic)`, matching the page route transitions in `_layout.tsx`.
  - Added smooth icon scale interpolation (`1.0` -> `1.14`) and opacity interpolation (`0.5` -> `1.0`) on active tab focus.

### C. Replaced "QR SAFETY SCANNER" with Dark / Light Mode Toggle
- **Problem:** Scanner screen header displayed an informational badge chip (`QR SAFETY SCANNER`) instead of an interactive theme switcher.
- **Solution:**
  - Replaced the badge in [index.tsx](file:///home/wael/Projects/5+5/network/mobile/src/app/(tabs)/index.tsx) with an interactive glass theme button displaying the current mode icon (`moon` / `sunny`) and label (`Dark` / `Light`).
  - Connected the toggle to `useAppState().toggleTheme()` and persisted state to `AsyncStorage` under `amane-theme`.
  - Added a matching theme toggle row inside [settings.tsx](file:///home/wael/Projects/5+5/network/mobile/src/app/(tabs)/settings.tsx).
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
  - Placed the `CameraView` strictly inside the 260x260 rounded `viewfinder` frame in [index.tsx](file:///home/wael/Projects/5+5/network/mobile/src/app/(tabs)/index.tsx). The main app background now preserves its clean glass gradient.
  - Added a camera state toggle (`cameraEnabled`) with a dedicated **Close Cam / Open Cam** button in the controls.
  - When closed/paused, the camera sensor is unmounted and the viewfinder displays a sleek paused card with a "Resume Camera" action.

### G. Animated Scanning Laser on QR Code Frame
- **Problem:** The scanner frame had a static, unmoving horizontal line.
- **Solution:**
  - Implemented a continuous looping vertical scanning laser in [index.tsx](file:///home/wael/Projects/5+5/network/mobile/src/app/(tabs)/index.tsx) using `Animated.loop` with `Easing.inOut(Easing.quad)` over a 2000ms duration.
  - Styled with a radiant cyan/electric blue laser beam and vertical glow diffusion.

### H. Complete Light Mode Contrast Resolution (No White Text on White)
- **Problem:** In light mode, several screens and the result modal rendered white text on light backgrounds because `colors.text` and `colors.muted` were statically hardcoded.
- **Solution:**
  - Updated [AppText.tsx](file:///home/wael/Projects/5+5/network/mobile/src/ui/AppText.tsx) to dynamically resolve `#0F172A` (dark) and `rgba(71,85,105,0.88)` (muted) whenever light mode is active.
  - Converted raw `<Text>` in the Result Modal, History screen, and Settings screen to `<AppText>`.
  - Removed static white colors from style sheets in [index.tsx](file:///home/wael/Projects/5+5/network/mobile/src/app/(tabs)/index.tsx), [history.tsx](file:///home/wael/Projects/5+5/network/mobile/src/app/(tabs)/history.tsx), and [settings.tsx](file:///home/wael/Projects/5+5/network/mobile/src/app/(tabs)/settings.tsx).
  - Added `buttonLight` and `secondaryButtonLight` in [components.tsx](file:///home/wael/Projects/5+5/network/mobile/src/ui/components.tsx) for crisp, accessible button contrast.

---

## 2. Modified Files

| File | Changes Made |
| :--- | :--- |
| [mobile/app.json](file:///home/wael/Projects/5+5/network/mobile/app.json) | Removed `"cameraPermission": false` from `expo-image-picker`; set `userInterfaceStyle` to `"automatic"`. |
| [mobile/android/app/src/main/AndroidManifest.xml](file:///home/wael/Projects/5+5/network/mobile/android/app/src/main/AndroidManifest.xml) | Replaced `tools:node="remove"` with proper `<uses-permission android:name="android.permission.CAMERA"/>` and camera hardware features. |
| [mobile/src/context/AppContext.tsx](file:///home/wael/Projects/5+5/network/mobile/src/context/AppContext.tsx) | `demoMode: false` default; `isDark` state and `toggleTheme` method; persisted theme in AsyncStorage. |
| [mobile/src/services/api.ts](file:///home/wael/Projects/5+5/network/mobile/src/services/api.ts) | Added live on-device security analysis engine; only uses mock data if `EXPO_PUBLIC_USE_MOCK === 'true'`. |
| [mobile/src/app/(tabs)/index.tsx](file:///home/wael/Projects/5+5/network/mobile/src/app/(tabs)/index.tsx) | Replaced `QR SAFETY SCANNER` with theme toggle; added `AppState` listener for camera permissions; updated `PermissionCard` actions. |
| [mobile/src/ui/GlassTabBar.tsx](file:///home/wael/Projects/5+5/network/mobile/src/ui/GlassTabBar.tsx) | Removed square-rounded button container; added smooth sliding indicator pill; animated icon scale and opacity; added theme support. |
| [mobile/src/ui/Glass.tsx](file:///home/wael/Projects/5+5/network/mobile/src/ui/Glass.tsx) | Added `isDark` awareness to `GlassRoot` and `GlassCard` (light/dark tinting and fallback colors). |
| [mobile/src/ui/AppText.tsx](file:///home/wael/Projects/5+5/network/mobile/src/ui/AppText.tsx) | Automatic text contrast resolution based on `isDark` (`#F2F5FF` in dark mode, `#0F172A` in light mode). |
| [mobile/src/ui/components.tsx](file:///home/wael/Projects/5+5/network/mobile/src/ui/components.tsx) | Updated `PermissionCard`, `ScreenHeader`, `PageHeader`, and `ToggleRow` for dual-theme support. |
| [mobile/src/app/_layout.tsx](file:///home/wael/Projects/5+5/network/mobile/src/app/_layout.tsx) | Dynamic `StatusBar` style (`light` / `dark`) and navigation theme based on `isDark`. |
| [mobile/src/app/(tabs)/history.tsx](file:///home/wael/Projects/5+5/network/mobile/src/app/(tabs)/history.tsx) | Replaced plain `Text` with `AppText` for consistent dark/light rendering. |
| [mobile/src/app/(tabs)/settings.tsx](file:///home/wael/Projects/5+5/network/mobile/src/app/(tabs)/settings.tsx) | Added Dark Mode toggle row; migrated static text to `AppText`. |

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
