/** The tiny tick-shaped trend line in the corner of each portfolio card. */
export function Sparkline({ up, variant = 0 }: { up: boolean; variant?: number }) {
  const shapes = up
    ? ["M1 11 6 6.5l3.5 3L19 2", "M1 6.5 7 11 19 3.5", "M1 5.5l5 5.5 3-2.5h10"]
    : ["M1 11 8 3.5l4 4 3-2 4 5.5"];
  const d = shapes[variant % shapes.length];
  return (
    <svg viewBox="0 0 20 13" className="h-[13px] w-[22px]" aria-hidden>
      <path
        d={d}
        fill="none"
        stroke={up ? "#22B573" : "#E5484D"}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Wider trend line for list rows. */
export function MiniChart({ values, up }: { values: number[]; up: boolean }) {
  const w = 64;
  const h = 26;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values
    .map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - min) / (max - min || 1)) * (h - 4)).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[26px] w-[64px]" aria-hidden>
      <polyline points={pts} fill="none" stroke={up ? "#22B573" : "#E5484D"} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
