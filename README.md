# GoldMiner — mobile web app

Mobile-first Next.js app for monitoring and operating the GoldMiner MT5 account
(XAUUSD) through the GoldMiner Trading API.

## Status

All screens are mapped to the real GoldMiner API response formats (taken from
the backend source: `main.py`, `trading.py`, `poller.py`, `mt5_bridge.py`,
`schemas.py`, `database.py`, `logic.py`) in
[`src/lib/api/mappers.ts`](src/lib/api/mappers.ts). No mock data is used.

API limitations the UI reflects honestly:
- There is no quote endpoint: the gold price is shown from open positions'
  `price_current` and is unavailable when no gold position is open.
- There is no price-history endpoint, so the Market chart shows an empty state.
  The Analytics chart uses `/api/performance` snapshots (balance/equity).
- `/api/control/stop-new-trades` and `/resume-trading` return 501 by design and
  have no buttons.

## Architecture

```
Browser (React UI)
  │  fetch /api/gm/<path>            ← no token, same-origin only
  ▼
Next.js server  src/app/api/gm/[...path]/route.ts
  │  + Authorization: Bearer $GOLDMINER_API_TOKEN (server env only)
  ▼
GoldMiner API   https://goldminer-api.srv1995263.hstgr.cloud
```

| Layer | Files |
| --- | --- |
| Server proxy (allowlist, auth, no retries) | `src/app/api/gm/[...path]/route.ts`, `src/server/*` |
| App lock (passcode → httpOnly session cookie) | `src/app/api/session/route.ts`, `src/components/AuthGate.tsx` |
| API client + one function per endpoint | `src/lib/api/client.ts`, `src/lib/api/goldminer.ts` |
| Error parser (401/403/404/409/422/429/501/5xx) | `src/lib/api/errors.ts` |
| Response → model mapping | `src/lib/api/mappers.ts` |
| App view models | `src/lib/models.ts` |
| Single polling loop (3 s, paused in background) | `src/lib/api/live.tsx` |
| Resource hooks used by screens | `src/lib/api/hooks.ts` |
| Mutations: request_id, loading, no double-submit, refresh | `src/lib/api/useAction.ts`, `src/lib/api/requestId.ts` |
| Confirmations | `src/components/ConfirmSheet.tsx`, `src/components/ActionConfirm.tsx` |

## Safety rules built in

- The API token exists only in server env. It is never sent to the browser,
  never logged, never stored client-side, and never committed.
- The proxy forwards only the endpoints on the approved checklist.
- **All mutating actions are blocked server-side unless
  `GOLDMINER_ENABLE_TRADING=true`.** Default: read-only.
- Every mutating action needs explicit confirmation; Close ALL / Close BUY /
  Close SELL show live counts and lots first; Emergency close requires typing
  `CLOSE` and states it does not stop the EA.
- Every user action gets a new `request_id`; nothing is ever retried
  automatically. If a write's outcome is unknown, the app says so and re-reads
  commands/positions instead of re-sending.
- Position actions use tickets from the live list and are refused if the
  position is no longer open.
- Deposit/Withdraw are kept for the design but marked "Not available" — the API
  has no endpoint for them.

## Configuration

Server-side environment variables (see `.env.example`). Never use `NEXT_PUBLIC_`.

| Variable | Purpose |
| --- | --- |
| `GOLDMINER_API_TOKEN` | Bearer token for the GoldMiner API |
| `GOLDMINER_APP_PASSCODE` | Passcode to unlock the app |
| `GOLDMINER_API_BASE_URL` | Optional, defaults to the production API |
| `GOLDMINER_ENABLE_TRADING` | `true` to allow mutating actions; anything else = read-only |

For local development put them in `.env.local` (git-ignored).

## Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run build
npm run lint
npm run discover-api # read-only: writes api-shapes.json (structure only, no values)
```
