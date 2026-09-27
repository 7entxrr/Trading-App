# MT5 read-only bridge

This folder is the MT5-facing half of the pipeline. It is **not** part of the
Next.js app and is not built, run, or imported by it — it is documentation and
a script you install into MetaTrader 5 yourself, on the machine (or VPS) that
runs the MT5 terminals, once you're ready to connect real accounts.

```
MT5 terminal(s)
   ↓  (GoldMinerMonitor.mq5, attached to one chart per terminal)
Common\Files\goldminer_snapshot_<login>.json   (read-only snapshot, written on a timer)
   ↓  (../backend — plain Node.js, zero dependencies)
GET /accounts, /accounts/:id/trades, /accounts/:id/baskets, /copier/status, /system/status …
   ↓  HTTPS
This dashboard (NEXT_PUBLIC_API_BASE_URL)
```

**There is no arrow pointing the other way.** The dashboard cannot reach MT5,
and this script cannot execute a trade — see [`../docs/READ_ONLY.md`](../docs/READ_ONLY.md).

## `GoldMinerMonitor.mq5`

An Expert Advisor you attach to one chart per MT5 terminal (master and each
slave). On a timer it writes a JSON snapshot of that terminal's account,
positions, and GoldMiner baskets to the shared Common Files folder. That's the
entire job. It never calls a trading function.

**Read-only functions used** — `AccountInfoInteger/Double/String`,
`PositionsTotal`, `PositionGetTicket`, `PositionSelectByTicket`,
`PositionGetInteger/Double/String`, `SymbolInfoDouble`,
`TerminalInfoInteger(TERMINAL_CONNECTED, TERMINAL_TRADE_ALLOWED)`,
`HistorySelect`, `HistorySelectByPosition`, `HistoryDealsTotal`,
`HistoryDealGetTicket`, `HistoryDealGetDouble/Integer` — all read-only deal
*history* lookups (today's realised P/L and each position's already-charged
commission), never a mutation.

**Never used, and must never be added:** `CTrade`, `OrderSend`,
`OrderCheck`, `PositionClose`, `PositionModify`, `OrderModify`, `OrderDelete`,
or any other order/position mutation API. The script does not `#include
<Trade\Trade.mqh>` for exactly this reason — that header is where `CTrade`
lives, and not including it makes accidentally calling it a compile error
instead of a silent risk.

### Install

1. Copy `GoldMinerMonitor.mq5` into `MQL5/Experts/` in each terminal's data
   folder (File → Open Data Folder in MetaTrader).
2. Compile it in MetaEditor. Confirm the compile log shows no references to
   `CTrade` or any `OrderSend`/`PositionClose`/`PositionModify` symbol —
   there shouldn't be any, since the script never imports them.
3. Attach it to any one chart in each terminal (symbol doesn't matter; it
   reads account-wide and per-position data, not just the chart's symbol).
   Enable **Allow Algo Trading** only because MT5 requires it for any EA to
   run `OnTimer` — this script does not place trades regardless of that
   setting.
4. It writes `goldminer_snapshot_<login>.json` into the terminal's **Common**
   data folder every `InpIntervalSeconds` (default 5s), e.g.:
   `C:\Users\<you>\AppData\Roaming\MetaQuotes\Terminal\Common\Files\`
5. Repeat for the master and every slave terminal. One file per account
   number appears in the shared Common folder.

### The backend

[`../backend/`](../backend/) is a reference implementation of exactly this
service (plain Node.js, zero dependencies) — see
[`../backend/README.md`](../backend/README.md). It:

1. Polls the Common Files folder and re-reads each changed
   `goldminer_snapshot_*.json`.
2. Serves the endpoints in the [README's backend contract](../README.md#backend-api-contract),
   translating the raw snapshot into the `Account` / `Trade` / `Basket` /
   `CopierStatus` / `SystemStatus` shapes in `src/types/domain.ts`.
3. Exposes **GET routes only**, plus `PATCH /alerts` and `PATCH /alerts/:id`
   for the dashboard's local read/unread flag. No route accepts anything
   that reaches MT5 — enforced by `backend/test/readOnly.test.js`.
4. Derives `Alert`s from snapshot deltas (a basket disappearing → "basket
   closed", a heartbeat going stale → "monitor heartbeat lost", etc.) — the
   MQL5 script only reports current state, not a history of events.
5. Sets `SystemStatus.mt5AgentConnected` from whether any account's snapshot
   file has updated within `STALE_HEARTBEAT_MINUTES` — a stale file means the
   bridge (or the terminal, or algo trading) stopped, and the backend says so
   rather than serving old numbers as if they were live.

### Basket aggregation

The script groups open positions by `(symbol, magic, direction)` and reports
each group as a basket: position count, total volume, volume-weighted average
entry, and — only when every position in the group carries the same TP — that
shared value as `basketTP`. It does not know GoldMiner's grid/TP logic itself;
it only reports what MT5 already shows per position, aggregated the way
GoldMiner's own baskets are structured (see the `magic`/`hedgeMagicNumber`
constants in `src/config/goldminer.ts`, which this script's inputs default to).

### EA status

The script reports `algoTradingEnabled` — whether *this terminal* currently
permits any EA to trade (`TerminalInfoInteger(TERMINAL_TRADE_ALLOWED)`) —
alongside `terminalConnected`. The backend uses both as its `eaStatus` proxy.

This is a real limitation, not an oversight: MQL5 has no API for one script
to ask "is a *different* EA (GoldMiner) currently attached and running on
some chart" — that information isn't exposed to other programs. A fully
verified GoldMiner heartbeat is only possible if GoldMiner itself publishes
one — for example one extra `GlobalVariableSet("GM_HEARTBEAT_<login>", (double)TimeGMT())`
call at the very end of its own `OnTick()`, which this script (or the
backend) could then read with `GlobalVariableGet`. That is an edit to the
*live trading EA*, so it is deliberately **not** made automatically by
anything in this repo — decide and apply it yourself if you want it,
directly in GoldMiner's own source, with the same care you'd give any change
to a strategy trading real money.
