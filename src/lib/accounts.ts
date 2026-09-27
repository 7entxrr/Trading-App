import type { Account, AccountHealth, PortfolioSummary } from '@/types/domain';

/** Drawdown thresholds that drive the WARNING / CRITICAL roll-up. */
export const DRAWDOWN_WARNING_PCT = 10;
export const DRAWDOWN_CRITICAL_PCT = 20;

/** Beyond this the heartbeat is treated as stale even if the status says ONLINE. */
export const STALE_HEARTBEAT_MINUTES = 5;

/**
 * Single source of truth for "how worried should I be about this account".
 *
 * Connectivity outranks drawdown: an offline terminal means the numbers on
 * screen are stale, which is worse than a known-bad but observable equity.
 * All of this reflects backend-reported state — nothing is inferred from
 * random or demo values.
 */
export function getAccountHealth(account: Account, now: Date = new Date()): AccountHealth {
  if (account.mt5Status === 'OFFLINE' || account.eaStatus === 'OFFLINE') return 'CRITICAL';
  if (account.drawdownPct >= DRAWDOWN_CRITICAL_PCT) return 'CRITICAL';
  if (isHeartbeatStale(account, now)) return 'STALE';
  if (account.drawdownPct >= DRAWDOWN_WARNING_PCT) return 'WARNING';
  if (!account.tradingEnabled) return 'WARNING';
  return 'HEALTHY';
}

/** The terminal claims to be online but has not reported recently. */
export function isHeartbeatStale(account: Account, now: Date = new Date()): boolean {
  const ageMinutes = (now.getTime() - new Date(account.lastHeartbeat).getTime()) / 60_000;
  return ageMinutes > STALE_HEARTBEAT_MINUTES;
}

/** Short human reason behind the health roll-up, shown next to the badge. */
export function getAccountHealthReason(account: Account, now: Date = new Date()): string {
  if (account.mt5Status === 'OFFLINE') return 'MT5 terminal offline';
  if (account.eaStatus === 'OFFLINE') return 'GoldMiner EA disconnected';
  if (account.drawdownPct >= DRAWDOWN_CRITICAL_PCT) return 'Severe drawdown';
  if (isHeartbeatStale(account, now)) return 'No recent heartbeat — data may be stale';
  if (account.drawdownPct >= DRAWDOWN_WARNING_PCT) return 'Elevated drawdown';
  if (!account.tradingEnabled) return 'New trades paused';
  return 'All systems normal';
}

export function isAccountOnline(account: Account): boolean {
  return account.mt5Status === 'ONLINE' && account.eaStatus === 'ONLINE';
}

export type AccountFilter =
  | 'ALL'
  | 'ONLINE'
  | 'OFFLINE'
  | 'TRADING_ON'
  | 'TRADING_PAUSED'
  | 'PROFIT'
  | 'LOSS'
  | 'WARNING';

export type AccountSort = 'PNL' | 'BALANCE' | 'EQUITY' | 'STATUS';

export const ACCOUNT_FILTERS: { value: AccountFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'OFFLINE', label: 'Offline' },
  { value: 'TRADING_ON', label: 'Trading ON' },
  { value: 'TRADING_PAUSED', label: 'Paused' },
  { value: 'PROFIT', label: 'Profit' },
  { value: 'LOSS', label: 'Loss' },
  { value: 'WARNING', label: 'Warning' },
];

export const ACCOUNT_SORTS: { value: AccountSort; label: string }[] = [
  { value: 'STATUS', label: 'Status' },
  { value: 'PNL', label: "Today's P/L" },
  { value: 'BALANCE', label: 'Balance' },
  { value: 'EQUITY', label: 'Equity' },
];

export function matchesAccountFilter(account: Account, filter: AccountFilter): boolean {
  switch (filter) {
    case 'ALL':
      return true;
    case 'ONLINE':
      return isAccountOnline(account);
    case 'OFFLINE':
      return !isAccountOnline(account);
    case 'TRADING_ON':
      return account.tradingEnabled;
    case 'TRADING_PAUSED':
      return !account.tradingEnabled;
    case 'PROFIT':
      return account.todayPnL > 0;
    case 'LOSS':
      return account.todayPnL < 0;
    case 'WARNING':
      return getAccountHealth(account) !== 'HEALTHY';
  }
}

export function matchesAccountSearch(account: Account, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;
  return (
    account.accountNumber.toLowerCase().includes(trimmed) ||
    account.broker.toLowerCase().includes(trimmed) ||
    account.server.toLowerCase().includes(trimmed)
  );
}

const HEALTH_RANK: Record<AccountHealth, number> = {
  CRITICAL: 0,
  WARNING: 1,
  STALE: 2,
  HEALTHY: 3,
};

export function filterAndSortAccounts(
  accounts: Account[],
  options: { query?: string; filter?: AccountFilter; sort?: AccountSort } = {},
): Account[] {
  const { query = '', filter = 'ALL', sort = 'STATUS' } = options;

  const filtered = accounts.filter(
    (account) => matchesAccountFilter(account, filter) && matchesAccountSearch(account, query),
  );

  return [...filtered].sort((a, b) => {
    switch (sort) {
      case 'PNL':
        return b.todayPnL - a.todayPnL;
      case 'BALANCE':
        return b.balance - a.balance;
      case 'EQUITY':
        return b.equity - a.equity;
      case 'STATUS': {
        const byHealth = HEALTH_RANK[getAccountHealth(a)] - HEALTH_RANK[getAccountHealth(b)];
        if (byHealth !== 0) return byHealth;
        // Master first, then largest accounts.
        if (a.role !== b.role) return a.role === 'MASTER' ? -1 : 1;
        return b.equity - a.equity;
      }
    }
  });
}

/**
 * Portfolio totals, always computed from the account list.
 *
 * Nothing here is fetched or hardcoded, so when real MT5 accounts replace the
 * demo estate the Home dashboard is correct automatically.
 */
export function summarisePortfolio(accounts: Account[]): PortfolioSummary {
  const summary: PortfolioSummary = {
    currency: accounts[0]?.currency ?? 'INR',
    totalBalance: 0,
    totalEquity: 0,
    todayPnL: 0,
    floatingPnL: 0,
    totalAccounts: accounts.length,
    onlineAccounts: 0,
    offlineAccounts: 0,
    tradingEnabledAccounts: 0,
    tradingPausedAccounts: 0,
    warningAccounts: 0,
    openPositions: 0,
    openBaskets: 0,
    buyBaskets: 0,
    sellBaskets: 0,
  };

  for (const account of accounts) {
    summary.totalBalance += account.balance;
    summary.totalEquity += account.equity;
    summary.todayPnL += account.todayPnL;
    summary.floatingPnL += account.floatingPnL;
    summary.openPositions += account.openPositions;

    if (isAccountOnline(account)) summary.onlineAccounts += 1;
    else summary.offlineAccounts += 1;

    if (account.tradingEnabled) summary.tradingEnabledAccounts += 1;
    else summary.tradingPausedAccounts += 1;

    if (getAccountHealth(account) !== 'HEALTHY') summary.warningAccounts += 1;

    for (const basket of account.baskets) {
      summary.openBaskets += 1;
      if (basket.direction === 'BUY') summary.buyBaskets += 1;
      else summary.sellBaskets += 1;
    }
  }

  return summary;
}
