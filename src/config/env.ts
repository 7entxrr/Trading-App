import type { CurrencyCode } from '@/types/domain';

/**
 * Single place where environment configuration enters the app.
 * Nothing else should read `process.env` directly.
 *
 * Note on naming: this project runs on Next.js, so browser-visible variables
 * must use the `NEXT_PUBLIC_` prefix. (`VITE_` prefixed variables are not
 * readable here — they belong to a Vite build.)
 *
 * There is no mock/demo data mode. The dashboard always talks to the real
 * backend at NEXT_PUBLIC_API_BASE_URL; if it is unreachable, screens show an
 * error state rather than inventing numbers.
 */

type RealtimeTransport = 'polling' | 'websocket';

function readTransport(): RealtimeTransport {
  return process.env.NEXT_PUBLIC_REALTIME_TRANSPORT === 'websocket' ? 'websocket' : 'polling';
}

function readPollInterval(): number {
  const raw = Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS);
  // Keep polling gentle: a trading dashboard does not need sub-second updates.
  return Number.isFinite(raw) && raw >= 2000 ? raw : 8000;
}

export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
  realtimeTransport: readTransport(),
  realtimeUrl: process.env.NEXT_PUBLIC_REALTIME_URL || '',
  pollIntervalMs: readPollInterval(),
  defaultCurrency: (process.env.NEXT_PUBLIC_DEFAULT_CURRENCY as CurrencyCode) || 'INR',
  tradingTimezone: process.env.NEXT_PUBLIC_TRADING_TIMEZONE || 'Asia/Kolkata',
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  /** Optional shared-secret sent as `Authorization: Bearer <key>`. Matches the backend's API_KEY. */
  apiKey: process.env.NEXT_PUBLIC_API_KEY || '',
  appVersion: '0.1.0',
} as const;
