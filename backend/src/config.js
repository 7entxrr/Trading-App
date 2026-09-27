'use strict';

const fs = require('node:fs');
const path = require('node:path');

/** Tiny .env loader — no dependency needed for a handful of KEY=VALUE lines. */
function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnv(path.join(__dirname, '..', '.env'));

function parseAccountRoles(raw) {
  try {
    const parsed = JSON.parse(raw || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    console.warn('[config] ACCOUNT_ROLES is not valid JSON — ignoring, defaulting every account to MASTER');
    return {};
  }
}

const config = {
  port: Number(process.env.PORT) || 4000,
  snapshotDir: process.env.SNAPSHOT_DIR || '',
  snapshotPollMs: Math.max(500, Number(process.env.SNAPSHOT_POLL_MS) || 2000),
  staleHeartbeatMinutes: Number(process.env.STALE_HEARTBEAT_MINUTES) || 5,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  apiKey: process.env.API_KEY || '',
  accountRoles: parseAccountRoles(process.env.ACCOUNT_ROLES),
  dayResetHourIst: (() => {
    const hour = Number(process.env.DAY_RESET_HOUR_IST);
    return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : 4;
  })(),
  dataDir: path.join(__dirname, '..', 'data'),
};

if (!config.snapshotDir) {
  console.error(
    '[config] SNAPSHOT_DIR is not set. Copy backend/.env.example to backend/.env and point it at ' +
      'the MT5 Common\\Files folder.',
  );
}

if (!config.apiKey) {
  console.warn(
    '[config] API_KEY is not set — this backend is open to anyone who can reach it. Fine for ' +
      'local testing; set API_KEY before exposing it on the VPS.',
  );
}

module.exports = config;
