import type { TimePoint } from "./models";

/**
 * Turns REAL time-series points from the API into chart input.
 * Never creates points: if the backend returns none, the chart shows an empty state.
 */

export type Range = "24h" | "7d" | "1m" | "3m";

export const ranges: { key: Range; label: string }[] = [
  { key: "24h", label: "24 hours" },
  { key: "7d", label: "7 days" },
  { key: "1m", label: "1 month" },
  { key: "3m", label: "3 month" },
];

export type Series = { values: number[]; labels: string[]; defaultIndex: number };

const WINDOW_MS: Record<Range, number> = {
  "24h": 24 * 3600e3,
  "7d": 7 * 24 * 3600e3,
  "1m": 30 * 24 * 3600e3,
  "3m": 90 * 24 * 3600e3,
};

function label(t: number, range: Range) {
  const d = new Date(t);
  return range === "24h"
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Returns null when there are fewer than 2 real points in the selected window. */
export function toSeries(points: TimePoint[] | null | undefined, range: Range, now = Date.now()): Series | null {
  if (!points?.length) return null;
  const from = now - WINDOW_MS[range];
  const inRange = points
    .map((p) => ({ t: new Date(p.time).getTime(), v: p.value }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v) && p.t >= from)
    .sort((a, b) => a.t - b.t);
  if (inRange.length < 2) return null;
  const first = inRange[0].t;
  const last = inRange[inRange.length - 1].t;
  const labels = Array.from({ length: 5 }, (_, i) => label(first + ((last - first) * i) / 4, range));
  return { values: inRange.map((p) => p.v), labels, defaultIndex: inRange.length - 1 };
}
