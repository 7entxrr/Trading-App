"use client";

import { useMemo, useState } from "react";
import { GoldLogo } from "./GoldLogo";
import { Change } from "./Change";
import { PriceChart } from "./PriceChart";
import { money, splitMoney } from "@/lib/format";
import { makeSeries, ranges, type Range } from "@/lib/series";
import { closedTrades, gold, positionPnl, positions, user } from "@/lib/data";

function signed(v: number) {
  return `${v >= 0 ? "+" : "−"}${money(Math.abs(v))}`;
}

export function AnalyticsView() {
  const [range, setRange] = useState<Range>("7d");
  const series = useMemo(() => makeSeries(97, user.balance, range), [range]);
  const [whole, cents] = splitMoney(user.balance);

  const wins = closedTrades.filter((t) => t.pnl > 0).length;
  const net = closedTrades.reduce((a, t) => a + t.pnl, 0);
  const best = Math.max(...closedTrades.map((t) => t.pnl));
  const openPnl = positions.reduce((a, p) => a + positionPnl(p), 0);
  const stats = [
    ["Win rate", `${Math.round((wins / closedTrades.length) * 100)}%`],
    ["Closed trades", String(closedTrades.length)],
    ["Net P/L", signed(net)],
    ["Best trade", signed(best)],
    ["Open P/L", signed(openPnl)],
    ["Open positions", String(positions.length)],
  ];

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

      <div className="-ml-5 mt-4">
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

      <h2 className="mt-8 text-[20px] font-bold text-[#131313]">Performance</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-[16px] bg-[#F4F6FB] px-4 py-3">
            <p className="text-[13px] text-[#8B8B8B]">{k}</p>
            <p
              className={`mt-1 text-[17px] font-semibold ${
                v.startsWith("+") ? "text-[#22B573]" : v.startsWith("−") ? "text-[#E5484D]" : "text-[#131313]"
              }`}
            >
              {v}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-[20px] font-bold text-[#131313]">Open positions</h2>
      <ul className="mt-3 space-y-3">
        {positions.map((p) => {
          const pnl = positionPnl(p);
          return (
            <li key={p.id} className="flex items-center gap-3 rounded-[18px] p-3" style={{ background: p.gradient }}>
              <GoldLogo size={38} />
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-[#131313]">
                  {p.side === "buy" ? "Buy" : "Sell"} {p.lots.toFixed(2)} lot
                </p>
                <p className="text-[13px] text-[#8B8B8B]">
                  #{p.id} · open {money(p.openPrice)}
                </p>
              </div>
              <p className={`text-[15px] font-bold ${pnl >= 0 ? "text-[#22B573]" : "text-[#E5484D]"}`}>{signed(pnl)}</p>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-8 text-[20px] font-bold text-[#131313]">Recent trades</h2>
      <ul className="mt-2 divide-y divide-[#F0F0F0]">
        {closedTrades.map((t) => (
          <li key={t.id} className="flex items-center gap-3 py-3">
            <span
              className={`grid h-10 w-10 place-items-center rounded-full text-[12px] font-bold ${
                t.side === "buy" ? "bg-[#EAF0FF] text-[#2966FF]" : "bg-[#EDEDED] text-[#131313]"
              }`}
            >
              {t.side === "buy" ? "BUY" : "SELL"}
            </span>
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-[#131313]">
                {gold.pair} · {t.lots.toFixed(2)} lot
              </p>
              <p className="text-[13px] text-[#8B8B8B]">
                {money(t.open)} → {money(t.close)} · {t.time}
              </p>
            </div>
            <p className={`text-[15px] font-bold ${t.pnl >= 0 ? "text-[#22B573]" : "text-[#E5484D]"}`}>{signed(t.pnl)}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
