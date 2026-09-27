'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { detectAccountDeltas, detectGlobalTradingWindowDelta } = require('../src/alerts');

test('first observation establishes a baseline without emitting alerts', () => {
  const next = { mt5Status: 'ONLINE', eaStatus: 'ONLINE', heartbeatStale: false, drawdownPct: 0, baskets: [] };
  assert.deepEqual(detectAccountDeltas('123', null, next), []);
});

test('MT5 going offline fires a CRITICAL MT5_OFFLINE alert', () => {
  const prev = { mt5Status: 'ONLINE', eaStatus: 'ONLINE', heartbeatStale: false, drawdownPct: 0, baskets: [] };
  const next = { ...prev, mt5Status: 'OFFLINE' };
  const alerts = detectAccountDeltas('123', prev, next);
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].type, 'MT5_OFFLINE');
  assert.equal(alerts[0].severity, 'CRITICAL');
});

test('drawdown crossing 10% then 20% fires WARNING then CRITICAL exactly once each', () => {
  const base = { mt5Status: 'ONLINE', eaStatus: 'ONLINE', heartbeatStale: false, baskets: [] };
  const a = detectAccountDeltas('1', { ...base, drawdownPct: 5 }, { ...base, drawdownPct: 12 });
  assert.equal(a.length, 1);
  assert.equal(a[0].severity, 'WARNING');

  const b = detectAccountDeltas('1', { ...base, drawdownPct: 12 }, { ...base, drawdownPct: 12 });
  assert.equal(b.length, 0);

  const c = detectAccountDeltas('1', { ...base, drawdownPct: 12 }, { ...base, drawdownPct: 25 });
  assert.equal(c.length, 1);
  assert.equal(c[0].severity, 'CRITICAL');
});

test('a new basket key fires NEW_BASKET, growth fires LOT_INCREASE, disappearance fires BASKET_CLOSED', () => {
  const base = { mt5Status: 'ONLINE', eaStatus: 'ONLINE', heartbeatStale: false, drawdownPct: 0 };
  const basket = (overrides) => ({
    direction: 'BUY',
    symbol: 'XAUUSD.c',
    magic: 222111,
    positionCount: 1,
    totalLots: 0.01,
    pnl: 1.5,
    ...overrides,
  });

  const opened = detectAccountDeltas('1', { ...base, baskets: [] }, { ...base, baskets: [basket()] });
  assert.equal(opened.length, 1);
  assert.equal(opened[0].type, 'NEW_BASKET');

  const grown = detectAccountDeltas(
    '1',
    { ...base, baskets: [basket()] },
    { ...base, baskets: [basket({ positionCount: 2, totalLots: 0.02 })] },
  );
  assert.equal(grown.length, 1);
  assert.equal(grown[0].type, 'LOT_INCREASE');

  const closed = detectAccountDeltas('1', { ...base, baskets: [basket()] }, { ...base, baskets: [] });
  assert.equal(closed.length, 1);
  assert.equal(closed[0].type, 'BASKET_CLOSED');
});

test('global trading window delta only fires on an actual flip, not on first read', () => {
  assert.equal(detectGlobalTradingWindowDelta(null, true), null);
  assert.equal(detectGlobalTradingWindowDelta(true, true), null);
  assert.equal(detectGlobalTradingWindowDelta(true, false).type, 'TRADING_PAUSED');
  assert.equal(detectGlobalTradingWindowDelta(false, true).type, 'TRADING_RESUMED');
});
