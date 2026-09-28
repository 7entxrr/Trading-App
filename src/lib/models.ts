/**
 * The app's own view models — what each screen needs to display.
 *
 * These are NOT the GoldMiner API's field names. Raw API responses are turned
 * into these types in `lib/api/mappers.ts`, which is the only place that will
 * know real response fields. Anything the backend does not provide stays null
 * and is shown as unavailable — values are never invented or estimated.
 */

export type Side = "buy" | "sell";

export type ConnectionState = "connected" | "disconnected" | "stale" | "unknown";

export interface SystemStatus {
  mt5: ConnectionState;
  /** Backend infers this from AccountInfo.trade_expert (terminal Algo Trading flag). */
  eaRunning: boolean | null;
  lastHeartbeat: string | null;
  heartbeatAgeSeconds: number | null;
  stale: boolean;
  symbol: string | null;
  multiplier: number | null;
  slab: string | null;
  tradingWindow: TradingWindow | null;
}

/** GoldMiner working window (logic.trading_window_state) — display only. */
export interface TradingWindow {
  active: boolean;
  session: string | null;
  timezone: string | null;
  localTime: string | null;
  sessions: { start: string; end: string }[];
}

export interface Account {
  login: string | null;
  server: string | null;
  currency: string | null;
  balance: number | null;
  equity: number | null;
  margin: number | null;
  freeMargin: number | null;
  marginLevel: number | null;
  /** Floating profit/loss of open positions */
  profit: number | null;
  leverage: number | null;
  tradeAllowed: boolean | null;
  tradeExpert: boolean | null;
  timestamp: string | null;
  broker: string | null;
  credit: number | null;
}

export interface Position {
  ticket: string;
  symbol: string | null;
  side: Side;
  volume: number;
  openPrice: number | null;
  currentPrice: number | null;
  sl: number | null;
  tp: number | null;
  profit: number | null;
  swap: number | null;
  magic: number | null;
  comment: string | null;
  openTime: string | null;
  /** True when magic = GoldMiner main magic (backend-computed). */
  isGoldminer: boolean | null;
}

export interface PendingOrder {
  ticket: string;
  symbol: string | null;
  side: Side | null;
  orderType: string | null;
  volume: number | null;
  price: number | null;
  sl: number | null;
  tp: number | null;
  time: string | null;
}

export interface Trade {
  id: string;
  /** MT5 deal type label: BUY, SELL, BALANCE, CREDIT, … */
  typeLabel: string | null;
  positionId: string | null;
  symbol: string | null;
  side: Side | null;
  volume: number | null;
  price: number | null;
  profit: number | null;
  commission: number | null;
  swap: number | null;
  fee: number | null;
  magic: number | null;
  comment: string | null;
  time: string | null;
}

export interface Basket {
  side: Side;
  count: number | null;
  lots: number | null;
  vwap: number | null;
  tp: number | null;
  floatingPnl: number | null;
}

export interface TimePoint {
  /** ISO timestamp */
  time: string;
  value: number;
}

export interface Performance {
  balance: TimePoint[];
  equity: TimePoint[];
  /** Backend says it is still collecting history (fewer than 2 snapshots) */
  collecting: boolean;
  snapshotCount: number;
}

export interface Alert {
  id: string;
  kind: string | null;
  message: string;
  time: string | null;
  severity: string | null;
}

export interface ProtectionRule {
  enabled: boolean;
  /** "equity_amount" (absolute) or "equity_percent" (of balance) */
  mode: string | null;
  target: number | null;
  current: number | null;
  action: string | null;
  triggered: boolean;
  executionStatus: string | null;
  triggeredAt: string | null;
  lastError: string | null;
}

export interface Protection {
  tp: ProtectionRule | null;
  sl: ProtectionRule | null;
}

export interface Command {
  id: string;
  action: string;
  status: string;
  ticket: string | null;
  requestId: string | null;
  time: string | null;
  message: string | null;
}

/** Current gold quote, if the backend exposes one (e.g. in the snapshot). */
export interface Market {
  symbol: string | null;
  bid: number | null;
  ask: number | null;
  /** Change since the start of the trading day, if provided */
  change: number | null;
  /** Price history for the chart, if provided. Never generated client-side. */
  history: TimePoint[] | null;
}
