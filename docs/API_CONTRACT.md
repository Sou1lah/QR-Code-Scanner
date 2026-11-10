# AMANE DZ API contract

The React application calls the back-end **only** from `src/services/api/client.ts`.
Configure the origin with `VITE_API_URL` and disable local demo responses with
`VITE_USE_MOCK=false`. The API must be served over HTTPS in production.

## `POST /api/scan`

Request:

```json
{
  "raw": "https://example.com/path",
  "type": "URL",
  "settings": {
    "urlShortenerUnfurl": true,
    "blockInsecureHttp": true,
    "safeBrowsingApi": true
  }
}
```

`type` is `URL`, `WIFI`, or `TEXT`. The `settings` object reflects the user's
protection toggles; `Zero-Auto Action` is intentionally always on and is not
sent as a configurable value.

Response:

```json
{
  "verdict": "SAFE",
  "score": 0,
  "summary": "No known threats detected.",
  "ssl": "Valid TLS",
  "domainAge": "Established",
  "redirects": "Direct Link",
  "reputation": "Trusted",
  "resolvedUrl": "https://example.com/path"
}
```

`verdict` must be `SAFE`, `SUSPICIOUS`, or `DANGEROUS`; `score` is an integer
from 0 to 100. Diagnostic values and summary are display strings. `resolvedUrl`
may be a destination, a Wi-Fi summary, or an empty string when unavailable.

## `GET /api/health`

Returns a successful JSON response when the API is healthy:

```json
{ "status": "ok" }
```

Non-2xx responses are treated as errors by the client. Configure CORS to allow
the deployed front-end origin.
