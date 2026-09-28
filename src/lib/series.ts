export type Range = "24h" | "7d" | "1m" | "3m";

export const ranges: { key: Range; label: string }[] = [
  { key: "24h", label: "24 hours" },
  { key: "7d", label: "7 days" },
  { key: "1m", label: "1 month" },
  { key: "3m", label: "3 month" },
];

export type Series = { values: number[]; labels: string[]; defaultIndex: number };

// Hand-traced from the design so Shopify's 24h chart matches it exactly.
const SHOPIFY_24H = [
  0.6, 0.64, 0.62, 0.3, 0.29, 0.05, 0.14, 0.1, 0.19, 0.14, 0.23, 0.21, 0.26, 0.18, 0.24, 0.34,
  0.36, 0.33, 0.24, 0.31, 0.24, 0.3, 0.2, 0.31, 0.1, 0.24, 0.33, 0.362, 0.4, 0.44, 0.4, 0.45,
  0.62, 0.78, 0.88, 0.91, 0.87, 0.86, 0.66, 0.55, 0.6, 0.62, 0.54, 0.54, 0.59, 0.57, 0.62, 0.7,
];

const LABELS: Record<Range, string[]> = {
  "24h": ["08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"],
  "7d": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  "1m": ["1", "5", "10", "15", "20", "25", "30"],
  "3m": ["Jul", "", "Aug", "", "Sep", "", "Oct"],
};

const POINTS: Record<Range, number> = { "24h": 48, "7d": 42, "1m": 60, "3m": 72 };

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function walk(seed: number, n: number) {
  const r = rng(seed);
  const out: number[] = [];
  let v = 0.4 + r() * 0.2;
  const drift = (r() - 0.35) * 0.012;
  for (let i = 0; i < n; i++) {
    v += drift + (r() - 0.5) * 0.14;
    v = Math.min(0.95, Math.max(0.05, v));
    out.push(v);
  }
  return out;
}

export function makeSeries(seed: number, price: number, range: Range, useDesign = false): Series {
  const n = POINTS[range];
  const shape = useDesign && range === "24h" ? SHOPIFY_24H : walk(seed * 7 + n, n);
  // Map 0..1 to a price band. For the design series, 0.362 -> $65.34 like the mock-up.
  const low = useDesign && range === "24h" ? 40 : price * 0.72;
  const span = useDesign && range === "24h" ? 70 : price * 0.5;
  const values = shape.map((y) => Math.round((low + y * span) * 100) / 100);
  return {
    values,
    labels: LABELS[range],
    defaultIndex: Math.round(shape.length * 0.565),
  };
}
