import "server-only";

/**
 * Server-only configuration. These values are read from the deployment's
 * environment (or `.env.local` in development) and are never sent to the
 * browser. Do NOT rename them to NEXT_PUBLIC_*.
 */

const DEFAULT_BASE_URL = "https://goldminer-api.srv1995263.hstgr.cloud";

export function apiBaseUrl(): string {
  return (process.env.GOLDMINER_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

/** Bearer token for the GoldMiner API. Throws if it is not configured. */
export function apiToken(): string {
  const t = process.env.GOLDMINER_API_TOKEN;
  if (!t) throw new ConfigError("GOLDMINER_API_TOKEN is not set");
  return t;
}

/** Passcode the user types to unlock this app. Separate from the API token. */
export function appPasscode(): string {
  const p = process.env.GOLDMINER_APP_PASSCODE;
  if (!p) throw new ConfigError("GOLDMINER_APP_PASSCODE is not set");
  return p;
}

/**
 * Master switch for every mutating request (trade, close, TP/SL, orders,
 * protection, control). Off unless explicitly set to "true" on the server.
 */
export function tradingEnabled(): boolean {
  return process.env.GOLDMINER_ENABLE_TRADING === "true";
}

export class ConfigError extends Error {}
