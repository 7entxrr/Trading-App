"use client";

import { useId, useRef, useState } from "react";
import { money } from "@/lib/format";
import type { Series } from "@/lib/series";

const W = 360;
const H = 260;
const PAD_TOP = 40; // room above the line for the tooltip

/**
 * Area chart matching the design: blue line, soft blue gradient fill,
 * dashed guide line and a black price tooltip. Drag or tap to inspect.
 */
export function PriceChart({ series, heightClass = "h-[260px]" }: { series: Series; heightClass?: string }) {
  const { values, labels, defaultIndex } = series;
  const [active, setActive] = useState(defaultIndex);
  const [lastSeries, setLastSeries] = useState(series);
  const ref = useRef<HTMLDivElement>(null);
  const gid = `area${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  // Reset the highlighted point when the range changes.
  if (lastSeries !== series) {
    setLastSeries(series);
    setActive(defaultIndex);
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = (i: number) => (i / (values.length - 1)) * W;
  const y = (v: number) => PAD_TOP + (1 - (v - min) / (max - min || 1)) * (H - PAD_TOP - 30);

  const line = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(2)} ${y(v).toFixed(2)}`).join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;

  const i = Math.min(active, values.length - 1);
  const px = x(i);
  const py = y(values[i]);

  const pick = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    setActive(Math.round(ratio * (values.length - 1)));
  };

  const leftPct = (px / W) * 100;
  const topPct = (py / H) * 100;

  return (
    <div>
      <div
        ref={ref}
        className={`relative w-full touch-pan-y select-none ${heightClass}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          pick(e.clientX);
        }}
        onPointerMove={(e) => (e.buttons || e.pointerType !== "mouse") && pick(e.clientX)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A9C5FB" stopOpacity={0.9} />
              <stop offset="55%" stopColor="#D6E3FD" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gid})`} />
          <line
            x1={px}
            x2={px}
            y1={0}
            y2={H}
            stroke="#B5C2DC"
            strokeWidth={1.3}
            strokeDasharray="5 5"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={line}
            fill="none"
            stroke="#3D6FF5"
            strokeWidth={2.2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Point marker (HTML so it stays round when the SVG stretches) */}
        <div
          className="pointer-events-none absolute h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#131313] bg-white transition-[left,top] duration-75"
          style={{ left: `${leftPct}%`, top: `${topPct}%` }}
        />
        <div
          className="pointer-events-none absolute whitespace-nowrap rounded-[12px] bg-[#131313] px-3 py-2 text-[14px] font-semibold text-white transition-[left,top] duration-75"
          style={{
            left: `${leftPct}%`,
            top: `${topPct}%`,
            transform: `translate(${leftPct < 15 ? "-10%" : leftPct > 85 ? "-90%" : "-50%"}, calc(-100% - 16px))`,
          }}
        >
          {money(values[i])}
        </div>
      </div>

      <div className="mt-3 flex justify-between pl-2 text-[13px] font-medium text-[#8B8B8B]">
        {labels.map((l, k) => (
          <span key={k} className="min-w-[1ch]">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
