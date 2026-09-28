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
