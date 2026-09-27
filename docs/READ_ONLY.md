# Read-only guarantee

This dashboard is a **monitoring viewer**, not a trading control panel. It can
read data from MT5 (via a backend and bridge) and display it. It has **no
capability, anywhere in the stack, to send a command back to MT5 or a broker.**

```
MT5  →  read-only bridge  →  backend (GET-only data)  →  this dashboard
```

There is no reverse path. The dashboard never sends anything to the backend
except:

- `GET` requests for data
- `PATCH /alerts` / `PATCH /alerts/:id` — marks a notification read/unread.
  This is local dashboard UI state, not a trading or account operation.
- `POST /notifications/subscribe` / `unsubscribe` — registers this browser for
  push notifications. Informational delivery only; never carries an action.

That's the complete list. No component, hook, service, or route in this repo
can pause, resume, close, modify, or place anything.

## What was removed, and why

An earlier draft of this dashboard included "Pause New Trades", "Resume New
Trades", and "Close All Positions" as control actions, each backed by a
`POST` endpoint. Per a later, explicit requirement, **all of that was
removed**:

- `ControlAction` / `ControlResult` types — deleted from `src/types/domain.ts`.
- `AccountControls.tsx` and `GlobalControls.tsx` components — deleted.
- `useAccountControl` / `useBulkControl` hooks — deleted.
- `accountsService.control` / `.controlAll` / `.pauseNewTrades` /
  `.resumeNewTrades` / `.closeAllPositions` — deleted.
- `DataProvider.controlAccount` / `.controlAllAccounts` — removed from the
  service contract in `src/services/contracts.ts`.
- Every `POST /accounts/:id/pause|resume|close-all` (and bulk equivalents) —
  deleted. No such route is defined anywhere in this app.
- `apiClient.delete` — removed. The client can no longer issue `DELETE` at all.

Nothing in the account model is writable from the UI: `tradingEnabled`,
`eaStatus`, `mt5Status` etc. are display-only fields reported by the backend,
never fields the dashboard sets.

## Enforcement

This isn't just a promise in prose — it's checked by `src/architecture.test.ts`
(part of `npm test`) on every run:

1. **No trading-execution identifiers anywhere in `src/`.** The test greps
   every non-test source file for `CTrade`, `OrderSend(`, `PositionClose(`,
   `PositionModify(`, `OrderModify(`, `OrderDelete(`, `.controlAccount`,
   `.controlAllAccounts`, `closeAllPositions`, `pauseNewTrades`,
   `resumeNewTrades`, and a bare `Buy(`/`Sell(` function call. If any of these
   patterns reappear, the test suite fails.
2. **`apiClient` has no `delete` method and never issues a `DELETE` request** —
   checked directly against the module's exports and its request whitelist.
3. **This app defines no local API routes at all** (`src/app/api` does not
   exist) — verified in the same test file. Every read goes to the real
   backend at `NEXT_PUBLIC_API_BASE_URL`.
4. **UI code never imports a data provider directly, calls `fetch`, or uses
   `Math.random`** — enforced across every file under `app/`, `components/`,
   `hooks/`, `lib/` and `providers/`.
5. `src/services/dataProvider.test.ts` asserts the provider exposes none of
   `controlAccount`, `controlAllAccounts`, `pauseNewTrades`, `resumeNewTrades`,
   `closeAllPositions`, `modifyPosition`, `placeOrder`, or `closePosition`, and
   that only `GET`/`PATCH` requests are ever issued.

Run `npm test` any time to re-verify all of the above.

## If you are extending this app

- **Never add a `POST`/`PUT`/`PATCH`/`DELETE` route, service method, or hook
  that changes trading or account state.** If you think you need one, stop —
  that is exactly the capability this dashboard is required not to have.
- `PATCH` is reserved for dashboard-only state (alert read/unread, push
  subscriptions). Don't repurpose it for anything MT5-facing.
- The MT5-facing side lives entirely outside the browser: MT5 → bridge →
  backend. See `mt5-bridge/README.md` for the read-only bridge contract. The
  bridge must never call `CTrade`, `OrderSend`, `PositionClose`,
  `PositionModify`, or any other execution API — only read functions
  (`AccountInfo*`, `PositionGet*`, `OrdersTotal`, `HistoryDeal*`,
  `SymbolInfo*`).
