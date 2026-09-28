"use client";

import { useMemo, useState } from "react";
import { Change } from "./Change";
import { DataNotice } from "./DataNotice";
import { GoldLogo } from "./GoldLogo";
import { PositionSheet } from "./PositionSheet";
import { PriceChart } from "./PriceChart";
import { cardGradient } from "./PositionCard";
import { useAccount, usePerformance, usePositions } from "@/lib/api/hooks";
import { lots, money, num, price, signedMoney, splitMoney } from "@/lib/format";
import { ranges, toSeries, type Range } from "@/lib/series";

export function AnalyticsView() {
  const [range, setRange] = useState<Range>("7d");
  const [metric, setMetric] = useState<"equity" | "balance">("equity");
  const [open, setOpen] = useState<string | null>(null);
  const account = useAccount();
  const performance = usePerformance();
  const positions = usePositions();

  const a = account.data;
  const c = a?.currency;
  const [whole, cents] = splitMoney(a?.balance, c);
  const series = useMemo(() => toSeries(performance.data?.[metric], range), [performance.data, metric, range]);
  const list = positions.data ?? [];
  const perf = performance.data;

  return (
    <>
      <div className="mt-5 rounded-[22px] bg-[#131313] p-5 text-white">
        <p className="text-[13px] text-[#9A9A9A]">Balance</p>
        <p className="mt-1 text-[30px] font-bold">
          {whole}
          <span className="text-[#4A4A4A]">{cents}</span>
        </p>
        <div className="mt-2 flex min-h-[24px] items-center gap-2">
          {a?.profit != null ? (
            <>
              <Change value={a.profit} colored className="text-[14px]" currency={c} />
              <span className="rounded-full bg-[#232323] px-2.5 py-0.5 text-[12px] text-[#D6D6D6]">Open P/L</span>
            </>
          ) : (
            <DataNotice dark resource={account} className="!p-0 !bg-transparent !text-left" />
          )}
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        {(["equity", "balance"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`h-[34px] rounded-full px-4 text-[14px] font-medium capitalize active:scale-95 ${
              metric === m ? "bg-[#131313] text-white" : "bg-[#ECEFFD] text-[#131313]"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      {series ? (
        <div className="-ml-5 mt-4">
          <PriceChart series={series} />
        </div>
      ) : (
        <div className="mt-4 grid h-[260px] place-items-center rounded-[20px] bg-gradient-to-b from-[#EEF3FE] to-white px-6">
          <DataNotice
            resource={performance}
            isEmpty
            empty={perf?.collecting ? "The server is still collecting history" : "Not enough history for this range yet"}
          />
        </div>
      )}
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
      {a || perf ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(
            [
              ["Equity", money(a?.equity, c)],
              ["Floating P/L", signedMoney(a?.profit, c)],
              ["Margin", money(a?.margin, c)],
              ["Free margin", money(a?.freeMargin, c)],
              ["Profit", signedMoney(perf?.profit, c)],
              ["Drawdown", perf?.drawdown == null ? "—" : `${num(perf.drawdown)}%`],
            ] as [string, string][]
          ).map(([k, v]) => (
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
      ) : (
        <DataNotice className="mt-3" resource={account} />
      )}

      <h2 className="mt-8 text-[20px] font-bold text-[#131313]">Open positions</h2>
      <DataNotice className="mt-3" resource={positions} isEmpty={list.length === 0} empty="No open positions" />
      <ul className="mt-3 space-y-3">
        {list.map((p, i) => (
          <li key={p.ticket}>
            <button
              onClick={() => setOpen(p.ticket)}
              className="flex w-full items-center gap-3 rounded-[18px] p-3 text-left active:scale-[0.98]"
              style={{ background: cardGradient(i) }}
            >
              <GoldLogo size={38} />
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-[#131313]">
                  {p.side === "buy" ? "Buy" : "Sell"} {lots(p.volume)} lot
                </p>
                <p className="text-[13px] text-[#8B8B8B]">
                  #{p.ticket} · open {price(p.openPrice)}
                </p>
              </div>
              <p className={`text-[15px] font-bold ${(p.profit ?? 0) >= 0 ? "text-[#22B573]" : "text-[#E5484D]"}`}>
                {signedMoney(p.profit, c)}
              </p>
            </button>
          </li>
        ))}
      </ul>
      <PositionSheet ticket={open} onClose={() => setOpen(null)} currency={c} />
    </>
  );
}
