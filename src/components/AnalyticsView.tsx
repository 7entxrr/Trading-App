"use client";

import { useMemo, useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { Change } from "./Change";
import { PriceChart } from "./PriceChart";
import { money, splitMoney } from "@/lib/format";
import { makeSeries, ranges, type Range } from "@/lib/series";
import { portfolio, user } from "@/lib/data";

const COLORS = ["#95BF47", "#2966FF", "#131313", "#FF6900"];

export function AnalyticsView() {
  const [range, setRange] = useState<Range>("7d");
  const series = useMemo(() => makeSeries(97, user.balance, range), [range]);
  const [whole, cents] = splitMoney(user.balance);
  const total = portfolio.reduce((a, s) => a + s.holding, 0);
  const best = [...portfolio].sort((a, b) => b.holdingChange - a.holdingChange);

  return (
    <>
      <div className="mt-5 rounded-[22px] bg-[#131313] p-5 text-white">
        <p className="text-[13px] text-[#9A9A9A]">Total balance</p>
        <p className="mt-1 text-[30px] font-bold">
          {whole}
          <span className="text-[#4A4A4A]">{cents}</span>
        </p>
        <div className="mt-2 flex items-center gap-2">
          <Change value={user.todayChange} colored className="text-[14px]" />
          <span className="rounded-full bg-[#232323] px-2.5 py-0.5 text-[12px] text-[#D6D6D6]">Today</span>
        </div>
      </div>

      <div className="-mx-5 mt-4">
        <PriceChart series={series} />
      </div>
      <div className="mt-5 grid grid-cols-4 gap-2">
        {ranges.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`h-9 rounded-full border text-[13px] font-medium whitespace-nowrap active:scale-95 ${
              range === r.key ? "border-[#131313] text-[#131313]" : "border-[#D9D9D9] text-[#A0A0A0]"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <h2 className="mt-8 text-[20px] font-bold text-[#131313]">Allocation</h2>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full">
        {portfolio.map((s, i) => (
          <div key={s.symbol} style={{ width: `${(s.holding / total) * 100}%`, background: COLORS[i] }} />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-3">
        {portfolio.map((s, i) => (
          <li key={s.symbol} className="flex items-center gap-2 text-[14px] text-[#131313]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} />
            <span className="flex-1 truncate">{s.name}</span>
            <span className="font-semibold">{((s.holding / total) * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-[20px] font-bold text-[#131313]">Top performers</h2>
      <ul className="mt-3 space-y-3">
        {best.map((s) => (
          <li key={s.symbol} className="flex items-center gap-3 rounded-[18px] p-3" style={{ background: s.gradient }}>
            <BrandLogo brand={s.brand} size={38} />
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-[#131313]">{s.name}</p>
              <p className="text-[13px] text-[#8B8B8B]">{s.ticker}</p>
            </div>
            <div className="text-right text-[#131313]">
              <p className="text-[15px] font-bold">{money(s.holding)}</p>
              <Change value={s.holdingChange} className="text-[13px]" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
