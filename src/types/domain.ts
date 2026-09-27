/**
 * Domain models for the GoldMiner monitoring dashboard.
 *
 * This is the read-only contract between the UI and the backend: the backend
 * must produce exactly these shapes from real MT5 data (see
 * `mt5-bridge/README.md`). These also double as the conceptual schema for the
 * backend's `accounts`, `trades`, `baskets`, `alerts` and `copier_status`
 * tables. Nothing in this file has a mutating counterpart — see
 * `docs/READ_ONLY.md`.
 */

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export type ConnectionStatus = 'ONLINE' | 'OFFLINE';

/**
 * Derived health roll-up used to colour/label an account at a glance.
 * STALE means the backend is reachable but the terminal stopped reporting, so
 * the figures on screen are last-known rather than live.
 */
export type AccountHealth = 'HEALTHY' | 'WARNING' | 'STALE' | 'CRITICAL';

export type Direction = 'BUY' | 'SELL';

/** Master runs GoldMiner; slaves receive copied trades from the trade copier. */
export type AccountRole = 'MASTER' | 'SLAVE';

export interface Basket {
  id: string;
  accountId: string;
  accountNumber: string;
  direction: Direction;
  symbol: string;
  positionCount: number;
  totalLots: number;
  /** Volume-weighted average entry, supplied by the backend. */
  averageEntry: number;
  /** Shared take-profit for the whole basket. Null until the EA sets one. */
  basketTP: number | null;
  /** Unrealised P/L of the whole basket, in the account currency. */
  pnl: number;
  openedAt: string;
  /** Distance from the current market to the basket TP, in broker points. */
  pointsToTarget: number | null;
}

export interface Trade {
  id: string;
  ticket: number;
  accountId: string;
  accountNumber: string;
  basketId: string | null;
  symbol: string;
  direction: Direction;
  lot: number;
  entryPrice: number;
  currentPrice: number;
  tp: number | null;
  sl: number | null;
  pnl: number;
  swap: number;
  commission: number;
  openTime: string;
  magic: number;
  comment: string;
}

export interface Account {
  id: string;
  /** MT5 login, displayed as `#33814735`. */
  accountNumber: string;
  broker: string;
  server: string;
  role: AccountRole;
  currency: CurrencyCode;

  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  /** Percentage. `null` when there is no margin in use. */
  marginLevel: number | null;

  todayPnL: number;
  floatingPnL: number;

  openPositions: number;
  peakEquity: number;
  /** Drawdown from peak equity, as a positive percentage. */
  drawdownPct: number;

  /** Whether the EA is allowed to open NEW positions. Never implies closing. */
  tradingEnabled: boolean;
  eaStatus: ConnectionStatus;
  mt5Status: ConnectionStatus;
  lastHeartbeat: string;

  baskets: Basket[];
}

export type AlertType =
  | 'PROFIT'
  | 'DRAWDOWN'
  | 'EA_OFFLINE'
  | 'MT5_OFFLINE'
  | 'NEW_BASKET'
  | 'BASKET_CLOSED'
  | 'LOT_INCREASE'
  | 'TRADING_PAUSED'
  | 'TRADING_RESUMED'
  | 'SYSTEM_ERROR';

export type AlertSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';

export interface Alert {
  id: string;
  /** Null for portfolio-wide events such as copier failures. */
  accountNumber: string | null;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

/**
 * One point on the portfolio P/L curve.
 *
 * Semantics are fixed: `pnl` is TODAY'S CUMULATIVE PORTFOLIO P/L (realised
 * plus floating) in the display currency, measured at `timestamp`. It is not
 * equity and not a balance. The backend must return this exact meaning.
 */
export interface PerformancePoint {
  timestamp: string;
  pnl: number;
}

export interface CopierStatus {
  masterAccountNumber: string;
  masterEaStatus: ConnectionStatus;
  masterTradingEnabled: boolean;
  copierStatus: ConnectionStatus;
  totalSlaves: number;
  syncedSlaves: number;
  failedSlaves: number;
  lastTrade: {
    direction: Direction;
    lot: number;
    symbol: string;
    at: string;
  } | null;
  lastSyncAt: string;
}

/** Aggregate of every account. Always computed from account data, never stored. */
export interface PortfolioSummary {
  currency: CurrencyCode;
  totalBalance: number;
  totalEquity: number;
  todayPnL: number;
  floatingPnL: number;

  totalAccounts: number;
  onlineAccounts: number;
  offlineAccounts: number;
  tradingEnabledAccounts: number;
  tradingPausedAccounts: number;
  warningAccounts: number;

  openPositions: number;
  openBaskets: number;
  buyBaskets: number;
  sellBaskets: number;
}

/** Backend and trading-infrastructure reachability, surfaced in the UI. */
export interface SystemStatus {
  apiConnected: boolean;
  /** Null until a backend exists that can report on the MT5 agent. */
  mt5AgentConnected: boolean | null;
  lastSyncAt: string | null;
  version: string;
}

export type SessionId = 1 | 2;

export interface TradingSession {
  id: SessionId;
  label: string;
  /** Minutes from IST midnight. */
  startMinute: number;
  endMinute: number;
}

export interface TradingWindowState {
  isNewTradingAllowed: boolean;
  currentSession: SessionId | null;
  status: 'ACTIVE' | 'PAUSED';
  /** Start of the next session that allows new positions. */
  nextSessionStart: Date;
  nextSessionId: SessionId;
  /** End of the running session, or `null` when paused. */
  currentSessionEnd: Date | null;
  /** Minutes until the window flips state. */
  minutesUntilChange: number;
  sessions: TradingSession[];
}
