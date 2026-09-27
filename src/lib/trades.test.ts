import { describe, expect, it } from 'vitest';

import {
  basketProgressToTarget,
  filterTrades,
  matchesTradeFilter,
  pointsToTakeProfit,
  sumBasketLots,
  sumTradePnl,
  weightedAverageEntry,
} from '@/lib/trades';
import { goldminer } from '@/config/goldminer';
import type { Basket, Trade } from '@/types/domain';

function trade(overrides: Partial<Trade> = {}): Trade {
  return {
    id: 't1',
    ticket: 62100001,
    accountId: 'acc-1',
    accountNumber: '33814735',
    basketId: 'b1',
    symbol: 'XAUUSD.c',
    direction: 'BUY',
    lot: 0.01,
    entryPrice: 4336.63,
    currentPrice: 4334.74,
    tp: 4338.13,
    sl: null,
    openTime: new Date().toISOString(),
    pnl: -190,
    swap: 0,
    commission: 0,
    magic: goldminer.magicNumber,
    comment: 'GoldMiner grid L0',
    ...overrides,
  };
}

describe('trade filtering', () => {
  it('matches direction and profitability', () => {
    expect(matchesTradeFilter(trade({ direction: 'BUY' }), 'BUY')).toBe(true);
    expect(matchesTradeFilter(trade({ direction: 'BUY' }), 'SELL')).toBe(false);
    expect(matchesTradeFilter(trade({ pnl: 50 }), 'PROFIT')).toBe(true);
    expect(matchesTradeFilter(trade({ pnl: -50 }), 'LOSS')).toBe(true);
    expect(matchesTradeFilter(trade({ pnl: 0 }), 'PROFIT')).toBe(false);
    expect(matchesTradeFilter(trade({ pnl: 0 }), 'LOSS')).toBe(false);
  });

  it('scopes to an account without dropping the direction filter', () => {
    const mine = trade({ id: 'mine', accountId: 'acc-1', direction: 'BUY' });
    const theirs = trade({ id: 'theirs', accountId: 'acc-2', direction: 'BUY' });
    const wrongWay = trade({ id: 'wrong', accountId: 'acc-1', direction: 'SELL' });

    const result = filterTrades([mine, theirs, wrongWay], { filter: 'BUY', accountId: 'acc-1' });
    expect(result.map((t) => t.id)).toEqual(['mine']);
  });
});

describe('pointsToTakeProfit', () => {
  it('measures the remaining distance in the trade direction', () => {
    // BUY needs price to rise from 4334.74 to 4338.13 => 339 points at 0.01/point.
    expect(pointsToTakeProfit(trade())).toBeCloseTo(339, 0);
  });

  it('inverts the calculation for SELL', () => {
    const sell = trade({ direction: 'SELL', currentPrice: 4337, tp: 4335.5 });
    expect(pointsToTakeProfit(sell)).toBeCloseTo(150, 0);
  });

  it('returns null when the basket TP is not set yet', () => {
    expect(pointsToTakeProfit(trade({ tp: null }))).toBeNull();
  });
});

describe('weightedAverageEntry', () => {
  it('weights each grid level by its volume', () => {
    const average = weightedAverageEntry([
      trade({ lot: 0.01, entryPrice: 4340 }),
      trade({ lot: 0.03, entryPrice: 4332 }),
    ]);
    // (4340*0.01 + 4332*0.03) / 0.04 = 4334
    expect(average).toBeCloseTo(4334, 4);
  });

  it('returns zero rather than NaN for an empty basket', () => {
    expect(weightedAverageEntry([])).toBe(0);
  });
});

describe('basketProgressToTarget', () => {
  const buyBasket: Basket = {
    id: 'b1',
    accountId: 'acc-1',
    accountNumber: '33814735',
    direction: 'BUY',
    symbol: 'XAUUSD.c',
    positionCount: 3,
    totalLots: 0.06,
    averageEntry: 4334,
    basketTP: 4335.5,
    pnl: 100,
    openedAt: new Date().toISOString(),
    pointsToTarget: 150,
  };

  it('reports zero at entry and one at target', () => {
    expect(basketProgressToTarget(buyBasket, 4334)).toBe(0);
    expect(basketProgressToTarget(buyBasket, 4335.5)).toBe(1);
  });

  it('clamps beyond the target and below the entry', () => {
    expect(basketProgressToTarget(buyBasket, 4400)).toBe(1);
    expect(basketProgressToTarget(buyBasket, 4300)).toBe(0);
  });

  it('runs downward for a SELL basket', () => {
    const sellBasket: Basket = {
      ...buyBasket,
      direction: 'SELL',
      averageEntry: 4337,
      basketTP: 4335.5,
    };
    expect(basketProgressToTarget(sellBasket, 4336.25)).toBeCloseTo(0.5, 5);
  });
});

describe('aggregates', () => {
  it('sums lots without floating point drift', () => {
    const baskets = [
      { totalLots: 0.01 } as Basket,
      { totalLots: 0.02 } as Basket,
      { totalLots: 0.07 } as Basket,
    ];
    expect(sumBasketLots(baskets)).toBe(0.1);
  });

  it('sums P/L across positions', () => {
    expect(sumTradePnl([trade({ pnl: 100 }), trade({ pnl: -40 })])).toBe(60);
  });
});
