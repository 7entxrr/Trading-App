'use strict';

const http = require('node:http');
const { URL } = require('node:url');
const config = require('./src/config');
const snapshotStore = require('./src/snapshotStore');
const build = require('./src/build');
const router = require('./src/router');

/**
 * GoldMiner read-only backend.
 *
 * Bridges goldminer_snapshot_<login>.json (written by
 * mt5-bridge/GoldMinerMonitor.mq5) to the HTTP contract the dashboard
 * expects. GET everywhere, PATCH only for the alert read-state. There is no
 * route, dependency, or code path anywhere in this backend that can reach
 * MT5 or send a trading command — see ../docs/READ_ONLY.md. If you are
 * extending this service and find yourself wanting to add a POST/PUT/DELETE
 * route, stop — that capability must not exist here.
 */

function withCors(req, res) {
  // The frontend's apiClient sends `credentials: 'include'`, and browsers
  // refuse a wildcard Access-Control-Allow-Origin on a credentialed request.
  // CORS_ORIGIN=* therefore means "reflect whatever origin asked" rather
  // than a literal "*" header — access is still gated by API_KEY when set.
  const origin = config.corsOrigin === '*' ? req.headers.origin || '*' : config.corsOrigin;
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');
}

function isAuthorized(req) {
  if (!config.apiKey) return true;
  const header = req.headers['authorization'] || '';
  return header === `Bearer ${config.apiKey}`;
}

const server = http.createServer(async (req, res) => {
  withCors(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'PATCH') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: `Method ${req.method} not allowed` }));
    return;
  }

  if (!isAuthorized(req)) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Missing or invalid API key' }));
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    await router.handle(req, res, url.pathname);
  } catch (err) {
    console.error('[server] unhandled error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Internal error' }));
    }
  }
});

snapshotStore.start();
build.refresh();
setInterval(build.refresh, config.snapshotPollMs);

server.listen(config.port, () => {
  console.log(`[server] GoldMiner backend listening on http://localhost:${config.port}`);
  console.log(`[server] Watching snapshots in: ${config.snapshotDir || '(not configured)'}`);
  console.log(`[server] API key required: ${config.apiKey ? 'yes' : 'no (open — set API_KEY before deploying)'}`);
});
