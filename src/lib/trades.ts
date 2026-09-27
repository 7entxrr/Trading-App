import type { Basket, Trade } from '@/types/domain';
import { SYMBOL_POINT } from '@/config/goldminer';

export type TradeFilter = 'ALL' | 'BUY' | 'SELL' | 'PROFIT' | 'LOSS';

export const TRADE_FILTERS: { value: TradeFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'BUY', label: 'Buy' },
  { value: 'SELL', label: 'Sell' },
  { value: 'PROFIT', label: 'In profit' },
  { value: 'LOSS', label: 'In loss' },
];

export function matchesTradeFilter(trade: Trade, filter: TradeFilter): boolean {
  switch (filter) {
    case 'ALL':
      return true;
    case 'BUY':
      return trade.direction === 'BUY';
    case 'SELL':
      return trade.direction === 'SELL';
    case 'PROFIT':
      return trade.pnl > 0;
    case 'LOSS':
      return trade.pnl < 0;
  }
}

export function filterTrades(
  trades: Trade[],
  options: { filter?: TradeFilter; accountId?: string | null } = {},
): Trade[] {
  const { filter = 'ALL', accountId = null } = options;
  return trades.filter(
    (trade) =>
      matchesTradeFilter(trade, filter) && (accountId === null || trade.accountId === accountId),
  );
}

/** Signed distance from current price to the take-profit, in broker points. */
export function pointsToTakeProfit(trade: Trade): number | null {
  if (trade.tp === null) return null;
  const delta =
    trade.direction === 'BUY' ? trade.tp - trade.currentPrice : trade.currentPrice - trade.tp;
  return delta / SYMBOL_POINT;
}

/**
 * How far the basket has travelled from its average entry toward the shared
 * take-profit, as a 0..1 fraction. Returns null when the backend has not
 * reported a basket TP yet — the UI shows "—" rather than guessing.
 */
export function basketProgressToTarget(basket: Basket, currentPrice: number): number | null {
  if (basket.basketTP === null) return null;

  const total =
    basket.direction === 'BUY'
      ? basket.basketTP - basket.averageEntry
      : basket.averageEntry - basket.basketTP;
  if (total <= 0) return 0;

  const travelled =
    basket.direction === 'BUY'
      ? currentPrice - basket.averageEntry
      : basket.averageEntry - currentPrice;
  return clamp(travelled / total, 0, 1);
}

export function sumBasketLots(baskets: Basket[]): number {
  return round2(baskets.reduce((total, basket) => total + basket.totalLots, 0));
}

export function sumTradePnl(trades: Trade[]): number {
  return trades.reduce((total, trade) => total + trade.pnl, 0);
}

export function sumTradeLots(trades: Trade[]): number {
  return round2(trades.reduce((total, trade) => total + trade.lot, 0));
}

/**
 * Volume-weighted average entry — the same calculation the EA uses to place a
 * basket's shared take-profit.
 */
export function weightedAverageEntry(trades: Trade[]): number {
  const lots = trades.reduce((total, trade) => total + trade.lot, 0);
  if (lots === 0) return 0;
  const weighted = trades.reduce((total, trade) => total + trade.entryPrice * trade.lot, 0);
  return weighted / lots;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
