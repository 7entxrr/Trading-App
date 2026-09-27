import type { CurrencyCode } from '@/types/domain';

/**
 * Centralised number/currency formatting. Never concatenate currency symbols by
 * hand — the display currency is user-configurable.
 */

const LOCALE_BY_CURRENCY: Record<CurrencyCode, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
};

export interface CurrencyOptions {
  currency?: CurrencyCode;
  /** Always prefix `+` for positive values (P/L display). */
  signed?: boolean;
  decimals?: number;
  /** `240000` -> `₹2.4L`. Useful for tight mobile stat tiles. */
  compact?: boolean;
}

export function formatCurrency(value: number, options: CurrencyOptions = {}): string {
  const { currency = 'INR', signed = false, decimals = 0, compact = false } = options;
  const safe = Number.isFinite(value) ? value : 0;

  const formatter = new Intl.NumberFormat(LOCALE_BY_CURRENCY[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    ...(compact ? { notation: 'compact' as const, maximumFractionDigits: 2 } : {}),
  });

  const formatted = formatter.format(Math.abs(safe));
  const sign = safe < 0 ? '−' : signed ? '+' : '';
  return `${sign}${formatted}`;
}

/** P/L helper: always signed, so a gain reads `+₹4,820` and a loss `−₹1,120`. */
export function formatPnl(value: number, options: Omit<CurrencyOptions, 'signed'> = {}): string {
  return formatCurrency(value, { ...options, signed: true });
}

/** `'up' | 'down' | 'flat'` — drives colour and iconography for P/L values. */
export function pnlDirection(value: number): 'up' | 'down' | 'flat' {
  if (value > 0.0001) return 'up';
  if (value < -0.0001) return 'down';
  return 'flat';
}

/** Gold prices are quoted to 2 decimals on this broker. */
export function formatPrice(value: number, decimals = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** MT5 volumes always render with 2 decimals: `0.01`, `1.28`. */
export function formatLots(value: number): string {
  return value.toFixed(2);
}

export function formatPercent(value: number, decimals = 1, signed = false): string {
  const sign = value > 0 && signed ? '+' : value < 0 ? '−' : '';
  return `${sign}${Math.abs(value).toFixed(decimals)}%`;
}

export function formatPoints(value: number): string {
  return `${Math.round(value).toLocaleString('en-US')} pts`;
}

export function formatCount(value: number): string {
  return value.toLocaleString('en-IN');
}

/** `#33814735` — MT5 logins are shown with a leading hash throughout the UI. */
export function formatLogin(login: string): string {
  return `#${login}`;
}
