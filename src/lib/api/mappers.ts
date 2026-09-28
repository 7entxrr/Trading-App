import type {
  Account,
  Alert,
  Basket,
  Command,
  Market,
  PendingOrder,
  Performance,
  Position,
  Protection,
  SystemStatus,
  Trade,
} from "@/lib/models";

/**
 * ============================================================================
 *  LIVE-DATA MAPPING — THE ONE REMAINING BLOCKER
 * ============================================================================
 *
 * Each function turns a RAW GoldMiner API response into the app's view model.
 * They are intentionally NOT implemented: the live API has not been inspected
 * yet, and real field names must come from actual responses (or the backend's
 * /openapi.json), never from guesses.
 *
 * To finish the integration, implement each mapper from the real response:
 *   - read only fields the backend actually returns
 *   - leave anything missing as null (the UI shows it as unavailable)
 *   - map MT5 position/order types to "buy" | "sell" here, not in the UI
 *   - keep numbers as returned (no rounding, no int conversion)
 *
 * Until a mapper is implemented it throws `UnmappedError`, and every screen
 * that depends on it shows an "awaiting data mapping" state instead of data.
 */

export class UnmappedError extends Error {
  constructor(public resource: string) {
    super(`Response mapping for ${resource} is not implemented yet`);
    this.name = "UnmappedError";
  }
}

const pending =
  <T>(resource: string) =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (raw: unknown): T => {
    throw new UnmappedError(resource);
  };

/** GET /api/status */
export const mapStatus = pending<SystemStatus>("GET /api/status");
/** GET /api/account */
export const mapAccount = pending<Account>("GET /api/account");
/** GET /api/positions */
export const mapPositions = pending<Position[]>("GET /api/positions");
/** GET /api/orders */
export const mapOrders = pending<PendingOrder[]>("GET /api/orders");
/** GET /api/trades */
export const mapTrades = pending<Trade[]>("GET /api/trades");
/** GET /api/baskets */
export const mapBaskets = pending<Basket[]>("GET /api/baskets");
/** GET /api/performance */
export const mapPerformance = pending<Performance>("GET /api/performance");
/** GET /api/alerts */
export const mapAlerts = pending<Alert[]>("GET /api/alerts");
/** GET /api/protection */
export const mapProtection = pending<Protection>("GET /api/protection");
/** GET /api/commands */
export const mapCommands = pending<Command[]>("GET /api/commands");
/** GET /api/snapshot — current gold quote (and history if the backend provides it) */
export const mapMarket = pending<Market>("GET /api/snapshot");
