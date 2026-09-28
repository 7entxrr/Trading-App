import { apiGet, apiMutate } from "./client";

/**
 * One function per GoldMiner endpoint (the complete checklist).
 *
 * Request bodies follow the integration spec. Response types are `unknown`
 * until they are mapped from the backend's real /openapi.json — field names
 * are intentionally NOT guessed.
 */

export type RequestId = string;

/* ---------- Read ---------- */

export const getHealth = () => apiGet("health");
export const getStatus = () => apiGet("api/status");
export const getAccount = () => apiGet("api/account");
export const getPositions = () => apiGet("api/positions");
export const getOrders = () => apiGet("api/orders");
export const getTrades = () => apiGet("api/trades");
export const getBaskets = () => apiGet("api/baskets");
export const getPerformance = () => apiGet("api/performance");
export const getAlerts = () => apiGet("api/alerts");
export const getSnapshot = () => apiGet("api/snapshot");
export const getProtection = () => apiGet("api/protection");
/** `limit` is supported by the backend (deployment report). */
export const getCommands = (limit = 50) => apiGet("api/commands", { limit });

/* ---------- Trade ---------- */

export type MarketOrder = {
  request_id: RequestId;
  volume: number;
  comment?: string;
  symbol?: string;
  sl?: number;
  tp?: number;
  client_id?: string;
};

export const buy = (o: MarketOrder) => apiMutate("POST", "api/trade/buy", o);
export const sell = (o: MarketOrder) => apiMutate("POST", "api/trade/sell", o);

/* ---------- Single position ---------- */

export const modifyPosition = (ticket: number | string, b: { request_id: RequestId; sl?: number; tp?: number }) =>
  apiMutate("POST", `api/positions/${encodeURIComponent(String(ticket))}/modify`, b);

export const closePosition = (ticket: number | string, b: { request_id: RequestId }) =>
  apiMutate("POST", `api/positions/${encodeURIComponent(String(ticket))}/close`, b);

/* ---------- Bulk TP / SL ---------- */

export const setTpBuy = (b: { request_id: RequestId; tp: number }) => apiMutate("POST", "api/positions/tp-buy", b);
export const setTpSell = (b: { request_id: RequestId; tp: number }) => apiMutate("POST", "api/positions/tp-sell", b);
export const setTpAll = (b: { request_id: RequestId; buy_tp?: number; sell_tp?: number }) =>
  apiMutate("POST", "api/positions/tp-all", b);

export const setSlBuy = (b: { request_id: RequestId; sl: number }) => apiMutate("POST", "api/positions/sl-buy", b);
export const setSlSell = (b: { request_id: RequestId; sl: number }) => apiMutate("POST", "api/positions/sl-sell", b);
export const setSlAll = (b: { request_id: RequestId; buy_sl?: number; sell_sl?: number }) =>
  apiMutate("POST", "api/positions/sl-all", b);

/* ---------- Bulk close ---------- */

export const closeBuy = (b: { request_id: RequestId }) => apiMutate("POST", "api/positions/close-buy", b);
export const closeSell = (b: { request_id: RequestId }) => apiMutate("POST", "api/positions/close-sell", b);
export const closeAll = (b: { request_id: RequestId }) => apiMutate("POST", "api/positions/close-all", b);

/* ---------- Pending orders (does NOT close positions) ---------- */

export const cancelBuyOrders = (b: { request_id: RequestId }) => apiMutate("POST", "api/orders/cancel-buy", b);
export const cancelSellOrders = (b: { request_id: RequestId }) => apiMutate("POST", "api/orders/cancel-sell", b);
export const cancelAllOrders = (b: { request_id: RequestId }) => apiMutate("POST", "api/orders/cancel-all", b);

/* ---------- Account equity protection ---------- */

export type ProtectionRequest = {
  enabled: boolean;
  mode: "equity";
  target: number;
  action: "close_all";
};

export const setEquityTp = (b: ProtectionRequest) => apiMutate("POST", "api/protection/tp", b);
export const removeEquityTp = () => apiMutate("DELETE", "api/protection/tp");
export const setEquitySl = (b: ProtectionRequest) => apiMutate("POST", "api/protection/sl", b);
export const removeEquitySl = () => apiMutate("DELETE", "api/protection/sl");

/* ---------- Control ---------- */

/** Closes positions AND cancels pending orders. Does NOT stop the EA. */
export const emergencyCloseEverything = (b: { request_id: RequestId }) => apiMutate("POST", "api/control/close-all", b);
/** Backend currently returns 501 Not Implemented — surfaced as-is. */
export const stopNewTrades = () => apiMutate("POST", "api/control/stop-new-trades");
/** Backend currently returns 501 Not Implemented — surfaced as-is. */
export const resumeTrading = () => apiMutate("POST", "api/control/resume-trading");
