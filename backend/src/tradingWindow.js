'use strict';

/**
 * Server-side mirror of src/lib/tradingWindow.ts + src/config/goldminer.ts.
 *
 * GoldMinerMonitor cannot see inside the separate GoldMiner EA process, so it
 * cannot report `tradingEnabled` directly. GoldMiner's "Working Window" is
 * configured with a fixed, known IST schedule (see project README), so this
 * derives the same boolean the frontend already computes for its own
 * TradingWindowCard — not an invented value, a deterministic read of the
 * EA's documented configuration.
 */

const IST_OFFSET_MINUTES = 330;
const MINUTES_PER_DAY = 1440;

// 04:00-17:30 and 20:00-02:30 IST — keep in sync with src/config/goldminer.ts.
const SESSIONS = [
  { id: 1, startMinute: 4 * 60, endMinute: 17 * 60 + 30 },
  { id: 2, startMinute: 20 * 60, endMinute: 2 * 60 + 30 },
];

function istMinuteOfDay(date) {
  const shifted = new Date(date.getTime() + IST_OFFSET_MINUTES * 60_000);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
}

function containsMinute(session, minute) {
  if (session.startMinute <= session.endMinute) {
    return minute >= session.startMinute && minute < session.endMinute;
  }
  return minute >= session.startMinute || minute < session.endMinute;
}

function isNewTradingAllowed(now = new Date()) {
  const minute = istMinuteOfDay(now);
  return SESSIONS.some((session) => containsMinute(session, minute));
}

module.exports = { isNewTradingAllowed, istMinuteOfDay, MINUTES_PER_DAY };
