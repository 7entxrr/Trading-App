'use strict';

const build = require('./build');
const historyStore = require('./historyStore');

/**
 * Minimal manual router implementing exactly the contract in ../README.md:
 * GET everywhere, PATCH only for the alert read-state. There is no POST, PUT
 * or DELETE route here and none may be added — see ../../docs/READ_ONLY.md.
 */

function notFound(res, message = 'Not found') {
  send(res, 404, { message });
}

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(payload);
}

function noContent(res) {
  res.writeHead(204);
  res.end();
}

async function handle(req, res, pathname) {
  const segments = pathname.split('/').filter(Boolean);
  const method = req.method;

  // GET /accounts
  if (method === 'GET' && segments.length === 1 && segments[0] === 'accounts') {
    return send(res, 200, build.getAccounts());
  }

  // GET /accounts/:id
  if (method === 'GET' && segments.length === 2 && segments[0] === 'accounts') {
    const account = build.getAccount(decodeURIComponent(segments[1]));
    if (!account) return notFound(res, `No account matching "${segments[1]}"`);
    return send(res, 200, account);
  }

  // GET /accounts/:id/trades
  if (method === 'GET' && segments.length === 3 && segments[0] === 'accounts' && segments[2] === 'trades') {
    const account = build.getAccount(decodeURIComponent(segments[1]));
    if (!account) return notFound(res, `No account matching "${segments[1]}"`);
    return send(res, 200, build.getTrades(account.id) ?? []);
  }

  // GET /accounts/:id/baskets
  if (method === 'GET' && segments.length === 3 && segments[0] === 'accounts' && segments[2] === 'baskets') {
    const account = build.getAccount(decodeURIComponent(segments[1]));
    if (!account) return notFound(res, `No account matching "${segments[1]}"`);
    return send(res, 200, build.getBaskets(account.id) ?? []);
  }

  // GET /accounts/:id/performance
  if (method === 'GET' && segments.length === 3 && segments[0] === 'accounts' && segments[2] === 'performance') {
    const account = build.getAccount(decodeURIComponent(segments[1]));
    if (!account) return notFound(res, `No account matching "${segments[1]}"`);
    return send(res, 200, build.getAccountPerformance(account.id) ?? []);
  }

  // GET /trades
  if (method === 'GET' && segments.length === 1 && segments[0] === 'trades') {
    return send(res, 200, build.getTrades());
  }

  // GET /baskets
  if (method === 'GET' && segments.length === 1 && segments[0] === 'baskets') {
    return send(res, 200, build.getBaskets());
  }

  // GET /performance
  if (method === 'GET' && segments.length === 1 && segments[0] === 'performance') {
    return send(res, 200, build.getPortfolioPerformance());
  }

  // GET /alerts
  if (method === 'GET' && segments.length === 1 && segments[0] === 'alerts') {
    return send(res, 200, historyStore.getAlerts());
  }

  // PATCH /alerts  (mark all read — dashboard UI state, not trading)
  if (method === 'PATCH' && segments.length === 1 && segments[0] === 'alerts') {
    historyStore.markAllAlertsRead();
    return noContent(res);
  }

  // PATCH /alerts/:id (mark one read)
  if (method === 'PATCH' && segments.length === 2 && segments[0] === 'alerts') {
    const ok = historyStore.markAlertRead(decodeURIComponent(segments[1]));
    if (!ok) return notFound(res, `No alert matching "${segments[1]}"`);
    return noContent(res);
  }

  // GET /copier/status
  if (method === 'GET' && segments.length === 2 && segments[0] === 'copier' && segments[1] === 'status') {
    return send(res, 200, build.getCopierStatus());
  }

  // GET /system/status
  if (method === 'GET' && segments.length === 2 && segments[0] === 'system' && segments[1] === 'status') {
    return send(res, 200, build.getSystemStatus());
  }

  return notFound(res, `No route for ${method} ${pathname}`);
}

module.exports = { handle };
