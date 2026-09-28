/**
 * Display-only formatting. Values from the API are never rounded or altered
 * before use; formatting happens only here, at render time.
 * `null`/`undefined` always renders as an em dash (unavailable).
 */

const DASH = "—";

function currencyFormatter(currency?: string | null) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

export function money(value: number | null | undefined, currency?: string | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return DASH;
  return currencyFormatter(currency).format(value);
}

/** Money with an explicit sign, e.g. +$12.50 / −$3.10 */
export function signedMoney(value: number | null | undefined, currency?: string | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return DASH;
  return `${value >= 0 ? "+" : "−"}${money(Math.abs(value), currency)}`;
}

/** "$23,386.00" split into ["$23,386", ".00"] for the two-tone balance. */
export function splitMoney(value: number | null | undefined, currency?: string | null): [string, string] {
  if (value === null || value === undefined || Number.isNaN(value)) return [DASH, ""];
  const s = currencyFormatter(currency).format(value);
  const dot = s.lastIndexOf(".");
  return dot === -1 ? [s, ""] : [s.slice(0, dot), s.slice(dot)];
}

/** Prices keep the precision the backend sent (at least 2 decimals). */
export function price(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return DASH;
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 5 });
}

export function lots(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return DASH;
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function num(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return DASH;
  return value.toLocaleString("en-US", { maximumFractionDigits: digits });
}

export function time(iso: string | null | undefined) {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
