'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const config = require('./config');

/**
 * Small JSON-file-backed persistence for the state the dashboard needs that
 * a single MT5 snapshot cannot express on its own: running peak equity (for
 * drawdown %), the alert feed (derived from snapshot deltas, since the
 * monitor only reports current state), and performance history (since
 * PerformancePoint is a time series, not a point-in-time read).
 *
 * Plain JSON files are sufficient at this scale (one household's accounts) —
 * no database engine, no native dependency, nothing to install on the VPS.
 */

fs.mkdirSync(config.dataDir, { recursive: true });

function filePath(name) {
  return path.join(config.dataDir, name);
}

function readJson(name, fallback) {
  try {
    const raw = fs.readFileSync(filePath(name), 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJsonAtomic(name, value) {
  const target = filePath(name);
  const tmp = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value));
  fs.renameSync(tmp, target);
}

// --- Peak equity (per login), for drawdown %. ------------------------------
let peakEquity = readJson('peak-equity.json', {});

function trackPeakEquity(login, equity) {
  const current = peakEquity[login] ?? equity;
  const next = Math.max(current, equity);
  if (next !== current) {
    peakEquity[login] = next;
    writeJsonAtomic('peak-equity.json', peakEquity);
  } else if (peakEquity[login] === undefined) {
    peakEquity[login] = next;
    writeJsonAtomic('peak-equity.json', peakEquity);
  }
  return peakEquity[login];
}

// --- Alerts. ----------------------------------------------------------------
const MAX_ALERTS = 500;
let alerts = readJson('alerts.json', []);

function addAlert({ accountNumber, type, severity, title, message }) {
  const alert = {
    id: crypto.randomUUID(),
    accountNumber: accountNumber ?? null,
    type,
    severity,
    title,
    message,
    timestamp: new Date().toISOString(),
    read: false,
  };
  alerts.unshift(alert);
  if (alerts.length > MAX_ALERTS) alerts.length = MAX_ALERTS;
  writeJsonAtomic('alerts.json', alerts);
  return alert;
}

function getAlerts() {
  return alerts;
}

function markAlertRead(id) {
  const alert = alerts.find((a) => a.id === id);
  if (!alert) return false;
  alert.read = true;
  writeJsonAtomic('alerts.json', alerts);
  return true;
}

function markAllAlertsRead() {
  let changed = false;
  for (const alert of alerts) {
    if (!alert.read) {
      alert.read = true;
      changed = true;
    }
  }
  if (changed) writeJsonAtomic('alerts.json', alerts);
}

// --- Performance history. ---------------------------------------------------
// One series per login plus one "portfolio" series, each an array of
// { timestamp, pnl }. Pruned to the last 14 days on disk; callers filter to
// "today" (the GoldMiner trading day) when serving PerformancePoint[].
const PERFORMANCE_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
const MIN_POINT_SPACING_MS = 30_000; // don't record more than once per 30s

const performanceSeries = new Map(); // key -> array, lazily loaded

function performanceFile(key) {
  return `performance-${key}.json`;
}

function loadSeries(key) {
  if (!performanceSeries.has(key)) {
    performanceSeries.set(key, readJson(performanceFile(key), []));
  }
  return performanceSeries.get(key);
}

function recordPerformancePoint(key, pnl, now = new Date()) {
  const series = loadSeries(key);
  const last = series[series.length - 1];
  if (last && now.getTime() - new Date(last.timestamp).getTime() < MIN_POINT_SPACING_MS) {
    return; // throttle — a trading dashboard doesn't need sub-30s resolution
  }
  series.push({ timestamp: now.toISOString(), pnl });

  const cutoff = now.getTime() - PERFORMANCE_RETENTION_MS;
  while (series.length && new Date(series[0].timestamp).getTime() < cutoff) {
    series.shift();
  }
  writeJsonAtomic(performanceFile(key), series);
}

function getPerformanceSince(key, sinceDate) {
  const series = loadSeries(key);
  const sinceMs = sinceDate.getTime();
  return series.filter((point) => new Date(point.timestamp).getTime() >= sinceMs);
}

module.exports = {
  trackPeakEquity,
  addAlert,
  getAlerts,
  markAlertRead,
  markAllAlertsRead,
  recordPerformancePoint,
  getPerformanceSince,
};
