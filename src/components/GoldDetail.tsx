"use client";

import { useMemo, useState } from "react";
import { GoldLogo } from "./GoldLogo";
import { Change } from "./Change";
import { PriceChart } from "./PriceChart";
import { Sheet, useToast } from "./Sheet";
import { BellIcon, ChevronDown, CoinsIcon } from "./icons";
import { money } from "@/lib/format";
import { makeSeries, ranges, type Range } from "@/lib/series";
import { gold, positions, user } from "@/lib/data";

const TABS = ["Overview", "Statistics", "History data", "News"] as const;
type Tab = (typeof TABS)[number];

/** The app's single chart screen: spot gold (XAU/USD). Lives on the Market tab. */
export function GoldDetail() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [range, setRange] = useState<Range>("24h");
  const [order, setOrder] = useState<"buy" | "sell" | null>(null);
  const [info, setInfo] = useState(false);
  const [alertOn, setAlertOn] = useState(false);
  const [toast, showToast] = useToast();

  const series = useMemo(() => makeSeries(gold.seed, gold.price, range, true), [range]);

  return (
    <div className="screen-in flex min-h-[calc(100dvh-76px)] flex-col bg-white pt-[max(16px,env(safe-area-inset-top))]">
      {/* Top bar */}
      <div className="relative flex h-12 items-center justify-between px-6">
        <div className="flex items-center gap-2 text-[15px] font-bold text-[#131313]">
          <CoinsIcon className="h-5 w-5" />
          {money(user.balance)}
        </div>
        <div className="absolute left-1/2 -translate-x-1/2">
          <GoldLogo size={34} />
        </div>
        <button
          aria-label="Market info"
          onClick={() => setInfo(true)}
          className="grid h-10 w-10 place-items-center rounded-full active:bg-black/5"
        >
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
        <p className="text-[17px] font-medium text-[#131313]">
          {gold.name} · {gold.pair}
        </p>
        <p className="mt-1.5 text-[38px] leading-tight font-bold tracking-[-0.01em] text-[#131313]">{money(gold.price)}</p>
        <div className="mt-1.5 flex justify-center">
          <Change value={gold.change} colored className="text-[15px]" />
        </div>
      </div>

      <div className="flex-1 px-6">
        {tab === "Overview" && (
          <>
            <div className="mt-5 -ml-6">
              <PriceChart series={series} heightClass="h-[clamp(200px,calc(100dvh-576px),360px)]" />
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
        {tab === "Statistics" && <Statistics values={series.values} />}
        {tab === "History data" && <History />}
        {tab === "News" && <News />}
      </div>

      {/* Actions, pinned just above the bottom nav */}
      <div className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] mt-6 flex gap-3 bg-white px-6 pt-2 pb-4">
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
            showToast(alertOn ? "Price alert removed" : `Alert set at ${money(gold.price)}`);
          }}
          className={`grid h-[58px] w-[58px] place-items-center rounded-[16px] transition active:scale-[0.95] ${
            alertOn ? "bg-[#2966FF] text-white" : "bg-[#EAF0FF] text-[#131313]"
          }`}
        >
          <BellIcon className="h-[22px] w-[22px]" />
        </button>
      </div>

      <Sheet open={info} onClose={() => setInfo(false)} title={`${gold.name} · ${gold.pair}`}>
        <InfoRows
          rows={[
            ["Spread", "0.25"],
            ["Contract size", "100 oz / lot"],
            ["Min / max lot", "0.01 / 50"],
            ["Leverage", "1:100"],
            ["Trading hours", "Mon–Fri, 24h"],
            ["Open positions", String(positions.length)],
          ]}
        />
      </Sheet>

      <OrderSheet
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

function InfoRows({ rows }: { rows: string[][] }) {
  return (
    <ul className="divide-y divide-[#F0F0F0]">
      {rows.map(([k, v]) => (
        <li key={k} className="flex justify-between py-3 text-[15px]">
          <span className="text-[#8B8B8B]">{k}</span>
          <span className="font-semibold text-[#131313]">{v}</span>
        </li>
      ))}
    </ul>
  );
}

function Statistics({ values }: { values: number[] }) {
  const rows = [
    ["Open", money(values[0])],
    ["High", money(Math.max(...values))],
    ["Low", money(Math.min(...values))],
    ["Prev. close", money(gold.price - gold.change)],
    ["Bid", money(gold.price - 0.12)],
    ["Ask", money(gold.price + 0.13)],
    ["Day range", `${(Math.max(...values) - Math.min(...values)).toFixed(2)} pts`],
    ["Open positions", String(positions.length)],
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

function History() {
  const days = makeSeries(gold.seed + 5, gold.price, "1m").values.slice(-8).reverse();
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

function News() {
  const items = [
    "Gold climbs as the dollar softens after Fed minutes",
    "Central bank gold buying hits a record quarter",
    "What's next for gold after this week's rally",
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

const LOT_STEPS = [0.01, 0.05, 0.1, 0.25, 0.5, 1];

function OrderSheet({
  side,
  onClose,
  onDone,
}: {
  side: "buy" | "sell" | null;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const [lots, setLots] = useState(0.1);
  const [lastSide, setLastSide] = useState(side);
  if (lastSide !== side) {
    setLastSide(side);
    if (side) setLots(0.1);
  }
  const buy = (side ?? lastSide) === "buy";
  const price = buy ? gold.price + 0.13 : gold.price - 0.12;
  const margin = (price * lots * 100) / 100; // 1:100 leverage

  return (
    <Sheet open={side !== null} onClose={onClose} title={`${buy ? "Buy" : "Sell"} ${gold.name}`}>
      <div className="rounded-[16px] bg-[#F4F6FB] p-4">
        <p className="text-[13px] text-[#8B8B8B]">Volume (lots)</p>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-[28px] font-bold text-[#131313]">{lots.toFixed(2)}</p>
          <div className="flex gap-2">
            {[-1, 1].map((d) => (
              <button
                key={d}
                aria-label={d < 0 ? "Decrease" : "Increase"}
                onClick={() => setLots((l) => Math.min(50, Math.max(0.01, Math.round((l + d * 0.01) * 100) / 100)))}
                className="grid h-11 w-11 place-items-center rounded-full bg-white text-[22px] font-semibold text-[#131313] shadow-sm active:scale-95"
              >
                {d < 0 ? "−" : "+"}
              </button>
            ))}
          </div>
        </div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {LOT_STEPS.map((l) => (
            <button
              key={l}
              onClick={() => setLots(l)}
              className={`h-8 shrink-0 rounded-full border px-3 text-[13px] font-medium active:scale-95 ${
                lots === l ? "border-[#131313] bg-white text-[#131313]" : "border-[#D9D9D9] text-[#8B8B8B]"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 space-y-2 text-[15px]">
        <div className="flex justify-between text-[#8B8B8B]">
          <span>{buy ? "Ask" : "Bid"} price</span>
          <span className="font-medium text-[#131313]">{money(price)}</span>
        </div>
        <div className="flex justify-between text-[#8B8B8B]">
          <span>Contract</span>
          <span className="font-medium text-[#131313]">{Math.round(lots * 100)} oz</span>
        </div>
        <div className="flex justify-between text-[#8B8B8B]">
          <span>Required margin</span>
          <span className="font-semibold text-[#131313]">{money(margin)}</span>
        </div>
      </div>
      <button
        onClick={() => onDone(`${buy ? "Bought" : "Sold"} ${lots.toFixed(2)} lot ${gold.pair} @ ${money(price)}`)}
        className={`mt-5 h-[56px] w-full rounded-[16px] text-[16px] font-semibold text-white active:scale-[0.98] ${buy ? "bg-[#2966FF]" : "bg-[#131313]"}`}
      >
        Confirm {buy ? "buy" : "sell"}
      </button>
    </Sheet>
  );
}
