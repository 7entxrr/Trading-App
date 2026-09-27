'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { isNewTradingAllowed } = require('../src/tradingWindow');

// IST = UTC+5:30. Build a UTC Date for a given IST wall-clock time.
function istTime(hour, minute) {
  const utcMinutes = hour * 60 + minute - 330;
  const base = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
  return new Date(base.getTime() + utcMinutes * 60_000);
}

test('allows new trades inside 04:00-17:30 IST', () => {
  assert.equal(isNewTradingAllowed(istTime(4, 0)), true);
  assert.equal(isNewTradingAllowed(istTime(12, 0)), true);
  assert.equal(isNewTradingAllowed(istTime(17, 29)), true);
});

test('pauses new trades between 17:30 and 20:00 IST', () => {
  assert.equal(isNewTradingAllowed(istTime(17, 30)), false);
  assert.equal(isNewTradingAllowed(istTime(19, 0)), false);
  assert.equal(isNewTradingAllowed(istTime(19, 59)), false);
});

test('allows new trades from 20:00 IST across midnight to 02:30 IST', () => {
  assert.equal(isNewTradingAllowed(istTime(20, 0)), true);
  assert.equal(isNewTradingAllowed(istTime(23, 59)), true);
  assert.equal(isNewTradingAllowed(istTime(0, 0)), true);
  assert.equal(isNewTradingAllowed(istTime(2, 29)), true);
});

test('pauses new trades between 02:30 and 04:00 IST', () => {
  assert.equal(isNewTradingAllowed(istTime(2, 30)), false);
  assert.equal(isNewTradingAllowed(istTime(3, 59)), false);
});
