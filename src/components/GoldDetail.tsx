"use client";

import { useMemo, useState } from "react";
import { ActionConfirm } from "./ActionConfirm";
import { AlertsSheet } from "./AlertsSheet";
import { Change } from "./Change";
import { ControlsSheet } from "./ControlsSheet";
import { DataNotice } from "./DataNotice";
import { GoldLogo } from "./GoldLogo";
import { PriceChart } from "./PriceChart";
import { BellIcon, ChevronDown, CoinsIcon } from "./icons";
import { buy, sell } from "@/lib/api/goldminer";
import { useAccount, useBaskets, useMarket, useOrders, useStatus } from "@/lib/api/hooks";
import { lots, money, num, price, time } from "@/lib/format";
import { ranges, toSeries, type Range } from "@/lib/series";

const TABS = ["Overview", "Statistics", "Baskets", "Orders"] as const;
type Tab = (typeof TABS)[number];

/** The app's single chart screen: gold (XAUUSD). Lives on the Market tab. */
export function GoldDetail() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [range, setRange] = useState<Range>("24h");
  const [order, setOrder] = useState<"buy" | "sell" | null>(null);
  const [controls, setControls] = useState(false);
  const [alerts, setAlerts] = useState(false);

  const market = useMarket();
  const account = useAccount();
  const quote = market.data;
  const series = useMemo(() => toSeries(quote?.history, range), [quote?.history, range]);
  // BUY positions report the bid, SELL positions the ask (MT5 price_current).
  const shown = quote?.bid ?? quote?.ask ?? null;

  return (
    <div className="screen-in flex min-h-[calc(100dvh-76px)] flex-col bg-white pt-[max(16px,env(safe-area-inset-top))]">
      {/* Top bar */}
      <div className="relative flex h-12 items-center justify-between px-6">
        <div className="flex items-center gap-2 text-[15px] font-bold text-[#131313]">
          <CoinsIcon className="h-5 w-5" />
          {money(account.data?.balance, account.data?.currency)}
        </div>
        <div className="absolute left-1/2 -translate-x-1/2">
          <GoldLogo size={34} />
        </div>
        <button
          aria-label="Controls"
          onClick={() => setControls(true)}
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
        <p className="text-[17px] font-medium text-[#131313]">Gold · {quote?.symbol ?? "XAUUSD"}</p>
        <p className="mt-1.5 text-[38px] leading-tight font-bold tracking-[-0.01em] text-[#131313]">
          {shown === null ? "—" : price(shown)}
        </p>
        <div className="mt-1.5 flex min-h-[22px] justify-center">
          {quote?.change != null ? (
            <Change value={quote.change} colored className="text-[15px]" format={(v) => price(v)} />
          ) : quote?.ask != null ? (
            <span className="text-[14px] text-[#8B8B8B]">Ask {price(quote.ask)}</span>
          ) : quote && shown === null ? (
            <span className="text-[13px] text-[#8B8B8B]">Live price is shown while a gold position is open</span>
          ) : null}
        </div>
      </div>

      <div className="flex-1 px-6">
        {tab === "Overview" && (
          <>
            {series ? (
              <div className="mt-5 -ml-6">
                <PriceChart series={series} heightClass="h-[clamp(200px,calc(100dvh-576px),360px)]" />
              </div>
            ) : (
              <div className="mt-5 grid h-[clamp(200px,calc(100dvh-576px),360px)] place-items-center rounded-[20px] bg-gradient-to-b from-[#EEF3FE] to-white px-6">
                <DataNotice
                  resource={market}
                  isEmpty
                  empty={quote?.history ? "Not enough price history for this range yet" : "Price history is not provided by the API"}
                />
              </div>
            )}
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
        {tab === "Statistics" && <Statistics />}
        {tab === "Baskets" && <Baskets />}
        {tab === "Orders" && <Orders />}
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
          aria-label="Alerts"
          onClick={() => setAlerts(true)}
          className="grid h-[58px] w-[58px] place-items-center rounded-[16px] bg-[#EAF0FF] text-[#131313] transition active:scale-[0.95]"
        >
          <BellIcon className="h-[22px] w-[22px]" />
        </button>
      </div>

      <ActionConfirm
        open={order !== null}
        onClose={() => setOrder(null)}
        title={order === "sell" ? "Market SELL" : "Market BUY"}
        body={
          <p>
            Places a live market {order === "sell" ? "SELL" : "BUY"} order on your MT5 account. SL/TP are optional.
          </p>
        }
        fields={[
          { key: "volume", label: "Volume (lots)", initial: "0.01", hint: "0.01" },
          { key: "sl", label: "Stop loss", optional: true },
          { key: "tp", label: "Take profit", optional: true },
        ]}
        confirmLabel={order === "sell" ? "Place SELL" : "Place BUY"}
        runningLabel={order === "sell" ? "Placing SELL…" : "Placing BUY…"}
        danger={order === "sell"}
        kind="trade"
        run={(request_id, v) =>
          (order === "sell" ? sell : buy)({
            request_id,
            volume: v.volume!,
            sl: v.sl,
            tp: v.tp,
            comment: `Web manual ${order}`,
            client_id: "web-app",
          })
        }
      />
      <ControlsSheet open={controls} onClose={() => setControls(false)} />
      <AlertsSheet open={alerts} onClose={() => setAlerts(false)} />
    </div>
  );
}

function Grid({ rows }: { rows: [string, string][] }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3">
      {rows.map(([k, v]) => (
        <div key={k} className="rounded-[16px] bg-[#F4F6FB] px-4 py-3">
          <p className="text-[13px] text-[#8B8B8B]">{k}</p>
          <p className="mt-1 truncate text-[16px] font-semibold text-[#131313]">{v}</p>
        </div>
      ))}
    </div>
  );
}

/** GET /api/account figures */
function Statistics() {
  const account = useAccount();
  const st = useStatus().data;
  const a = account.data;
  const c = a?.currency;
  if (!a) return <DataNotice className="mt-6" resource={account} />;
  const yesNo = (b: boolean | null) => (b === null ? "—" : b ? "Yes" : "No");
  return (
    <Grid
      rows={[
        ["Equity", money(a.equity, c)],
        ["Balance", money(a.balance, c)],
        ["Margin", money(a.margin, c)],
        ["Free margin", money(a.freeMargin, c)],
        ["Margin level", a.marginLevel === null ? "—" : `${num(a.marginLevel)}%`],
        ["Leverage", a.leverage === null ? "—" : `1:${num(a.leverage, 0)}`],
        ["Trading allowed", yesNo(a.tradeAllowed)],
        ["EA trading", yesNo(a.tradeExpert)],
        ["Balance multiplier", st?.multiplier == null ? "—" : `×${num(st.multiplier)}`],
        ["Balance slab", st?.slab ?? "—"],
        ["Broker", a.broker ?? "—"],
        ["Server", a.server ?? "—"],
        ["Updated", time(a.timestamp)],
      ]}
    />
  );
}

/** GET /api/baskets — backend is the source of truth for basket figures. */
function Baskets() {
  const baskets = useBaskets();
  const currency = useAccount().data?.currency;
  const list = baskets.data ?? [];
  if (!baskets.data) return <DataNotice className="mt-6" resource={baskets} />;
  if (!list.length) return <DataNotice className="mt-6" resource={baskets} isEmpty empty="No active baskets" />;
  return (
    <div className="mt-6 space-y-3">
      {list.map((b) => (
        <div key={b.side} className="rounded-[18px] bg-[#F4F6FB] p-4">
          <div className="flex items-center justify-between">
            <p className={`text-[16px] font-bold ${b.side === "buy" ? "text-[#2966FF]" : "text-[#131313]"}`}>
              {b.side === "buy" ? "BUY" : "SELL"} basket
            </p>
            <p className={`text-[16px] font-bold ${(b.floatingPnl ?? 0) >= 0 ? "text-[#22B573]" : "text-[#E5484D]"}`}>
              {money(b.floatingPnl, currency)}
            </p>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2 text-[13px]">
            <Stat k="Positions" v={num(b.count, 0)} />
            <Stat k="Lots" v={lots(b.lots)} />
            <Stat k="VWAP" v={price(b.vwap)} />
            <Stat k="Basket TP" v={price(b.tp)} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-[#8B8B8B]">{k}</p>
      <p className="truncate font-semibold text-[#131313]">{v}</p>
    </div>
  );
}

/** GET /api/orders — pending orders only (separate from open positions). */
function Orders() {
  const orders = useOrders();
  const list = orders.data ?? [];
  return (
    <div className="mt-5">
      <p className="text-[13px] text-[#8B8B8B]">Pending orders are separate from open positions.</p>
      <DataNotice className="mt-3" resource={orders} isEmpty={list.length === 0} empty="No pending orders" />
      <ul className="divide-y divide-[#F0F0F0]">
        {list.map((o) => (
          <li key={o.ticket} className="flex items-center justify-between gap-3 py-3.5">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-[#131313]">
                {o.orderType ?? (o.side ? o.side.toUpperCase() : "Order")} · {lots(o.volume)} lot
              </p>
              <p className="text-[13px] text-[#8B8B8B]">
                #{o.ticket} · {time(o.time)}
              </p>
            </div>
            <div className="text-right text-[13px] text-[#8B8B8B]">
              <p className="text-[15px] font-semibold text-[#131313]">{price(o.price)}</p>
              <p>
                SL {price(o.sl)} · TP {price(o.tp)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
