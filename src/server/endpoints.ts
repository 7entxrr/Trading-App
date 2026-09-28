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
  /**
   * Body field that must be a positive number. Used for bulk TP/SL: the
   * backend treats a missing/null price as "REMOVE TP/SL from every matching
   * position", which this app never intends to send.
   */
  requiresPositive?: "tp" | "sl";
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

  // Bulk TP / SL (a real price is mandatory — see requiresPositive)
  { method: "POST", pattern: /^api\/positions\/tp-(buy|sell|all)$/, requiresRequestId: true, requiresPositive: "tp" },
  { method: "POST", pattern: /^api\/positions\/sl-(buy|sell|all)$/, requiresRequestId: true, requiresPositive: "sl" },

  // Bulk close
  { method: "POST", pattern: /^api\/positions\/close-(buy|sell|all)$/, requiresRequestId: true },

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
