# GoldMiner Control

Mobile-first **read-only monitoring dashboard** for the MT5 **GoldMiner** trading system
(XAUUSD.c). Installable as a PWA. Built with Next.js 15, React 19, TypeScript, TanStack Query
and Recharts.

> **This is a monitoring viewer, not a trading control panel.** It can read data from MT5 (via a
> backend and bridge) and display it. It has no capability anywhere in the stack to place, close,
> modify, pause, or resume a trade or account setting. See [`docs/READ_ONLY.md`](docs/READ_ONLY.md)
> for the full guarantee and how it's enforced by the test suite.

> **There is no mock or demo data.** Every figure on screen comes from the real backend at
> `NEXT_PUBLIC_API_BASE_URL`. If the backend is unreachable, screens show an error state — nothing
> ever falls back to invented numbers.

---

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. Until `NEXT_PUBLIC_API_BASE_URL` points at a real backend, every screen
will correctly show "Unable to load live account data" — that's the intended behaviour, not a bug.

To see real data end-to-end on one machine: install [`mt5-bridge/GoldMinerMonitor.mq5`](mt5-bridge/README.md)
into MT5, run [`backend/`](backend/README.md) (`cd backend && node server.js`), and point
`.env.local`'s `NEXT_PUBLIC_API_BASE_URL` at it (`http://localhost:4000` by default). See
[`docs/VPS_DEPLOYMENT.md`](docs/VPS_DEPLOYMENT.md) when you're ready to move this off your laptop
and onto a VPS so it runs 24/7.

| Command             | What it does                                  |
| ------------------- | ---------------------------------------------- |
| `npm run dev`       | Dev server                                     |
| `npm run build`     | Production build (includes type checking)      |
| `npm start`         | Serve the production build                     |
| `npm test`          | Unit + architecture + read-only guard tests    |
| `npm run typecheck` | TypeScript only                                |
| `npm run icons`     | Regenerate PWA icons (no image dependencies)   |

---

## Read-only guarantee

This is a trading application, so it must never be able to act on a trade even by accident.

1. **No control surface.** There is no pause/resume/close/modify button anywhere in the UI, no
   service method, no hook, and no route that could send such a command.
2. **`apiClient` cannot issue `DELETE`,** and `POST`/`PATCH` exist only for non-trading dashboard
   state (marking an alert read, managing a push subscription).
3. **This Next.js app ships no backend of its own.** There is no `src/app/api` — every read goes to
   the real backend you point `NEXT_PUBLIC_API_BASE_URL` at. The separate [`backend/`](backend/)
   service is its own standalone process (plain Node.js, no framework), not part of the Next.js
   build, and is itself GET/PATCH-only — see [`backend/test/readOnly.test.js`](backend/test/readOnly.test.js).
4. **If the backend fails, nothing falls back to any other data source.** Screens show "Unable to
   load live account data" with Retry.
5. **`src/architecture.test.ts`** greps every source file for trading-execution identifiers
   (`CTrade`, `OrderSend(`, `PositionClose(`, `PositionModify(`, …) and fails if any appear. It also
   asserts the UI never imports a data provider directly, never calls `fetch` or `Math.random`, and
   that no local API route exists.
6. Missing values render as `—`, `Not set`, or "Waiting for MT5" — never an invented number.

Full detail, including exactly what was removed and why: [`docs/READ_ONLY.md`](docs/READ_ONLY.md).

---

## Architecture

```
UI (src/app, src/components)
  ↓
Hooks (src/hooks/useTradingData.ts)       TanStack Query: loading / error / refetch
  ↓
Services (src/services/*Service.ts)       accountsService, tradesService, basketsService, …
  ↓
dataProvider (src/services/dataProvider.ts)   ← always the real backend, no switch
  ↓
apiProvider (src/data/providers/apiProvider.ts)
  ↓
apiClient (src/services/apiClient.ts) — GET everywhere, PATCH only for alert read-state
  ↓ HTTPS
Backend API (backend/, included) → MT5 read-only bridge (mt5-bridge/) → MT5 terminals → broker
```

The browser **never** talks to MT5 directly and never holds broker credentials. See
[`mt5-bridge/README.md`](mt5-bridge/README.md) for the documented, read-only MQL5 script that
reports MT5 state to a JSON snapshot file, and [`backend/`](backend/) for the service that reads it.

```
Mobile PWA ─HTTPS(GET only)→ Backend API (backend/) ─reads─ MT5 bridge (mt5-bridge/GoldMinerMonitor.mq5) ─reads─ MT5 terminals ─ broker
```

### Where things live

```
src/
  app/                      Screens (App Router). No local API routes — this app has none.
    page.tsx                  Home
    accounts/                 Accounts list + [accountNumber] detail
    trades/  alerts/  settings/
  components/
    domain/                   AccountCard, BasketCard, TradeCard, AlertCard, PerformanceChart,
                              TradingWindowCard, CopierStatusCard, DataModeBadge (connection status)
    layout/                   AppShell, BottomNav, Sidebar, TopBar, service worker registrar
    ui/                       Primitives: Sheet, States, Chips, Switch, Toast…
  config/
    env.ts                    The only reader of process.env
    goldminer.ts              EA preset (symbol, magic numbers, lots, grid, sessions) — display only
  data/
    providers/
      apiProvider.ts            The one and only data provider. Calls the real backend; no fallback.
  hooks/                    useTradingData, useTradingWindow, usePreferences…
  lib/                      Pure logic: tradingWindow, time (IST), format, accounts, trades, alerts
  services/                 Service layer, contracts, apiClient, realtime, notifications
  types/domain.ts           Account, Trade, Basket, Alert, PerformancePoint, CopierStatus, SystemStatus
  architecture.test.ts      Enforces the data-honesty and read-only boundaries above
docs/
  READ_ONLY.md              The read-only guarantee in full, and how it's tested
  VPS_DEPLOYMENT.md         Moving MT5 + backend + dashboard onto the AWS Windows VPS
mt5-bridge/
  GoldMinerMonitor.mq5      Read-only MQL5 monitoring script (not part of the Next.js build)
  README.md                 How to install it, and how it feeds backend/
backend/
  server.js                 Read-only HTTP backend (plain Node.js, zero dependencies)
  src/                      snapshotStore, build (Account/Trade/Basket aggregation), alerts, config
  test/                     Its own read-only guard + alert/trading-window logic tests
  README.md                 How to run it, locally or as a Windows service
```

---

## Configuration

Create `.env.local` (copy `.env.example`):

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://api.your-backend.example
```

Restart `npm run dev` (or rebuild) after changing it.

### Environment variables

| Variable                          | Default        | Purpose                                          |
| ---------------------------------- | -------------- | ------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`        | `/api`         | Backend base URL. Point this at your real backend. |
| `NEXT_PUBLIC_REALTIME_TRANSPORT`  | `polling`      | `polling` or `websocket`                          |
| `NEXT_PUBLIC_POLL_INTERVAL_MS`    | `8000`         | Poll interval, minimum 2000; paused when the tab is hidden |
| `NEXT_PUBLIC_REALTIME_URL`        | —              | WebSocket URL (future)                            |
| `NEXT_PUBLIC_DEFAULT_CURRENCY`    | `INR`          | Display currency                                  |
| `NEXT_PUBLIC_TRADING_TIMEZONE`    | `Asia/Kolkata` | Display label; business logic is always IST       |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`    | —              | Web Push public key (private key stays server-side) |
| `NEXT_PUBLIC_API_KEY`             | —              | Optional shared secret sent as `Authorization: Bearer <key>`, must match the backend's `API_KEY` |

Note: this project runs on Next.js, so browser-visible variables use the `NEXT_PUBLIC_` prefix.
`VITE_`-prefixed variables are not read.

---

## Backend API contract

A reference backend implementing this contract lives in [`backend/`](backend/) — plain Node.js,
zero dependencies, reads the MT5 monitor's snapshot files and serves exactly the routes below. See
[`backend/README.md`](backend/README.md) to run it. **GET everywhere, plus `PATCH` for the alert
read-state only.** Response shapes are the types in `src/types/domain.ts`.

| Method  | Path                          | Returns                                                    |
| ------- | ----------------------------- | ----------------------------------------------------------- |
| `GET`   | `/accounts`                   | `Account[]`                                                  |
| `GET`   | `/accounts/:id`               | `Account` (`:id` may be the id or the account number)        |
| `GET`   | `/accounts/:id/trades`        | `Trade[]` — open positions for one account                   |
| `GET`   | `/accounts/:id/baskets`       | `Basket[]` — BUY and SELL may both be present                |
| `GET`   | `/accounts/:id/performance`   | `PerformancePoint[]`                                          |
| `GET`   | `/trades`                     | `Trade[]` — all accounts                                      |
| `GET`   | `/baskets`                    | `Basket[]` — all accounts                                     |
| `GET`   | `/performance`                | `PerformancePoint[]` — portfolio                              |
| `GET`   | `/alerts`                     | `Alert[]`                                                     |
| `PATCH` | `/alerts`                     | Mark all read → `204` (dashboard UI state, not trading)       |
| `PATCH` | `/alerts/:id`                 | Mark one read → `204`                                         |
| `GET`   | `/copier/status`              | `CopierStatus`                                                |
| `GET`   | `/system/status`              | `SystemStatus` — drives the connection badge                  |

There is intentionally no endpoint to pause, resume, close, or modify anything. Do not add one —
see [`docs/READ_ONLY.md`](docs/READ_ONLY.md).

Errors: non-2xx with `{ "message": "..." }`. The UI shows the message.

### Semantics the backend must honour

- **`PerformancePoint`** = `{ timestamp, pnl }` where `pnl` is **today's cumulative portfolio P/L
  (realised + floating)** at that timestamp, chronological, in the display currency. Not equity.
  Do not synthesise points — if there isn't enough history yet, return what you have; the UI shows
  "Not enough data yet" for a short series rather than a fake line.
- **Baskets** are aggregated server-side from live positions: position count, total volume,
  volume-weighted average entry, basket TP, current P/L. The frontend does not compute them from
  raw trades — see `mt5-bridge/GoldMinerMonitor.mq5` for a reference aggregation.
- **`tradingEnabled: false`** is a display-only fact reported by the EA/bridge (new positions are
  paused at the strategy level), not something this dashboard can set.
- **`mt5Status` / `eaStatus` / `lastHeartbeat`** come from the MT5 bridge. The UI marks an account
  `STALE` if the heartbeat is older than 5 minutes even when status says ONLINE.
- **`SystemStatus.mt5AgentConnected`** must be `null` if unknown — never a default `true`.

Home totals (balance, equity, today's P/L, open P/L, positions, online/offline/paused counts) are
**computed on the client from `/accounts`** (`summarisePortfolio` in `src/lib/accounts.ts`), so they
are correct as soon as the backend serves real accounts.

---

## MT5 bridge

[`mt5-bridge/GoldMinerMonitor.mq5`](mt5-bridge/GoldMinerMonitor.mq5) is a documented, read-only
Expert Advisor you attach to each MT5 terminal. On a timer it writes a JSON snapshot (account info,
open positions, GoldMiner baskets) using only read-only MQL5 functions
(`AccountInfo*`, `PositionGet*`, `SymbolInfo*`, `TerminalInfoInteger`) — it never imports `CTrade`
and never calls `OrderSend`, `PositionClose`, `PositionModify`, or any other execution API. See
[`mt5-bridge/README.md`](mt5-bridge/README.md) for installation and for what backend service you
still need to write to turn those snapshot files into the HTTP contract above.

---

## GoldMiner trading window (IST)

| IST           | New positions |
| ------------- | ------------- |
| 04:00 – 17:30 | Allowed       |
| 17:30 – 20:00 | Paused        |
| 20:00 – 02:30 | Allowed       |
| 02:30 – 04:00 | Paused        |

Existing positions are never force-closed during a pause — this dashboard has no ability to close
them anyway. The UI says **"NEW TRADES PAUSED"**, never "trading stopped". Logic is in
`src/lib/tradingWindow.ts`, uses IST explicitly (never the device timezone), and is tested at every
boundary including the midnight crossing.

---

## PWA

- Manifest: `src/app/manifest.ts`. Icons: `public/icons` (generated by `npm run icons`).
- Service worker: `public/sw.js`, registered in production only. It caches the app shell and
  **never caches `/api/*`** — stale balances are worse than none.
- Push: `notificationsService` requests permission and subscribes via `PushManager`, posting to
  `/notifications/subscribe` once a VAPID key exists. Notifications are informational only — see
  `docs/READ_ONLY.md` — they never carry an action button.

Install: open the site on the phone → browser menu → **Add to Home Screen**.
(Service workers need HTTPS or localhost; test installs against `npm run build && npm start`.)

---

## Testing

```bash
npm test
```

- `lib/tradingWindow.test.ts` — every session boundary incl. 20:00 → 02:30 across midnight
- `lib/format.test.ts` — INR lakh grouping, signed P/L, lots, prices
- `lib/accounts.test.ts` — health (incl. STALE), filters, sorting, portfolio aggregation
- `lib/alerts.test.ts`, `lib/trades.test.ts` — filtering, TP distance, weighted entry
- `services/dataProvider.test.ts` — backend failures reject with no fallback; only GET/PATCH ever
  issued; no control method exists on the provider
- `architecture.test.ts` — no trading-execution identifiers anywhere in `src/`, no local API routes,
  `apiClient` has no `delete`, and UI code never imports a provider, `fetch`, or `Math.random`
  directly

`backend/` has its own `npm test` (`cd backend && npm test`, plain `node:test`, zero dependencies):
`test/readOnly.test.js` mirrors `architecture.test.ts` for the backend, `test/alerts.test.js` checks
the delta-to-alert logic, `test/tradingWindow.test.js` checks the same IST boundaries as the
frontend's own `lib/tradingWindow.test.ts`.

---

## Security

- No broker passwords, MT5 credentials or account secrets anywhere in this repo, the frontend, any
  `.env*` file, or localStorage — MT5 login happens only inside MT5 itself, on the machine/VPS
  running it, and nothing here ever asks for it.
- localStorage holds only UI preferences (theme, currency, filters, notification toggles).
- The backend supports a shared-secret `API_KEY` / `NEXT_PUBLIC_API_KEY` pair (see
  `backend/.env.example`) — unset by default for local testing, but **set it before the backend is
  reachable from the internet** (e.g. once deployed on the VPS, see `docs/VPS_DEPLOYMENT.md`).
- Security headers set in `next.config.mjs` (`X-Frame-Options: DENY`, `nosniff`, referrer policy).
