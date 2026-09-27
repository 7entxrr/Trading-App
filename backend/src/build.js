'use strict';

const config = require('./config');
const snapshotStore = require('./snapshotStore');
const historyStore = require('./historyStore');
const tradingWindow = require('./tradingWindow');
const { detectAccountDeltas, detectGlobalTradingWindowDelta } = require('./alerts');

/**
 * Turns raw MT5 snapshots into the Account/Trade/Basket shapes the dashboard
 * expects (see src/types/domain.ts), tracks deltas to emit alerts, and
 * records performance history. Recomputed on every snapshot poll.
 */

let latestAccounts = [];
let latestTradesByAccount = new Map();
let latestBasketsByAccount = new Map();
let previousAccountState = new Map(); // login -> {mt5Status, eaStatus, heartbeatStale, drawdownPct, baskets}
let previousTradingEnabled = null;
let lastBuildAt = null;

function pointsToTarget(direction, currentPrice, basketTP, symbolPoint) {
  if (basketTP === null || !symbolPoint) return null;
  const diff = direction === 'BUY' ? basketTP - currentPrice : currentPrice - basketTP;
  return Math.round(diff / symbolPoint);
}

function buildAccount(login, snap, now, tradingEnabled) {
  const data = snap.data;
  const accountNumber = String(login);
  const ageMs = now.getTime() - snap.mtimeMs;
  const heartbeatStale = ageMs > config.staleHeartbeatMinutes * 60_000;

  const terminalConnected = Boolean(data.terminalConnected);
  const mt5Status = terminalConnected ? 'ONLINE' : 'OFFLINE';
  // eaStatus is a best-effort proxy — GoldMinerMonitor cannot see inside the
  // separate GoldMiner EA process, only whether this terminal permits any EA
  // to trade at all. See mt5-bridge/README.md "EA status" for the limitation.
  const eaStatus = terminalConnected && data.algoTradingEnabled ? 'ONLINE' : 'OFFLINE';

  const balance = Number(data.balance) || 0;
  const equity = Number(data.equity) || 0;
  const margin = Number(data.margin) || 0;
  const freeMargin = Number(data.freeMargin) || 0;
  const marginLevel = margin > 0 ? Number(data.marginLevel) || 0 : null;
  const floatingPnL = equity - balance;
  const todayPnL = Number(data.todayRealizedPnL) || 0;

  const peakEquity = historyStore.trackPeakEquity(accountNumber, equity);
  const drawdownPct = peakEquity > 0 ? Math.max(0, ((peakEquity - equity) / peakEquity) * 100) : 0;

  const positions = Array.isArray(data.positions) ? data.positions : [];
  const rawBaskets = Array.isArray(data.baskets) ? data.baskets : [];

  // Current price per (direction, symbol) so baskets can compute distance to TP.
  const currentPriceByKey = new Map();
  for (const p of positions) {
    currentPriceByKey.set(`${p.direction}:${p.symbol}`, p.currentPrice);
  }

  const baskets = rawBaskets.map((b) => {
    const currentPrice = currentPriceByKey.get(`${b.direction}:${b.symbol}`) ?? b.averageEntry;
    const basketTP = b.basketTP === null || b.basketTP === undefined ? null : Number(b.basketTP);
    return {
      id: `${accountNumber}-${b.magic}-${b.direction}-${b.symbol}`,
      accountId: accountNumber,
      accountNumber,
      direction: b.direction,
      symbol: b.symbol,
      positionCount: b.positionCount,
      totalLots: b.totalLots,
      averageEntry: b.averageEntry,
      basketTP,
      pnl: b.pnl,
      openedAt: new Date(b.openedAt * 1000).toISOString(),
      pointsToTarget: pointsToTarget(b.direction, currentPrice, basketTP, b.symbolPoint),
      _magic: b.magic, // internal, stripped before serving
    };
  });

  const basketMagicKey = (magic, direction, symbol) => `${magic}:${direction}:${symbol}`;
  const basketIdByKey = new Map(baskets.map((b) => [basketMagicKey(b._magic, b.direction, b.symbol), b.id]));

  const trades = positions.map((p) => ({
    id: `${accountNumber}-${p.ticket}`,
    ticket: p.ticket,
    accountId: accountNumber,
    accountNumber,
    basketId: basketIdByKey.get(basketMagicKey(p.magic, p.direction, p.symbol)) ?? null,
    symbol: p.symbol,
    direction: p.direction,
    lot: p.lot,
    entryPrice: p.entryPrice,
    currentPrice: p.currentPrice,
    tp: p.tp > 0 ? p.tp : null,
    sl: p.sl > 0 ? p.sl : null,
    pnl: p.pnl,
    swap: p.swap,
    commission: p.commission ?? 0,
    openTime: new Date(p.openTime * 1000).toISOString(),
    magic: p.magic,
    comment: p.comment ?? '',
  }));

  const account = {
    id: accountNumber,
    accountNumber,
    broker: data.broker ?? '',
    server: data.server ?? '',
    role: config.accountRoles[accountNumber] || 'MASTER',
    currency: data.currency ?? 'USD',
    balance,
    equity,
    margin,
    freeMargin,
    marginLevel,
    todayPnL,
    floatingPnL,
    openPositions: data.openPositions ?? positions.length,
    peakEquity,
    drawdownPct,
    tradingEnabled,
    eaStatus,
    mt5Status,
    lastHeartbeat: new Date(snap.mtimeMs).toISOString(),
    baskets: baskets.map(({ _magic, ...rest }) => rest),
  };

  // --- Alert deltas ---------------------------------------------------
  const nextState = {
    mt5Status,
    eaStatus,
    heartbeatStale,
    drawdownPct,
    baskets: baskets.map((b) => ({
      direction: b.direction,
      symbol: b.symbol,
      magic: b._magic,
      positionCount: b.positionCount,
      totalLots: b.totalLots,
      pnl: b.pnl,
    })),
  };
  const prevState = previousAccountState.get(accountNumber) ?? null;
  for (const descriptor of detectAccountDeltas(accountNumber, prevState, nextState)) {
    historyStore.addAlert(descriptor);
  }
  previousAccountState.set(accountNumber, nextState);

  return { account, trades, baskets: account.baskets };
}

function refresh() {
  snapshotStore.poll();
  const now = new Date();
  const tradingEnabled = tradingWindow.isNewTradingAllowed(now);

  const windowDelta = detectGlobalTradingWindowDelta(previousTradingEnabled, tradingEnabled);
  if (windowDelta) historyStore.addAlert(windowDelta);
  previousTradingEnabled = tradingEnabled;

  const accounts = [];
  const tradesByAccount = new Map();
  const basketsByAccount = new Map();

  for (const [login, snap] of snapshotStore.getAll()) {
    if (!snap.data) continue; // never successfully parsed yet
    const { account, trades, baskets } = buildAccount(login, snap, now, tradingEnabled);
    accounts.push(account);
    tradesByAccount.set(account.id, trades);
    basketsByAccount.set(account.id, baskets);
  }

  latestAccounts = accounts;
  latestTradesByAccount = tradesByAccount;
  latestBasketsByAccount = basketsByAccount;
  lastBuildAt = now;

  const portfolioPnL = accounts.reduce((sum, a) => sum + a.todayPnL + a.floatingPnL, 0);
  historyStore.recordPerformancePoint('portfolio', portfolioPnL, now);
  for (const account of accounts) {
    historyStore.recordPerformancePoint(account.id, account.todayPnL + account.floatingPnL, now);
  }
}

function tradingDayStart(now = new Date()) {
  const IST_OFFSET_MS = 330 * 60_000;
  const nowIst = new Date(now.getTime() + IST_OFFSET_MS);
  const boundaryIst = new Date(
    Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), nowIst.getUTCDate(), config.dayResetHourIst, 0, 0),
  );
  if (nowIst.getTime() < boundaryIst.getTime()) boundaryIst.setUTCDate(boundaryIst.getUTCDate() - 1);
  return new Date(boundaryIst.getTime() - IST_OFFSET_MS);
}

function getAccounts() {
  return latestAccounts;
}

function getAccount(idOrNumber) {
  return latestAccounts.find((a) => a.id === idOrNumber || a.accountNumber === idOrNumber) ?? null;
}

function getTrades(accountId) {
  if (accountId) return latestTradesByAccount.get(accountId) ?? null;
  return [...latestTradesByAccount.values()].flat();
}

function getBaskets(accountId) {
  if (accountId) return latestBasketsByAccount.get(accountId) ?? null;
  return [...latestBasketsByAccount.values()].flat();
}

function getPortfolioPerformance() {
  return historyStore.getPerformanceSince('portfolio', tradingDayStart());
}

function getAccountPerformance(accountId) {
  if (!getAccount(accountId)) return null;
  return historyStore.getPerformanceSince(accountId, tradingDayStart());
}

function getSystemStatus() {
  const anyFresh = latestAccounts.some((a) => {
    const ageMs = Date.now() - new Date(a.lastHeartbeat).getTime();
    return ageMs <= config.staleHeartbeatMinutes * 60_000;
  });
  return {
    apiConnected: true,
    mt5AgentConnected: latestAccounts.length === 0 ? null : anyFresh,
    lastSyncAt: lastBuildAt ? lastBuildAt.toISOString() : null,
    version: '0.1.0',
  };
}

function getCopierStatus() {
  const master = latestAccounts.find((a) => a.role === 'MASTER') ?? latestAccounts[0] ?? null;
  const slaves = latestAccounts.filter((a) => a.role === 'SLAVE');
  if (!master) {
    return {
      masterAccountNumber: '',
      masterEaStatus: 'OFFLINE',
      masterTradingEnabled: false,
      copierStatus: 'OFFLINE',
      totalSlaves: 0,
      syncedSlaves: 0,
      failedSlaves: 0,
      lastTrade: null,
      lastSyncAt: lastBuildAt ? lastBuildAt.toISOString() : new Date().toISOString(),
    };
  }

  const masterTrades = latestTradesByAccount.get(master.id) ?? [];
  const lastTrade = masterTrades.length
    ? masterTrades.reduce((latest, t) => (new Date(t.openTime) > new Date(latest.openTime) ? t : latest))
    : null;

  const syncedSlaves = slaves.filter((s) => s.mt5Status === 'ONLINE' && s.eaStatus === 'ONLINE').length;

  return {
    masterAccountNumber: master.accountNumber,
    masterEaStatus: master.eaStatus,
    masterTradingEnabled: master.tradingEnabled,
    copierStatus: master.mt5Status === 'ONLINE' ? 'ONLINE' : 'OFFLINE',
    totalSlaves: slaves.length,
    syncedSlaves,
    failedSlaves: slaves.length - syncedSlaves,
    lastTrade: lastTrade
      ? { direction: lastTrade.direction, lot: lastTrade.lot, symbol: lastTrade.symbol, at: lastTrade.openTime }
      : null,
    lastSyncAt: lastBuildAt ? lastBuildAt.toISOString() : new Date().toISOString(),
  };
}

module.exports = {
  refresh,
  getAccounts,
  getAccount,
  getTrades,
  getBaskets,
  getPortfolioPerformance,
  getAccountPerformance,
  getSystemStatus,
  getCopierStatus,
};
