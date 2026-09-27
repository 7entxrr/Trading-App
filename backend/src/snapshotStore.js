'use strict';

const fs = require('node:fs');
const path = require('node:path');
const config = require('./config');

/**
 * Reads goldminer_snapshot_<login>.json files written by
 * mt5-bridge/GoldMinerMonitor.mq5. Read-only: this module never writes into
 * the MT5 folder, only watches it.
 *
 * In-memory map: login (string) -> { data, mtimeMs, error }
 */
const snapshots = new Map();

const FILENAME_RE = /^goldminer_snapshot_(\d+)\.json$/;

function poll() {
  if (!config.snapshotDir) return;

  let entries;
  try {
    entries = fs.readdirSync(config.snapshotDir);
  } catch (err) {
    console.error(`[snapshotStore] cannot read SNAPSHOT_DIR (${config.snapshotDir}): ${err.message}`);
    return;
  }

  const seenLogins = new Set();

  for (const entry of entries) {
    const match = FILENAME_RE.exec(entry);
    if (!match) continue;
    const login = match[1];
    // Login 0 is MT5's own placeholder for "no account signed in" (written by
    // the monitor before you log into a terminal) — never a real account.
    if (login === '0') continue;
    seenLogins.add(login);

    const fullPath = path.join(config.snapshotDir, entry);
    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch {
      continue;
    }

    const existing = snapshots.get(login);
    if (existing && existing.mtimeMs === stat.mtimeMs) continue; // unchanged, skip re-parse

    try {
      const raw = fs.readFileSync(fullPath, 'utf8');
      const data = JSON.parse(raw);
      snapshots.set(login, { data, mtimeMs: stat.mtimeMs, error: null });
    } catch (err) {
      // Keep the last good snapshot on a transient partial write; only
      // surface the error if we have never successfully parsed this login.
      if (existing) {
        snapshots.set(login, { ...existing, error: err.message });
      } else {
        snapshots.set(login, { data: null, mtimeMs: stat.mtimeMs, error: err.message });
      }
    }
  }

  // Accounts whose file disappeared entirely are dropped so the dashboard
  // stops listing a terminal that no longer exists at all (as opposed to one
  // that is merely offline, which still has a file with stale JSON inside).
  for (const login of snapshots.keys()) {
    if (!seenLogins.has(login)) snapshots.delete(login);
  }
}

function getAll() {
  return snapshots;
}

function start() {
  poll();
  return setInterval(poll, config.snapshotPollMs);
}

module.exports = { start, poll, getAll };
