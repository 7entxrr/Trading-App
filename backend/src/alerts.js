'use strict';

/**
 * Pure delta detection: given the previous and current derived state for one
 * account, return the list of alert descriptors to record. No I/O here —
 * historyStore.addAlert() is called by the caller — so this is easy to test
 * in isolation.
 */

function basketKey(basket) {
  return `${basket.direction}:${basket.symbol}:${basket.magic}`;
}

function detectAccountDeltas(accountNumber, prev, next) {
  const out = [];

  if (!prev) return out; // first observation — establish baseline, no alert spam on startup

  if (prev.mt5Status !== next.mt5Status) {
    out.push(
      next.mt5Status === 'OFFLINE'
        ? {
            accountNumber,
            type: 'MT5_OFFLINE',
            severity: 'CRITICAL',
            title: 'MT5 terminal disconnected',
            message: `Account #${accountNumber}: MT5 terminal lost connection to the broker.`,
          }
        : {
            accountNumber,
            type: 'MT5_OFFLINE',
            severity: 'SUCCESS',
            title: 'MT5 terminal reconnected',
            message: `Account #${accountNumber}: MT5 terminal is back online.`,
          },
    );
  }

  if (prev.eaStatus !== next.eaStatus) {
    out.push(
      next.eaStatus === 'OFFLINE'
        ? {
            accountNumber,
            type: 'EA_OFFLINE',
            severity: 'CRITICAL',
            title: 'GoldMiner EA disconnected',
            message: `Account #${accountNumber}: Algo trading is disabled or the terminal is unreachable.`,
          }
        : {
            accountNumber,
            type: 'EA_OFFLINE',
            severity: 'SUCCESS',
            title: 'GoldMiner EA connected',
            message: `Account #${accountNumber}: Algo trading is enabled again.`,
          },
    );
  }

  if (prev.heartbeatStale !== next.heartbeatStale) {
    out.push(
      next.heartbeatStale
        ? {
            accountNumber,
            type: 'MT5_OFFLINE',
            severity: 'WARNING',
            title: 'Monitor heartbeat lost',
            message: `Account #${accountNumber}: no fresh snapshot for a while — figures shown may be stale.`,
          }
        : {
            accountNumber,
            type: 'MT5_OFFLINE',
            severity: 'SUCCESS',
            title: 'Monitor heartbeat restored',
            message: `Account #${accountNumber}: snapshots are updating again.`,
          },
    );
  }

  const DRAWDOWN_WARNING_PCT = 10;
  const DRAWDOWN_CRITICAL_PCT = 20;
  if (prev.drawdownPct < DRAWDOWN_CRITICAL_PCT && next.drawdownPct >= DRAWDOWN_CRITICAL_PCT) {
    out.push({
      accountNumber,
      type: 'DRAWDOWN',
      severity: 'CRITICAL',
      title: 'Severe drawdown',
      message: `Account #${accountNumber}: drawdown reached ${next.drawdownPct.toFixed(1)}% from peak equity.`,
    });
  } else if (prev.drawdownPct < DRAWDOWN_WARNING_PCT && next.drawdownPct >= DRAWDOWN_WARNING_PCT) {
    out.push({
      accountNumber,
      type: 'DRAWDOWN',
      severity: 'WARNING',
      title: 'Elevated drawdown',
      message: `Account #${accountNumber}: drawdown reached ${next.drawdownPct.toFixed(1)}% from peak equity.`,
    });
  }

  const prevBaskets = new Map(prev.baskets.map((b) => [basketKey(b), b]));
  const nextBaskets = new Map(next.baskets.map((b) => [basketKey(b), b]));

  for (const [key, basket] of nextBaskets) {
    const before = prevBaskets.get(key);
    if (!before) {
      out.push({
        accountNumber,
        type: 'NEW_BASKET',
        severity: 'INFO',
        title: `${basket.direction} basket opened`,
        message: `Account #${accountNumber}: new ${basket.direction} basket on ${basket.symbol}, lot ${basket.totalLots.toFixed(2)}.`,
      });
    } else if (basket.positionCount > before.positionCount) {
      out.push({
        accountNumber,
        type: 'LOT_INCREASE',
        severity: 'INFO',
        title: `${basket.direction} grid level added`,
        message: `Account #${accountNumber}: ${basket.direction} basket on ${basket.symbol} grew to ${basket.positionCount} positions (${basket.totalLots.toFixed(2)} lots).`,
      });
    }
  }

  for (const [key, basket] of prevBaskets) {
    if (!nextBaskets.has(key)) {
      const profitLabel = basket.pnl >= 0 ? 'profit' : 'loss';
      out.push({
        accountNumber,
        type: 'BASKET_CLOSED',
        severity: basket.pnl >= 0 ? 'SUCCESS' : 'WARNING',
        title: `${basket.direction} basket closed`,
        message: `Account #${accountNumber}: ${basket.direction} basket on ${basket.symbol} closed with a ${profitLabel} of ${basket.pnl.toFixed(2)}.`,
      });
    }
  }

  return out;
}

function detectGlobalTradingWindowDelta(prevEnabled, nextEnabled) {
  if (prevEnabled === null || prevEnabled === nextEnabled) return null;
  return nextEnabled
    ? {
        accountNumber: null,
        type: 'TRADING_RESUMED',
        severity: 'INFO',
        title: 'Trading window opened',
        message: 'GoldMiner may open new positions again.',
      }
    : {
        accountNumber: null,
        type: 'TRADING_PAUSED',
        severity: 'INFO',
        title: 'Trading window paused',
        message: 'GoldMiner will not open new positions until the next session. Existing baskets keep running.',
      };
}

module.exports = { detectAccountDeltas, detectGlobalTradingWindowDelta, basketKey };
