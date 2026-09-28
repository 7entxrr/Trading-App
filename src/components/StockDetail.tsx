"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "./BrandLogo";
import { Change } from "./Change";
import { PriceChart } from "./PriceChart";
import { Sheet, useToast } from "./Sheet";
import { BellIcon, ChevronDown, CoinsIcon } from "./icons";
import { money } from "@/lib/format";
import { makeSeries, ranges, type Range } from "@/lib/series";
import { user, type Stock } from "@/lib/data";

const TABS = ["Overview", "Statistics", "History data", "News"] as const;
type Tab = (typeof TABS)[number];

export function StockDetail({ stock }: { stock: Stock }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Overview");
  const [range, setRange] = useState<Range>("24h");
  const [order, setOrder] = useState<"buy" | "sell" | null>(null);
  const [alertOn, setAlertOn] = useState(false);
  const [toast, showToast] = useToast();

  const series = useMemo(
    () => makeSeries(stock.seed, stock.price, range, stock.symbol === "shop"),
    [stock, range],
  );

  const back = () => (window.history.length > 1 ? router.back() : router.push("/"));

  return (
    <div className="screen-in flex min-h-dvh flex-col bg-white pt-[max(16px,env(safe-area-inset-top))]">
      {/* Top bar */}
      <div className="relative flex h-12 items-center justify-between px-6">
        <div className="flex items-center gap-2 text-[15px] font-bold text-[#131313]">
          <CoinsIcon className="h-5 w-5" />
          {money(user.balance)}
        </div>
        <div className="absolute left-1/2 -translate-x-1/2">
          <BrandLogo brand={stock.brand} size={34} />
        </div>
        <button aria-label="Close" onClick={back} className="grid h-10 w-10 place-items-center rounded-full active:bg-black/5">
          <ChevronDown className="h-6 w-6 text-[#131313]" />
        </button>
      </div>

      {/* Tabs */}
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`h-[38px] shrink-0 rounded-full px-4 text-[15px] font-medium whitespace-nowrap transition-colors active:scale-95 ${
              tab === t ? "bg-[#131313] text-white" : "bg-[#ECEFFD] text-[#131313]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Price */}
      <div className="mt-6 text-center">
        <p className="text-[17px] font-medium text-[#131313]">{stock.name}</p>
        <p className="mt-1.5 text-[38px] leading-tight font-bold tracking-[-0.01em] text-[#131313]">{money(stock.price)}</p>
        <div className="mt-1.5 flex justify-center">
          <Change value={stock.priceChange} colored className="text-[15px]" />
        </div>
      </div>

      <div className="flex-1 px-6">
        {tab === "Overview" && (
          <>
            <div className="mt-5 -mx-6 px-0">
              <PriceChart series={series} />
            </div>
            <div className="mt-6 grid grid-cols-4 gap-2">
              {ranges.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRange(r.key)}
                  className={`h-9 rounded-full border text-[13px] font-medium whitespace-nowrap transition-colors active:scale-95 ${
                    range === r.key ? "border-[#131313] text-[#131313]" : "border-[#D9D9D9] text-[#A0A0A0]"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </>
        )}
        {tab === "Statistics" && <Statistics stock={stock} values={series.values} />}
        {tab === "History data" && <History stock={stock} />}
        {tab === "News" && <News stock={stock} />}
      </div>

      {/* Actions */}
      <div className="sticky bottom-0 mt-6 flex gap-3 bg-white px-6 pt-2 pb-[max(24px,env(safe-area-inset-bottom))]">
        <button
          onClick={() => setOrder("buy")}
          className="h-[58px] flex-1 rounded-[16px] bg-[#2966FF] text-[17px] font-semibold text-white transition active:scale-[0.97]"
        >
          Buy
        </button>
        <button
          onClick={() => setOrder("sell")}
          className="h-[58px] flex-1 rounded-[16px] bg-[#131313] text-[17px] font-semibold text-white transition active:scale-[0.97]"
        >
          Sell
        </button>
        <button
          aria-label="Price alert"
          aria-pressed={alertOn}
          onClick={() => {
            setAlertOn((a) => !a);
            showToast(alertOn ? "Price alert removed" : `Alert set for ${stock.name}`);
          }}
          className={`grid h-[58px] w-[58px] place-items-center rounded-[16px] transition active:scale-[0.95] ${
            alertOn ? "bg-[#2966FF] text-white" : "bg-[#EAF0FF] text-[#131313]"
          }`}
        >
          <BellIcon className="h-[22px] w-[22px]" />
        </button>
      </div>

      <OrderSheet
        stock={stock}
        side={order}
        onClose={() => setOrder(null)}
        onDone={(msg) => {
          setOrder(null);
          showToast(msg);
        }}
      />
      {toast}
    </div>
  );
}

function Statistics({ stock, values }: { stock: Stock; values: number[] }) {
  const rows = [
    ["Open", money(values[0])],
    ["High", money(Math.max(...values))],
    ["Low", money(Math.min(...values))],
    ["Prev. close", money(stock.price - stock.priceChange)],
    ["Volume", `${(stock.seed * 0.37).toFixed(1)}M`],
    ["Market cap", `$${(stock.price * stock.seed * 0.9).toFixed(0)}B`],
    ["P/E ratio", (stock.seed * 1.7).toFixed(2)],
    ["Your holding", money(stock.holding)],
  ];
  return (
    <div className="mt-6 grid grid-cols-2 gap-3">
      {rows.map(([k, v]) => (
        <div key={k} className="rounded-[16px] bg-[#F4F6FB] px-4 py-3">
          <p className="text-[13px] text-[#8B8B8B]">{k}</p>
          <p className="mt-1 text-[16px] font-semibold text-[#131313]">{v}</p>
        </div>
      ))}
    </div>
  );
}

function History({ stock }: { stock: Stock }) {
  const days = makeSeries(stock.seed + 5, stock.price, "1m").values.slice(-8).reverse();
  const dates = ["Sep 28", "Sep 27", "Sep 26", "Sep 25", "Sep 24", "Sep 23", "Sep 22", "Sep 21"];
  return (
    <ul className="mt-5 divide-y divide-[#F0F0F0]">
      {days.map((v, i) => {
        const diff = i < days.length - 1 ? v - days[i + 1] : 0;
        return (
          <li key={i} className="flex items-center justify-between py-3.5">
            <span className="text-[15px] text-[#6B6B6B]">{dates[i]}</span>
            <span className="text-[15px] font-semibold text-[#131313]">{money(v)}</span>
            <span className={`w-20 text-right text-[14px] font-medium ${diff >= 0 ? "text-[#22B573]" : "text-[#E5484D]"}`}>
              {diff >= 0 ? "+" : "−"}
              {money(Math.abs(diff))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function News({ stock }: { stock: Stock }) {
  const items = [
    `${stock.name} beats quarterly revenue expectations`,
    `Analysts raise ${stock.ticker} price target`,
    `What's next for ${stock.name} after this week's rally`,
  ];
  return (
    <ul className="mt-5 space-y-3">
      {items.map((t, i) => (
        <li key={t} className="rounded-[16px] bg-[#F4F6FB] p-4">
          <p className="text-[15px] font-semibold text-[#131313]">{t}</p>
          <p className="mt-1 text-[13px] text-[#8B8B8B]">{["2h", "5h", "1d"][i]} ago · Market News</p>
        </li>
      ))}
    </ul>
  );
}

function OrderSheet({
  stock,
  side,
  onClose,
  onDone,
}: {
  stock: Stock;
  side: "buy" | "sell" | null;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const [qty, setQty] = useState(1);
  const [lastSide, setLastSide] = useState(side);
  if (lastSide !== side) {
    setLastSide(side);
    if (side) setQty(1);
  }
  const buy = (side ?? lastSide) === "buy";

  return (
    <Sheet open={side !== null} onClose={onClose} title={`${buy ? "Buy" : "Sell"} ${stock.name}`}>
      <div className="flex items-center justify-between rounded-[16px] bg-[#F4F6FB] p-4">
        <div>
          <p className="text-[13px] text-[#8B8B8B]">Shares</p>
          <p className="text-[28px] font-bold text-[#131313]">{qty}</p>
        </div>
        <div className="flex gap-2">
          {[-1, 1].map((d) => (
            <button
              key={d}
              aria-label={d < 0 ? "Decrease" : "Increase"}
              onClick={() => setQty((q) => Math.max(1, q + d))}
              className="grid h-11 w-11 place-items-center rounded-full bg-white text-[22px] font-semibold text-[#131313] shadow-sm active:scale-95"
            >
              {d < 0 ? "−" : "+"}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 space-y-2 text-[15px]">
        <div className="flex justify-between text-[#8B8B8B]">
          <span>Market price</span>
          <span className="font-medium text-[#131313]">{money(stock.price)}</span>
        </div>
        <div className="flex justify-between text-[#8B8B8B]">
          <span>Estimated total</span>
          <span className="font-semibold text-[#131313]">{money(stock.price * qty)}</span>
        </div>
      </div>
      <button
        onClick={() => onDone(`${buy ? "Bought" : "Sold"} ${qty} ${stock.ticker} · ${money(stock.price * qty)}`)}
        className={`mt-5 h-[56px] w-full rounded-[16px] text-[16px] font-semibold text-white active:scale-[0.98] ${buy ? "bg-[#2966FF]" : "bg-[#131313]"}`}
      >
        Confirm {buy ? "buy" : "sell"}
      </button>
    </Sheet>
  );
}
