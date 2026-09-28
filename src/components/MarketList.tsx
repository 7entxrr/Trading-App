"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { MiniChart } from "./Sparkline";
import { SearchIcon, TrendDot } from "./icons";
import { money } from "@/lib/format";
import { makeSeries } from "@/lib/series";
import { stocks } from "@/lib/data";

const FILTERS = ["All", "Tech", "Retail", "Sports", "Auto"] as const;

export function MarketList() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return stocks.filter(
      (s) =>
        (filter === "All" || s.sector === filter) &&
        (!term || s.name.toLowerCase().includes(term) || s.ticker.toLowerCase().includes(term)),
    );
  }, [q, filter]);

  return (
    <>
      <label className="mt-5 flex h-12 items-center gap-2.5 rounded-[16px] bg-[#F4F6FB] px-4">
        <SearchIcon className="h-5 w-5 text-[#9A9A9A]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search stocks"
          className="w-full bg-transparent text-[15px] text-[#131313] outline-none placeholder:text-[#A3A3A3]"
        />
      </label>

      <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`h-[38px] shrink-0 rounded-full px-4 text-[15px] font-medium transition-colors active:scale-95 ${
              filter === f ? "bg-[#131313] text-white" : "bg-[#ECEFFD] text-[#131313]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <ul className="mt-3">
        {rows.map((s) => {
          const up = s.priceChange >= 0;
          const pct = (s.priceChange / (s.price - s.priceChange)) * 100;
          return (
            <li key={s.symbol}>
              <Link href={`/stock/${s.symbol}`} className="flex items-center gap-3 rounded-[16px] py-3 active:bg-[#F7F7F7]">
                <BrandLogo brand={s.brand} size={42} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-[#131313]">{s.name}</p>
                  <p className="text-[13px] text-[#A3A3A3]">{s.ticker}</p>
                </div>
                <MiniChart values={makeSeries(s.seed, s.price, "7d").values} up={up} />
                <div className="w-[88px] text-right">
                  <p className="text-[15px] font-semibold text-[#131313]">{money(s.price)}</p>
                  <p className={`mt-0.5 inline-flex items-center gap-1 text-[13px] font-medium ${up ? "text-[#22B573]" : "text-[#E5484D]"}`}>
                    <TrendDot up={up} className="h-3.5 w-3.5" />
                    {Math.abs(pct).toFixed(2)}%
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
        {rows.length === 0 && <li className="py-10 text-center text-[15px] text-[#9A9A9A]">No stocks found</li>}
      </ul>
    </>
  );
}
