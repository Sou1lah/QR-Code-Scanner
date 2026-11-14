# AMANE DZ

AMANE DZ is a React Native QR-safety scanner built with Expo. The existing
browser/PWA implementation remains under `src/`; the Expo app is under `mobile/`.

## Develop on Android

Install Node.js 20+ and the project dependencies:

```sh
npm install
cd mobile && npm install && cd ..
```

Start an Android emulator in Android Studio, then run:

```sh
npm run android
```

Expo opens the app in the emulator. Keep the terminal running: React Native
Fast Refresh applies saved code changes to the emulator while you work. You can
also run `npm run dev` and press `a` in the Expo terminal to open Android.

The scanner uses the emulator camera if one is configured; demo QR payloads
are available on the Scanner tab for testing without a camera. On a physical
phone, install Expo Go and scan the QR code printed by `npm run dev`.

## Build and share an APK

Install Android Studio with its Android SDK and JDK 17 or newer. Then build a
debug APK locally:

```sh
npm run apk
```

The APK is written to `mobile/dist/AMANE-DZ-debug.apk`. Send that file to an
Android tester; they may need to allow installing apps from their browser or
file manager. This debug APK is for testing, not Play Store distribution.

`npm run apk` runs Expo prebuild and Gradle locally, so it requires a working
Android SDK and JDK. Set `JAVA_HOME` to JDK 17+ and `ANDROID_HOME` to the SDK
directory if they are not detected automatically.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Expo/Metro with Fast Refresh |
| `npm run android` | Start Expo and open the Android emulator |
| `npm run mobile:typecheck` | Type-check the React Native app |
| `npm run apk` | Build a shareable debug APK |
| `npm run web:dev` | Start the retained Vite browser app |
| `npm run build` | Build the retained Vite/PWA app |

## Scan service

The native app defaults to mock scan results. To connect it to a separately
hosted API, copy `mobile/.env.example` to `mobile/.env.local`, set
`EXPO_PUBLIC_API_URL` to the API origin and set `EXPO_PUBLIC_USE_MOCK=false`.
These Expo public variables are bundled into the app; do not put secrets in
them.
# Network-5-5-
