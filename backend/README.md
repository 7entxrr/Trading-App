# GoldMiner backend

The read-only service that turns `goldminer_snapshot_<login>.json` files
(written by [`../mt5-bridge/GoldMinerMonitor.mq5`](../mt5-bridge/GoldMinerMonitor.mq5))
into the HTTP contract the dashboard consumes (see [`../README.md`](../README.md#backend-api-contract)).

```
MT5 terminal(s) → GoldMinerMonitor.mq5 → Common\Files\goldminer_snapshot_*.json
                                                    ↓ (polled every SNAPSHOT_POLL_MS)
                                          this backend (Node, zero dependencies)
                                                    ↓ HTTPS, GET + PATCH only
                                              the dashboard
```

**Zero npm dependencies.** The whole service is plain Node.js `http` +
`fs`. There is nothing to `npm install` and nothing that can fail to build —
just `node server.js`. This matters most on the VPS: less that can go wrong
in a fresh Windows environment.

**Strictly read-only.** This service only ever reads snapshot files already
written to disk by the monitor EA. It has no MT5 client, no login, no way to
reach a broker. Its own HTTP surface is GET everywhere plus `PATCH` for the
dashboard's alert read/unread flag — see [`../docs/READ_ONLY.md`](../docs/READ_ONLY.md).
`backend/test/readOnly.test.js` greps the whole service for trading
identifiers and for any `POST`/`PUT`/`DELETE` method check, the same way
`src/architecture.test.ts` guards the frontend.

## Run it

```bash
cd backend
copy .env.example .env      # then edit SNAPSHOT_DIR if needed
node server.js
```

Or via npm (same thing): `npm start`. Run the tests with `npm test`.

## Configuration

See [`.env.example`](.env.example) for the full list with explanations. The
two you actually need to touch:

| Variable | What it is |
| --- | --- |
| `SNAPSHOT_DIR` | The MT5 `Common\Files` folder — shared by every terminal on the machine. On Windows this is always `%APPDATA%\MetaQuotes\Terminal\Common\Files`. |
| `API_KEY` | Leave blank for local-machine testing. Set it before this backend is reachable from the internet (e.g. on the VPS) — the dashboard sends it back via `NEXT_PUBLIC_API_KEY`. |

## What it actually does every poll cycle (`SNAPSHOT_POLL_MS`, default 2s)

1. `src/snapshotStore.js` re-reads every `goldminer_snapshot_*.json` in
   `SNAPSHOT_DIR` whose mtime changed since the last poll.
2. `src/build.js` turns each snapshot into an `Account`, its `Trade[]` and
   `Basket[]`:
   - `floatingPnL` = `equity - balance` (correct by construction — no need to
     re-sum swap/commission separately).
   - `todayPnL` comes straight from the monitor's `todayRealizedPnL`, which
     the EA computes from `HistorySelect` since the last `DAY_RESET_HOUR_IST`
     boundary (default 04:00 IST).
   - `drawdownPct` is `(peakEquity - equity) / peakEquity`, where
     `peakEquity` is a running max persisted in `data/peak-equity.json` (MT5
     does not expose historical peak equity directly).
   - `tradingEnabled` is computed from the same fixed IST working-window
     schedule the frontend already renders (`src/tradingWindow.js` mirrors
     `src/lib/tradingWindow.ts` + `src/config/goldminer.ts`) — GoldMiner's
     Working Window is a known, documented configuration, not something the
     monitor can read out of the EA directly (see the EA status caveat
     below), so this reports that known configuration rather than guessing.
   - `pointsToTarget` per basket uses each basket's own `symbolPoint` (read
     from MT5 via `SymbolInfoDouble`, not hardcoded).
3. `src/alerts.js` diffs this cycle's state against the previous cycle's (kept
   in memory) and appends any new `Alert`s to `data/alerts.json` — basket
   opened/closed, grid level added, drawdown threshold crossed, EA/MT5/
   heartbeat transitions, trading window flips. The very first observation of
   an account never emits alerts (nothing to diff against yet), so restarting
   the backend doesn't spam "new basket opened" for baskets that were already
   open.
4. A `PerformancePoint` is appended to `data/performance-<login>.json` and
   `data/performance-portfolio.json` (throttled to at most one point per 30s),
   pruned to 14 days on disk; the API serves only points since the current
   GoldMiner trading day started.

## EA status — a known limitation

`eaStatus` reports whether this *terminal* permits any EA to trade
(`TerminalInfoInteger(TERMINAL_TRADE_ALLOWED)`) combined with the terminal
being connected. MQL5 has no API for one script to ask "is a *different*
EA currently attached and running on some chart" — that information simply
isn't exposed. So `eaStatus: ONLINE` means "this terminal would let GoldMiner
trade if it's attached," not a verified read of GoldMiner's own internal
state. This is documented in [`../mt5-bridge/README.md`](../mt5-bridge/README.md#ea-status)
and was a known gap before this backend existed — nothing here invents
certainty that isn't available. If you want a truly verified GoldMiner
heartbeat later, the only way is to have GoldMiner itself publish one (e.g.
one extra `GlobalVariableSet` call at the end of its own `OnTick`) — that is
an edit to the live trading EA, so it's deliberately left for you to decide
and apply yourself rather than done automatically here.

## Running it long-term (Windows)

For local testing, just leave the `node server.js` window open. To run it as
a background Windows service (recommended once this moves to the VPS so it
survives reboots and log-offs), use [NSSM](https://nssm.cc/) (a small, widely
used, free Windows service wrapper — download the binary from the official
site):

```powershell
nssm install GoldMinerBackend "C:\Program Files\nodejs\node.exe" "C:\path\to\trade-dashboard\backend\server.js"
nssm set GoldMinerBackend AppDirectory "C:\path\to\trade-dashboard\backend"
nssm start GoldMinerBackend
```

See [`../docs/VPS_DEPLOYMENT.md`](../docs/VPS_DEPLOYMENT.md) for the full
VPS setup (MT5 + this backend + the dashboard + HTTPS) once you're ready to
move off this laptop.
