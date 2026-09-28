import "server-only";

/**
 * The only GoldMiner endpoints this app may call, with their allowed methods.
 * Anything else is rejected by the proxy before it reaches the live account.
 */

type Rule = {
  method: "GET" | "POST" | "DELETE";
  pattern: RegExp;
  /** Mutating trading requests must carry a client-generated request_id. */
  requiresRequestId?: boolean;
};

const TICKET = "(\\d+)";

export const RULES: Rule[] = [
  // Read
  ...[
    "health",
    "api/status",
    "api/account",
    "api/positions",
    "api/orders",
    "api/trades",
    "api/baskets",
    "api/performance",
    "api/alerts",
    "api/snapshot",
    "api/protection",
    "api/commands",
  ].map((p) => ({ method: "GET" as const, pattern: new RegExp(`^${p}$`) })),

  // Trade
  { method: "POST", pattern: /^api\/trade\/(buy|sell)$/, requiresRequestId: true },

  // Single position
  { method: "POST", pattern: new RegExp(`^api/positions/${TICKET}/(modify|close)$`), requiresRequestId: true },

  // Bulk TP / SL / close
  {
    method: "POST",
    pattern: /^api\/positions\/(tp-buy|tp-sell|tp-all|sl-buy|sl-sell|sl-all|close-buy|close-sell|close-all)$/,
    requiresRequestId: true,
  },

  // Pending orders
  { method: "POST", pattern: /^api\/orders\/(cancel-buy|cancel-sell|cancel-all)$/, requiresRequestId: true },

  // Account protection
  { method: "POST", pattern: /^api\/protection\/(tp|sl)$/ },
  { method: "DELETE", pattern: /^api\/protection\/(tp|sl)$/ },

  // Control
  { method: "POST", pattern: /^api\/control\/close-all$/, requiresRequestId: true },
  { method: "POST", pattern: /^api\/control\/(stop-new-trades|resume-trading)$/ },
];

export function matchRule(method: string, path: string) {
  return RULES.find((r) => r.method === method && r.pattern.test(path));
}

/** Query parameters are only forwarded on reads; values are passed through as-is. */
export const MAX_BODY_BYTES = 16 * 1024;
