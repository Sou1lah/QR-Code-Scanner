# AMANE DZ

AMANE DZ is a React Native QR-safety scanner mobile app built with Expo. The mobile app source code is located in `mobile/`. (The legacy web/PWA interface remains in `src/`).

---

## 🚀 Quick Start: Live Coding with Emulator on the Right

### 1. Launch the Android Emulator & App
Run from the project root:

```sh
npm run android
```

This launches your configured Pixel emulator (`AMANE_Pixel_6_API_36`) and automatically opens the AMANE DZ app.

> **💡 Side-by-Side Coding Setup**:
> 1. Tile your terminal/editor to the left half of the screen (`Super + Left Arrow`).
> 2. Tile the Android emulator window to the right half (`Super + Right Arrow`).
> 3. Click the **Pin** icon (**Always on Top**) on the emulator's toolbar (or right-click the titlebar -> *More Actions* -> *Keep Above Others*).
> 4. React Native **Fast Refresh** updates the emulator screen instantly whenever you save code (`:w` in Neovim or `Ctrl+S` in VS Code).

---

## 📱 Launching & Updating the App

- **Fast Refresh Dev Mode**:
  ```sh
  npm run dev
  ```
  Starts Metro bundler. Press `a` in the terminal to connect your running emulator.

- **Standalone App on Device / Emulator**:
  Once installed via `npm run apk`, the app appears in your emulator's app menu with the **QR Code scanner icon** titled **AMANE DZ**. Clicking it launches the standalone native build directly.

---

## 📦 How to Build & Share the APK

To generate a shareable `.apk` file for testing or sending to other phones:

```sh
npm run apk
```

### What happens when you run `npm run apk`:
1. Compiles the native Android application with the custom QR Code icon and bundled assets.
2. Generates the APK file at:
   ```
   mobile/dist/AMANE-DZ-debug.apk
   ```
3. If an emulator or phone is connected via USB/ADB, it **automatically installs/updates** the app on the device immediately!

### How to share the APK:
1. Copy or send `mobile/dist/AMANE-DZ-debug.apk` via Telegram, Google Drive, WhatsApp, or email.
2. The recipient taps the file on their Android phone to install (they may need to toggle *"Allow installation from unknown sources"* in their phone settings).

---

## 🛠 Commands Reference

| Command | Purpose |
| --- | --- |
| `npm run android` | Launch the Android emulator with AMANE DZ |
| `npm run dev` | Start Expo/Metro dev server with Fast Refresh |
| `npm run apk` | Build and auto-install `AMANE-DZ-debug.apk` |
| `npm run mobile:typecheck` | Type-check TypeScript files in `mobile/` |
| `npm run web:dev` | Start the retained Vite browser web app |
| `npm run build` | Build the retained Vite/PWA web app |

---

## ⚙️ Wayland / Linux Note

If launching the emulator manually from a terminal on Linux with KDE/Wayland, ensure `QT_QPA_PLATFORM=xcb` is set:
```sh
QT_QPA_PLATFORM=xcb emulator @AMANE_Pixel_6_API_36
```
*(All `npm` scripts in this project already configure this automatically).*

