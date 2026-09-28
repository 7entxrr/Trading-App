"use client";

import { useState } from "react";
import { PlusSquare, UploadSquare } from "./icons";
import { money } from "@/lib/format";
import { closedTrades, gold, transfers } from "@/lib/data";

const FILTERS = ["All trades", "Buy", "Sell", "Transfers"] as const;
type Filter = (typeof FILTERS)[number];

function signed(v: number) {
  return `${v >= 0 ? "+" : "−"}${money(Math.abs(v))}`;
}

export function HistoryView() {
  const [filter, setFilter] = useState<Filter>("All trades");
  const trades = closedTrades.filter(
    (t) => filter === "All trades" || t.side === filter.toLowerCase(),
  );
  const net = trades.reduce((a, t) => a + t.pnl, 0);

  return (
    <>
      <div className="no-scrollbar -mx-5 mt-5 flex gap-2 overflow-x-auto px-5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`h-[38px] shrink-0 rounded-full px-4 text-[15px] font-medium whitespace-nowrap transition-colors active:scale-95 ${
              filter === f ? "bg-[#131313] text-white" : "bg-[#ECEFFD] text-[#131313]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filter !== "Transfers" ? (
        <>
          <div className="mt-5 flex items-center justify-between rounded-[18px] bg-[#F4F6FB] px-4 py-3.5">
            <div>
              <p className="text-[13px] text-[#8B8B8B]">{trades.length} closed trades</p>
              <p className="text-[13px] text-[#8B8B8B]">{gold.pair}</p>
            </div>
            <p className={`text-[20px] font-bold ${net >= 0 ? "text-[#22B573]" : "text-[#E5484D]"}`}>{signed(net)}</p>
          </div>
          <ul className="mt-2 divide-y divide-[#F0F0F0]">
            {trades.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-3.5">
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                    t.side === "buy" ? "bg-[#EAF0FF] text-[#2966FF]" : "bg-[#EDEDED] text-[#131313]"
                  }`}
                >
                  {t.side === "buy" ? "BUY" : "SELL"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-[#131313]">
                    {t.lots.toFixed(2)} lot · #{t.id}
                  </p>
                  <p className="truncate text-[13px] text-[#8B8B8B]">
                    {money(t.open)} → {money(t.close)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-[15px] font-bold ${t.pnl >= 0 ? "text-[#22B573]" : "text-[#E5484D]"}`}>{signed(t.pnl)}</p>
                  <p className="text-[12px] text-[#A3A3A3]">{t.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <ul className="mt-3 divide-y divide-[#F0F0F0]">
          {transfers.map((t) => {
            const dep = t.kind === "deposit";
            return (
              <li key={t.id} className="flex items-center gap-3 py-3.5">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${dep ? "bg-[#2966FF]" : "bg-[#131313]"}`}>
                  {dep ? <PlusSquare className="h-6 w-6" /> : <UploadSquare className="h-6 w-6" />}
                </span>
                <div className="flex-1">
                  <p className="text-[15px] font-semibold text-[#131313]">{dep ? "Deposit" : "Withdrawal"}</p>
                  <p className="text-[13px] text-[#8B8B8B]">{t.time}</p>
                </div>
                <p className={`text-[15px] font-bold ${dep ? "text-[#22B573]" : "text-[#131313]"}`}>
                  {dep ? "+" : "−"}
                  {money(t.amount)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
