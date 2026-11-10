# AMANE DZ

Installable, offline-capable QR safety scanner for iOS and Android. The scanner
previews every decoded payload and never automatically opens a URL.

## Install and run

```sh
npm install
cp .env.example .env.local
npm run dev
```

Open the Vite URL shown in the terminal. The dev server listens on all
interfaces (`--host true`) for local-network phone testing. Camera access needs
HTTPS on a phone; use an HTTPS tunnel or deploy a preview site. `localhost` is
also treated as a secure origin.

## Test on a phone

1. Connect the phone and development computer to the same Wi-Fi.
2. Find the computer's LAN IP and run `npm run dev` (Vite is configured with
   `server.host: true`).
3. Open `http://<LAN-IP>:5173` on the phone for UI testing. Browsers block camera
   access on plain HTTP LAN addresses; use an HTTPS tunnel (for example
   `ngrok http 5173`) to test live camera scanning.
4. Allow camera access. Use the image button to decode a QR code from a photo.

The live camera and installable PWA require HTTPS, except when served from
localhost. The manifest and service worker cache the application shell for
offline startup. Threat checks still require an available back-end unless demo
mode is on.

## Install the PWA

- **iPhone/iPad:** Open the HTTPS deployment in Safari, tap Share, then **Add to
  Home Screen**.
- **Android:** Open the HTTPS deployment in Chrome and choose **Install app**
  (or **Add to Home screen**) from the browser menu.

## Build, lint, preview

```sh
npm run build
npm run lint
npm run preview
```

Deploy `dist/` to Vercel or Netlify with HTTPS enabled. Configure SPA fallback
rewrites to `index.html` for the `/scanner`, `/history`, and `/settings` routes.
Set `VITE_API_URL` to the HTTPS API origin and `VITE_USE_MOCK=false` to use the
real threat-analysis service.

## Back-end teammate integration

The back-end owns threat analysis; this front-end only parses QR format and
displays the API verdict. Implement the contract in
[`docs/API_CONTRACT.md`](docs/API_CONTRACT.md): `POST /api/scan` and
`GET /api/health`. Keep all HTTP calls in `src/services/api/`. During UI work,
`VITE_USE_MOCK=true` uses the demo scenarios; the three sample scan buttons are
shown only while the persisted **Demo Mode** setting is enabled (default on).
Turn it off in Settings to hide them. Set `VITE_API_URL` and
`VITE_USE_MOCK=false` for integration. The Settings screen shows API health.

## Project layout

```text
src/
  app/                 Router and app shell
  components/
    scanner/           Camera viewfinder and result sheet
    ui/                Reusable buttons, cards, switch, sheet, toast, badge
  lib/                 Local QR payload parsing and helpers
  pages/               Scanner, History, Settings
  services/
    api/               The only HTTP/back-end integration layer
    mock/              Local demo scan responses
  store/               Persisted settings and scan history
  types/               API request/response contracts
docs/
  API_CONTRACT.md      Back-end integration contract
```
