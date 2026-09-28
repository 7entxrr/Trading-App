"use client";

import { useState } from "react";
import { DataNotice } from "./DataNotice";
import { useAccount, useCommands, useTrades } from "@/lib/api/hooks";
import { lots, price, signedMoney, time } from "@/lib/format";

const FILTERS = ["All trades", "Buy", "Sell", "Commands"] as const;
type Filter = (typeof FILTERS)[number];

/** GET /api/trades (closed trades) and GET /api/commands (audit log). */
export function HistoryView() {
  const [filter, setFilter] = useState<Filter>("All trades");
  const trades = useTrades();
  const currency = useAccount().data?.currency;

  const list = (trades.data ?? []).filter((t) => filter === "All trades" || t.side === filter.toLowerCase());

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

      {filter === "Commands" ? (
        <Commands />
      ) : (
        <>
          <DataNotice className="mt-5" resource={trades} isEmpty={list.length === 0} empty="No trades" />
          <ul className="mt-2 divide-y divide-[#F0F0F0]">
            {list.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-3.5">
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                    t.side === "buy" ? "bg-[#EAF0FF] text-[#2966FF]" : "bg-[#EDEDED] text-[#131313]"
                  }`}
                >
                  {t.side ? t.side.toUpperCase() : "—"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-[#131313]">
                    {lots(t.volume)} lot · #{t.id}
                  </p>
                  <p className="truncate text-[13px] text-[#8B8B8B]">
                    @ {price(t.price)}
                    {t.comment ? ` · ${t.comment}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-[15px] font-bold ${(t.profit ?? 0) >= 0 ? "text-[#22B573]" : "text-[#E5484D]"}`}>
                    {signedMoney(t.profit, currency)}
                  </p>
                  <p className="text-[12px] text-[#A3A3A3]">{time(t.time)}</p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function Commands() {
  const commands = useCommands();
  const list = commands.data ?? [];
  const tone = (s: string) =>
    /fail|error|reject/i.test(s) ? "bg-[#FDECEC] text-[#C8323A]" : /ok|success|done|filled|executed/i.test(s) ? "bg-[#E9F8F1] text-[#138A5A]" : "bg-[#F4F6FB] text-[#6B6B6B]";
  return (
    <>
      <DataNotice className="mt-5" resource={commands} isEmpty={list.length === 0} empty="No commands yet" />
      <ul className="mt-2 divide-y divide-[#F0F0F0]">
        {list.map((c) => (
          <li key={c.id} className="py-3.5">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-[15px] font-semibold text-[#131313]">
                {c.action}
                {c.ticket ? ` · #${c.ticket}` : ""}
              </p>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${tone(c.status)}`}>{c.status}</span>
            </div>
            <p className="mt-0.5 truncate text-[13px] text-[#8B8B8B]">
              {time(c.time)}
              {c.message ? ` · ${c.message}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
