import type {
  Account,
  Alert,
  Basket,
  Command,
  ConnectionState,
  Market,
  PendingOrder,
  Performance,
  Position,
  Protection,
  ProtectionRule,
  Side,
  SystemStatus,
  Trade,
} from "@/lib/models";

/**
 * ============================================================================
 *  LIVE-DATA MAPPING
 * ============================================================================
 *
 * Raw GoldMiner API responses → app view models.
 *
 * Source of truth: the backend code (main.py, poller.py, trading.py,
 * mt5_bridge.py, schemas.py). Every field read below is one those files
 * return. Position / order objects are MetaTrader5 `TradePosition` /
 * `TradeOrder` named tuples converted with `_asdict()` (mt5_bridge.py).
 *
 * Mapped:   status, account, positions, orders, snapshot (quote), protection, commands
 * PENDING:  trades, performance, alerts, baskets — their row fields are built in
 *           database.py / logic.py, which have not been provided. They are
 *           NOT guessed; those screens show "awaiting response mapping".
 *
 * Rules: missing values stay null (shown as "—"); numbers are kept exactly as
 * returned; MT5 uses 0.0 for "no SL/TP", which is mapped to null.
 */

export class UnmappedError extends Error {
  constructor(public resource: string) {
    super(`Response mapping for ${resource} is not implemented yet`);
    this.name = "UnmappedError";
  }
}

const pending =
  <T>(resource: string) =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (raw: unknown): T => {
    throw new UnmappedError(resource);
  };

/* ---------- helpers ---------- */

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const str = (v: unknown) => (typeof v === "string" && v !== "" ? v : null);
const bool = (v: unknown) => (typeof v === "boolean" ? v : null);
/** SQLite returns booleans as 0/1. */
const truthy = (v: unknown) => v === true || v === 1;
const id = (v: unknown) => (typeof v === "number" || typeof v === "string" ? String(v) : null);
/** MT5 stores "no SL/TP" as 0.0 */
const stop = (v: unknown) => {
  const n = num(v);
  return n === null || n === 0 ? null : n;
};
/** MT5 times are unix seconds */
const unixIso = (v: unknown) => (typeof v === "number" && v > 0 ? new Date(v * 1000).toISOString() : null);

/** main.py `envelope()`: { success, data, timestamp, stale } */
function unwrap(raw: unknown): { data: unknown; stale: boolean } {
  if (!isObj(raw) || !("data" in raw)) throw new Error("Unexpected response shape (missing envelope)");
  return { data: raw.data, stale: raw.stale === true };
}

/** MT5 ORDER_TYPE_* (documented in main.py): 0 BUY, 1 SELL, 2..7 pending */
const ORDER_TYPES: Record<number, { side: Side; label: string }> = {
  0: { side: "buy", label: "BUY" },
  1: { side: "sell", label: "SELL" },
  2: { side: "buy", label: "BUY LIMIT" },
  3: { side: "sell", label: "SELL LIMIT" },
  4: { side: "buy", label: "BUY STOP" },
  5: { side: "sell", label: "SELL STOP" },
  6: { side: "buy", label: "BUY STOP LIMIT" },
  7: { side: "sell", label: "SELL STOP LIMIT" },
};

/* ---------- GET /api/status ---------- */

export function mapStatus(raw: unknown): SystemStatus {
  const { data, stale } = unwrap(raw);
  const d = isObj(data) ? data : {};
  const conn = d.mt5_connection_status;
  const isStale = d.stale === true || stale;
  const mt5: ConnectionState =
    conn === "connected" ? (isStale ? "stale" : "connected") : conn === "disconnected" ? "disconnected" : "unknown";
  const bm = isObj(d.balance_multiplier) ? d.balance_multiplier : {};
  const slab = bm.current_balance_slab;
  return {
    mt5,
    eaRunning: d.ea_detection_status === "detected" ? true : d.ea_detection_status === "undetected" ? false : null,
    lastHeartbeat: str(d.last_successful_mt5_read),
    heartbeatAgeSeconds: num(d.heartbeat_age_seconds),
    stale: isStale,
    symbol: str(d.symbol),
    multiplier: num(bm.current_multiplier),
    slab: typeof slab === "string" || typeof slab === "number" ? String(slab) : null,
  };
}

/* ---------- GET /api/account ---------- */

export function mapAccount(raw: unknown): Account {
  const { data } = unwrap(raw);
  const a = isObj(data) ? data : {};
  return {
    login: id(a.login),
    server: str(a.server),
    broker: str(a.broker),
    currency: str(a.currency),
    balance: num(a.balance),
    credit: num(a.credit),
    equity: num(a.equity),
    margin: num(a.margin),
    freeMargin: num(a.free_margin),
    marginLevel: num(a.margin_level),
    profit: num(a.profit),
    leverage: num(a.leverage),
    tradeAllowed: bool(a.trade_allowed),
    tradeExpert: bool(a.trade_expert),
    timestamp: str(a.timestamp),
  };
}

/* ---------- GET /api/positions ---------- */

function toPosition(p: Obj): Position | null {
  const ticket = id(p.ticket);
  const side: Side | null =
    p.direction === "buy" || p.direction === "sell" ? p.direction : (ORDER_TYPES[num(p.type) ?? -1]?.side ?? null);
  const volume = num(p.volume);
  if (!ticket || !side || volume === null) return null;
  return {
    ticket,
    symbol: str(p.symbol),
    side,
    volume,
    openPrice: num(p.price_open),
    currentPrice: num(p.price_current),
    sl: stop(p.sl),
    tp: stop(p.tp),
    profit: num(p.profit),
    swap: num(p.swap),
    magic: num(p.magic),
    comment: str(p.comment),
    openTime: unixIso(p.time),
    isGoldminer: typeof p.is_goldminer === "boolean" ? p.is_goldminer : null,
  };
}

export function mapPositions(raw: unknown): Position[] {
  const { data } = unwrap(raw);
  if (!Array.isArray(data)) return [];
  return data.filter(isObj).map(toPosition).filter((p): p is Position => p !== null);
}

/* ---------- GET /api/orders ---------- */

export function mapOrders(raw: unknown): PendingOrder[] {
  const { data } = unwrap(raw);
  if (!Array.isArray(data)) return [];
  return data.filter(isObj).flatMap((o) => {
    const ticket = id(o.ticket);
    if (!ticket) return [];
    const t = ORDER_TYPES[num(o.type) ?? -1];
    return [
      {
        ticket,
        symbol: str(o.symbol),
        side: t?.side ?? null,
        orderType: t?.label ?? null,
        volume: num(o.volume_current),
        price: num(o.price_open),
        sl: stop(o.sl),
        tp: stop(o.tp),
        time: unixIso(o.time_setup),
      },
    ];
  });
}

/* ---------- GET /api/snapshot → current gold quote ---------- */

/**
 * The API has no quote endpoint and the snapshot does not expose the tick.
 * The only live price it returns is each open position's `price_current`
 * (MT5: the price the position would close at — bid for BUY, ask for SELL).
 * So the quote is available only while a gold position is open; otherwise null.
 */
export function mapMarket(raw: unknown): Market {
  const { data } = unwrap(raw);
  const d = isObj(data) ? data : {};
  const positions = Array.isArray(d.positions) ? d.positions.filter(isObj) : [];
  const gold = positions.filter((p) => typeof p.symbol === "string" && p.symbol.toUpperCase().startsWith("XAUUSD"));
  const bid = num(gold.find((p) => p.type === 0)?.price_current);
  const ask = num(gold.find((p) => p.type === 1)?.price_current);
  return {
    symbol: str(gold[0]?.symbol),
    bid,
    ask,
    change: null,
    history: null,
  };
}

/* ---------- GET /api/protection ---------- */

/** Row keys verified in poller.py: enabled, mode, target, triggered. */
function toRule(v: unknown): ProtectionRule | null {
  if (!isObj(v)) return null;
  return {
    enabled: truthy(v.enabled),
    mode: str(v.mode),
    target: num(v.target),
    current: null,
    action: null,
    triggered: truthy(v.triggered),
    executionStatus: null,
    triggeredAt: null,
    lastError: null,
  };
}

export function mapProtection(raw: unknown): Protection {
  const { data } = unwrap(raw);
  const d = isObj(data) ? data : {};
  return { tp: toRule(d.tp), sl: toRule(d.sl) };
}

/* ---------- GET /api/commands ---------- */

/** Row keys verified in trading.py `_row_to_response`. The row's time column isn't known yet. */
export function mapCommands(raw: unknown): Command[] {
  const { data } = unwrap(raw);
  if (!Array.isArray(data)) return [];
  return data.filter(isObj).flatMap((c) => {
    const requestId = str(c.request_id);
    const action = str(c.action);
    const status = str(c.status);
    if (!requestId || !action || !status) return [];
    return [
      {
        id: requestId,
        action,
        status,
        ticket: id(c.resulting_position_ticket),
        requestId,
        time: null,
        message: str(c.error) ?? str(c.mt5_comment),
      },
    ];
  });
}

/* ---------- PENDING: need database.py / logic.py ---------- */

/** GET /api/trades — rows from database.get_trade_history (database.py). */
export const mapTrades = pending<Trade[]>("GET /api/trades");
/** GET /api/performance — { status, snapshots } where snapshot rows come from database.py. */
export const mapPerformance = pending<Performance>("GET /api/performance");
/** GET /api/alerts — rows from database.get_recent_alerts (database.py). */
export const mapAlerts = pending<Alert[]>("GET /api/alerts");
/** GET /api/baskets — built by logic.compute_baskets (logic.py). */
export const mapBaskets = pending<Basket[]>("GET /api/baskets");
