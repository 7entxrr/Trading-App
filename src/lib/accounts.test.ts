import { describe, expect, it } from 'vitest';

import {
  filterAndSortAccounts,
  getAccountHealth,
  isAccountOnline,
  matchesAccountFilter,
  matchesAccountSearch,
  summarisePortfolio,
} from '@/lib/accounts';
import type { Account, Basket } from '@/types/domain';

function basket(direction: 'BUY' | 'SELL', positions = 2): Basket {
  return {
    id: `b-${direction}`,
    accountId: 'a',
    accountNumber: '1',
    direction,
    symbol: 'XAUUSD.c',
    positionCount: positions,
    totalLots: 0.03,
    averageEntry: 4335,
    basketTP: direction === 'BUY' ? 4336.5 : 4333.5,
    pnl: 120,
    openedAt: new Date().toISOString(),
    pointsToTarget: 150,
  };
}

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: 'acc-1',
    accountNumber: '33814735',
    broker: 'STARTRADER',
    server: 'STARTRADER-Live',
    role: 'SLAVE',
    currency: 'INR',
    balance: 20000,
    equity: 20500,
    margin: 1200,
    freeMargin: 19300,
    marginLevel: 1708,
    todayPnL: 500,
    floatingPnL: 500,
    openPositions: 2,
    peakEquity: 21000,
    drawdownPct: 2,
    eaStatus: 'ONLINE',
    mt5Status: 'ONLINE',
    tradingEnabled: true,
    lastHeartbeat: new Date().toISOString(),
    baskets: [basket('BUY')],
    ...overrides,
  };
}

describe('getAccountHealth', () => {
  it('treats a healthy connected account as healthy', () => {
    expect(getAccountHealth(account())).toBe('HEALTHY');
  });

  it('escalates a disconnected EA to critical even when figures look fine', () => {
    expect(getAccountHealth(account({ eaStatus: 'OFFLINE' }))).toBe('CRITICAL');
  });

  it('escalates an offline terminal to critical', () => {
    expect(getAccountHealth(account({ mt5Status: 'OFFLINE' }))).toBe('CRITICAL');
  });

  it('ranks connectivity above drawdown', () => {
    // A live account in 15% drawdown is a warning; a dead one is critical.
    expect(getAccountHealth(account({ drawdownPct: 15 }))).toBe('WARNING');
    expect(getAccountHealth(account({ drawdownPct: 15, mt5Status: 'OFFLINE' }))).toBe(
      'CRITICAL',
    );
  });

  it('flags severe drawdown as critical', () => {
    expect(getAccountHealth(account({ drawdownPct: 22 }))).toBe('CRITICAL');
  });

  it('treats a paused account as a warning, not a failure', () => {
    expect(getAccountHealth(account({ tradingEnabled: false }))).toBe('WARNING');
  });
});

describe('isAccountOnline', () => {
  it('requires both the terminal and the EA', () => {
    expect(isAccountOnline(account())).toBe(true);
    expect(isAccountOnline(account({ eaStatus: 'OFFLINE' }))).toBe(false);
    expect(isAccountOnline(account({ mt5Status: 'OFFLINE' }))).toBe(false);
  });
});

describe('account filtering', () => {
  it('matches each filter against the right property', () => {
    expect(matchesAccountFilter(account(), 'ALL')).toBe(true);
    expect(matchesAccountFilter(account({ todayPnL: 100 }), 'PROFIT')).toBe(true);
    expect(matchesAccountFilter(account({ todayPnL: 100 }), 'LOSS')).toBe(false);
    expect(matchesAccountFilter(account({ todayPnL: -100 }), 'LOSS')).toBe(true);
    expect(matchesAccountFilter(account({ tradingEnabled: false }), 'TRADING_PAUSED')).toBe(true);
    expect(matchesAccountFilter(account({ eaStatus: 'OFFLINE' }), 'OFFLINE')).toBe(true);
    expect(matchesAccountFilter(account({ drawdownPct: 15 }), 'WARNING')).toBe(true);
  });

  it('excludes a flat account from both profit and loss', () => {
    expect(matchesAccountFilter(account({ todayPnL: 0 }), 'PROFIT')).toBe(false);
    expect(matchesAccountFilter(account({ todayPnL: 0 }), 'LOSS')).toBe(false);
  });

  it('searches login, broker and server case-insensitively', () => {
    expect(matchesAccountSearch(account(), '3381')).toBe(true);
    expect(matchesAccountSearch(account(), 'startrader')).toBe(true);
    expect(matchesAccountSearch(account(), 'LIVE')).toBe(true);
    expect(matchesAccountSearch(account(), 'exness')).toBe(false);
    expect(matchesAccountSearch(account(), '   ')).toBe(true);
  });

  it('sorts worst-health accounts first by default', () => {
    const healthy = account({ id: 'healthy', accountNumber: '1' });
    const offline = account({ id: 'offline', accountNumber: '2', mt5Status: 'OFFLINE' });
    const paused = account({ id: 'paused', accountNumber: '3', tradingEnabled: false });

    const sorted = filterAndSortAccounts([healthy, paused, offline], { sort: 'STATUS' });
    expect(sorted.map((a) => a.id)).toEqual(['offline', 'paused', 'healthy']);
  });

  it('sorts by P/L descending', () => {
    const low = account({ id: 'low', todayPnL: -50 });
    const high = account({ id: 'high', todayPnL: 900 });
    expect(filterAndSortAccounts([low, high], { sort: 'PNL' }).map((a) => a.id)).toEqual([
      'high',
      'low',
    ]);
  });

  it('does not mutate the input array', () => {
    const input = [account({ id: 'a', todayPnL: 1 }), account({ id: 'b', todayPnL: 2 })];
    const snapshot = input.map((a) => a.id);
    filterAndSortAccounts(input, { sort: 'PNL' });
    expect(input.map((a) => a.id)).toEqual(snapshot);
  });
});

describe('summarisePortfolio', () => {
  it('aggregates money, connectivity and basket counts', () => {
    const summary = summarisePortfolio([
      account({ id: '1', balance: 20000, equity: 20500, todayPnL: 500, floatingPnL: 500 }),
      account({
        id: '2',
        balance: 10000,
        equity: 9000,
        todayPnL: -1000,
        floatingPnL: -1000,
        mt5Status: 'OFFLINE',
        baskets: [basket('SELL')],
      }),
      account({
        id: '3',
        balance: 5000,
        equity: 5000,
        todayPnL: 0,
        floatingPnL: 0,
        tradingEnabled: false,
        openPositions: 0,
        baskets: [],
      }),
    ]);

    expect(summary.totalBalance).toBe(35000);
    expect(summary.totalEquity).toBe(34500);
    expect(summary.todayPnL).toBe(-500);
    expect(summary.totalAccounts).toBe(3);
    expect(summary.onlineAccounts).toBe(2);
    expect(summary.offlineAccounts).toBe(1);
    expect(summary.tradingPausedAccounts).toBe(1);
    expect(summary.buyBaskets).toBe(1);
    expect(summary.sellBaskets).toBe(1);
    expect(summary.openBaskets).toBe(2);
    expect(summary.openPositions).toBe(4);
  });

  it('counts BUY and SELL baskets on the same hedging account separately', () => {
    const hedged = account({ baskets: [basket('BUY'), basket('SELL')] });
    const summary = summarisePortfolio([hedged]);
    expect(summary.buyBaskets).toBe(1);
    expect(summary.sellBaskets).toBe(1);
    expect(summary.openBaskets).toBe(2);
  });

  it('handles an empty estate without dividing by zero', () => {
    const summary = summarisePortfolio([]);
    expect(summary.totalAccounts).toBe(0);
    expect(summary.totalBalance).toBe(0);
    expect(summary.currency).toBe('INR');
  });
});
