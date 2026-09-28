"use client";

import { useState, type ReactNode } from "react";
import { ActionConfirm, type Field, type Values } from "./ActionConfirm";
import { DataNotice } from "./DataNotice";
import { Sheet } from "./Sheet";
import { useTradingEnabled } from "./AuthGate";
import * as gm from "@/lib/api/goldminer";
import { useLiveRefresh, type REFRESH_AFTER } from "@/lib/api/live";
import { useOrders, usePositions, useProtection } from "@/lib/api/hooks";
import { lots, money, time } from "@/lib/format";
import type { Position, ProtectionRule, Side } from "@/lib/models";

type Summary = { count: number; lots: number };

function summarize(list: Position[] | undefined, side: Side): Summary | null {
  if (!list) return null;
  const s = list.filter((p) => p.side === side);
  return { count: s.length, lots: s.reduce((a, p) => a + p.volume, 0) };
}

type ActionKey =
  | "close-buy"
  | "close-sell"
  | "close-all"
  | "tp-buy"
  | "tp-sell"
  | "tp-all"
  | "sl-buy"
  | "sl-sell"
  | "sl-all"
  | "cancel-buy"
  | "cancel-sell"
  | "cancel-all"
  | "prot-tp-set"
  | "prot-tp-remove"
  | "prot-sl-set"
  | "prot-sl-remove"
  | "emergency";

type Spec = {
  title: string;
  body: ReactNode;
  fields?: Field[];
  atLeastOne?: string[];
  confirmLabel: string;
  runningLabel: string;
  danger?: boolean;
  requireText?: string;
  unavailable?: string | null;
  kind: keyof typeof REFRESH_AFTER;
  run: (requestId: string, v: Values) => Promise<unknown>;
};

/** Market → Controls: bulk position actions, pending orders, protection, emergency. */
export function ControlsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const tradingEnabled = useTradingEnabled();
  const positions = usePositions();
  const orders = useOrders();
  const protection = useProtection();
  const refresh = useLiveRefresh();
  const [active, setActive] = useState<ActionKey | null>(null);

  const buy = summarize(positions.data, "buy");
  const sell = summarize(positions.data, "sell");
  const posUnavailable = positions.data ? null : "Live positions are unavailable, so the app can't show what would be affected.";
  const ordersBy = (side: Side | null) =>
    orders.data ? (side ? orders.data.filter((o) => o.side === side).length : orders.data.length) : null;

  const counts = (s: Summary | null, label: string) =>
    s ? (
      <b>
        {s.count} {label} position{s.count === 1 ? "" : "s"} ({lots(s.lots)} lots)
      </b>
    ) : (
      <b>{label} positions</b>
    );

  const specs: Record<ActionKey, Spec> = {
    "close-buy": {
      title: "Close BUY positions?",
      body: <p>Close {counts(buy, "BUY")}. This cannot be undone.</p>,
      confirmLabel: `Close ${buy?.count ?? ""} BUY`,
      runningLabel: "Closing…",
      danger: true,
      unavailable: posUnavailable ?? (buy?.count === 0 ? "There are no BUY positions." : null),
      kind: "close",
      run: (request_id) => gm.closeBuy({ request_id }),
    },
    "close-sell": {
      title: "Close SELL positions?",
      body: <p>Close {counts(sell, "SELL")}. This cannot be undone.</p>,
      confirmLabel: `Close ${sell?.count ?? ""} SELL`,
      runningLabel: "Closing…",
      danger: true,
      unavailable: posUnavailable ?? (sell?.count === 0 ? "There are no SELL positions." : null),
      kind: "close",
      run: (request_id) => gm.closeSell({ request_id }),
    },
    "close-all": {
      title: "Close ALL positions?",
      body: (
        <div className="space-y-1">
          <p>
            BUY: <b>{buy?.count ?? "—"}</b> ({lots(buy?.lots)} lots)
          </p>
          <p>
            SELL: <b>{sell?.count ?? "—"}</b> ({lots(sell?.lots)} lots)
          </p>
          <p className="pt-2 font-semibold text-[#E5484D]">This action cannot be undone.</p>
        </div>
      ),
      confirmLabel: "CONFIRM CLOSE ALL",
      runningLabel: "Closing all…",
      danger: true,
      unavailable: posUnavailable ?? (buy && sell && buy.count + sell.count === 0 ? "There are no open positions." : null),
      kind: "close",
      run: (request_id) => gm.closeAll({ request_id }),
    },
    "tp-buy": {
      title: "Set TP for BUY positions",
      body: <p>Applies to {counts(buy, "BUY")}.</p>,
      fields: [{ key: "tp", label: "Take profit price" }],
      confirmLabel: "Set BUY TP",
      runningLabel: "Updating…",
      unavailable: posUnavailable,
      kind: "tpsl",
      run: (request_id, v) => gm.setTpBuy({ request_id, tp: v.tp! }),
    },
    "tp-sell": {
      title: "Set TP for SELL positions",
      body: <p>Applies to {counts(sell, "SELL")}.</p>,
      fields: [{ key: "tp", label: "Take profit price" }],
      confirmLabel: "Set SELL TP",
      runningLabel: "Updating…",
      unavailable: posUnavailable,
      kind: "tpsl",
      run: (request_id, v) => gm.setTpSell({ request_id, tp: v.tp! }),
    },
    "tp-all": {
      title: "Set TP for all positions",
      body: <p>BUY and SELL use separate prices. Leave one empty to skip that side.</p>,
      fields: [
        { key: "buy_tp", label: "BUY take profit", optional: true },
        { key: "sell_tp", label: "SELL take profit", optional: true },
      ],
      atLeastOne: ["buy_tp", "sell_tp"],
      confirmLabel: "Set TP",
      runningLabel: "Updating…",
      unavailable: posUnavailable,
      kind: "tpsl",
      run: (request_id, v) => gm.setTpAll({ request_id, buy_tp: v.buy_tp, sell_tp: v.sell_tp }),
    },
    "sl-buy": {
      title: "Set SL for BUY positions",
      body: <p>Applies to {counts(buy, "BUY")}.</p>,
      fields: [{ key: "sl", label: "Stop loss price" }],
      confirmLabel: "Set BUY SL",
      runningLabel: "Updating…",
      unavailable: posUnavailable,
      kind: "tpsl",
      run: (request_id, v) => gm.setSlBuy({ request_id, sl: v.sl! }),
    },
    "sl-sell": {
      title: "Set SL for SELL positions",
      body: <p>Applies to {counts(sell, "SELL")}.</p>,
      fields: [{ key: "sl", label: "Stop loss price" }],
      confirmLabel: "Set SELL SL",
      runningLabel: "Updating…",
      unavailable: posUnavailable,
      kind: "tpsl",
      run: (request_id, v) => gm.setSlSell({ request_id, sl: v.sl! }),
    },
    "sl-all": {
      title: "Set SL for all positions",
      body: <p>BUY and SELL use separate prices. Leave one empty to skip that side.</p>,
      fields: [
        { key: "buy_sl", label: "BUY stop loss", optional: true },
        { key: "sell_sl", label: "SELL stop loss", optional: true },
      ],
      atLeastOne: ["buy_sl", "sell_sl"],
      confirmLabel: "Set SL",
      runningLabel: "Updating…",
      unavailable: posUnavailable,
      kind: "tpsl",
      run: (request_id, v) => gm.setSlAll({ request_id, buy_sl: v.buy_sl, sell_sl: v.sell_sl }),
    },
    "cancel-buy": {
      title: "Cancel BUY pending orders?",
      body: <p>Cancels {ordersBy("buy") ?? "all"} BUY pending order(s). Open positions are NOT closed.</p>,
      confirmLabel: "Cancel BUY orders",
      runningLabel: "Cancelling…",
      danger: true,
      kind: "cancelOrders",
      run: (request_id) => gm.cancelBuyOrders({ request_id }),
    },
    "cancel-sell": {
      title: "Cancel SELL pending orders?",
      body: <p>Cancels {ordersBy("sell") ?? "all"} SELL pending order(s). Open positions are NOT closed.</p>,
      confirmLabel: "Cancel SELL orders",
      runningLabel: "Cancelling…",
      danger: true,
      kind: "cancelOrders",
      run: (request_id) => gm.cancelSellOrders({ request_id }),
    },
    "cancel-all": {
      title: "Cancel ALL pending orders?",
      body: <p>Cancels {ordersBy(null) ?? "all"} pending order(s). This does NOT close open positions.</p>,
      confirmLabel: "Cancel all orders",
      runningLabel: "Cancelling…",
      danger: true,
      kind: "cancelOrders",
      run: (request_id) => gm.cancelAllOrders({ request_id }),
    },
    "prot-tp-set": {
      title: "Set account equity TP",
      body: <p>When account equity reaches the target, the server closes all positions.</p>,
      fields: [{ key: "target", label: "Equity target" }],
      confirmLabel: "Enable equity TP",
      runningLabel: "Saving…",
      kind: "protection",
      run: (_id, v) => gm.setEquityTp({ enabled: true, mode: "equity", target: v.target!, action: "close_all" }),
    },
    "prot-tp-remove": {
      title: "Remove account equity TP?",
      body: <p>The equity take-profit protection will be removed.</p>,
      confirmLabel: "Remove equity TP",
      runningLabel: "Removing…",
      danger: true,
      kind: "protection",
      run: () => gm.removeEquityTp(),
    },
    "prot-sl-set": {
      title: "Set account equity SL",
      body: <p>When account equity falls to the target, the server closes all positions.</p>,
      fields: [{ key: "target", label: "Equity target" }],
      confirmLabel: "Enable equity SL",
      runningLabel: "Saving…",
      kind: "protection",
      run: (_id, v) => gm.setEquitySl({ enabled: true, mode: "equity", target: v.target!, action: "close_all" }),
    },
    "prot-sl-remove": {
      title: "Remove account equity SL?",
      body: <p>The equity stop-loss protection will be removed.</p>,
      confirmLabel: "Remove equity SL",
      runningLabel: "Removing…",
      danger: true,
      kind: "protection",
      run: () => gm.removeEquitySl(),
    },
    emergency: {
      title: "Emergency: close everything",
      body: (
        <div className="space-y-2">
          <p>
            Closes <b>all open positions</b> (BUY {buy?.count ?? "—"}, SELL {sell?.count ?? "—"}) and cancels <b>all pending orders</b>.
          </p>
          <p className="font-semibold text-[#E5484D]">
            This does NOT stop the GoldMiner EA — it may open new positions afterwards.
          </p>
        </div>
      ),
      confirmLabel: "CLOSE EVERYTHING",
      runningLabel: "Closing everything…",
      danger: true,
      requireText: "CLOSE",
      kind: "close",
      run: (request_id) => gm.emergencyCloseEverything({ request_id }),
    },
  };

  const openAction = (k: ActionKey) => {
    // Re-read live state right before showing what will be affected.
    void refresh(["positions", "orders", "protection"]);
    setActive(k);
  };

  const spec = active ? specs[active] : null;

  return (
    <>
      <Sheet open={open} onClose={onClose} title="Controls">
        {!tradingEnabled && (
          <p className="mb-4 rounded-[14px] bg-[#F4F6FB] px-4 py-3 text-[14px] font-medium text-[#6B6B6B]">
            Trading actions are disabled on this server. You can review everything, but nothing can be sent.
          </p>
        )}

        <Group title="Positions">
          <Btn onClick={() => openAction("close-buy")}>Close BUY</Btn>
          <Btn onClick={() => openAction("close-sell")}>Close SELL</Btn>
          <Btn danger onClick={() => openAction("close-all")}>
            Close ALL
          </Btn>
        </Group>
        <Group title="Take profit">
          <Btn onClick={() => openAction("tp-buy")}>TP BUY</Btn>
          <Btn onClick={() => openAction("tp-sell")}>TP SELL</Btn>
          <Btn onClick={() => openAction("tp-all")}>TP ALL</Btn>
        </Group>
        <Group title="Stop loss">
          <Btn onClick={() => openAction("sl-buy")}>SL BUY</Btn>
          <Btn onClick={() => openAction("sl-sell")}>SL SELL</Btn>
          <Btn onClick={() => openAction("sl-all")}>SL ALL</Btn>
        </Group>
        <Group title="Pending orders" note="Cancelling orders does not close open positions.">
          <Btn onClick={() => openAction("cancel-buy")}>Cancel BUY</Btn>
          <Btn onClick={() => openAction("cancel-sell")}>Cancel SELL</Btn>
          <Btn onClick={() => openAction("cancel-all")}>Cancel ALL</Btn>
        </Group>

        <h3 className="mt-6 text-[15px] font-bold text-[#131313]">Account protection</h3>
        <DataNotice className="mt-2" resource={protection} />
        <div className="mt-2 grid grid-cols-2 gap-3">
          <ProtectionCard
            label="Equity TP"
            rule={protection.data?.tp}
            known={!!protection.data}
            onSet={() => openAction("prot-tp-set")}
            onRemove={() => openAction("prot-tp-remove")}
          />
          <ProtectionCard
            label="Equity SL"
            rule={protection.data?.sl}
            known={!!protection.data}
            onSet={() => openAction("prot-sl-set")}
            onRemove={() => openAction("prot-sl-remove")}
          />
        </div>

        <button
          onClick={() => openAction("emergency")}
          className="mt-6 h-[56px] w-full rounded-[16px] bg-[#E5484D] text-[16px] font-bold text-white active:scale-[0.98]"
        >
          Emergency close everything
        </button>
        <p className="mt-2 text-center text-[12px] text-[#8B8B8B]">Closes positions and cancels orders. Does not stop the EA.</p>
      </Sheet>

      <ActionConfirm
        open={!!spec}
        onClose={() => setActive(null)}
        title={spec?.title ?? ""}
        body={spec?.body}
        fields={spec?.fields}
        atLeastOne={spec?.atLeastOne}
        confirmLabel={spec?.confirmLabel ?? ""}
        runningLabel={spec?.runningLabel}
        danger={spec?.danger}
        requireText={spec?.requireText}
        unavailable={spec?.unavailable}
        kind={spec?.kind ?? "close"}
        run={spec?.run ?? (() => Promise.reject())}
      />
    </>
  );
}

function Group({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <div className="mt-5 first:mt-0">
      <h3 className="text-[15px] font-bold text-[#131313]">{title}</h3>
      {note && <p className="text-[12px] text-[#8B8B8B]">{note}</p>}
      <div className="mt-2 grid grid-cols-3 gap-2">{children}</div>
    </div>
  );
}

function Btn({ children, onClick, danger }: { children: ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`h-11 rounded-full border text-[13px] font-semibold whitespace-nowrap active:scale-95 ${
        danger ? "border-[#E5484D] text-[#E5484D]" : "border-[#D9D9D9] text-[#131313]"
      }`}
    >
      {children}
    </button>
  );
}

function ProtectionCard({
  label,
  rule,
  known,
  onSet,
  onRemove,
}: {
  label: string;
  rule: ProtectionRule | null | undefined;
  known: boolean;
  onSet: () => void;
  onRemove: () => void;
}) {
  const active = !!rule?.enabled;
  return (
    <div className="rounded-[16px] bg-[#F4F6FB] p-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[#8B8B8B]">{label}</p>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            !known ? "bg-white text-[#8B8B8B]" : rule?.triggered ? "bg-[#FDECEC] text-[#C8323A]" : active ? "bg-[#E9F8F1] text-[#138A5A]" : "bg-white text-[#8B8B8B]"
          }`}
        >
          {!known ? "Unknown" : rule?.triggered ? "Triggered" : active ? "On" : "Off"}
        </span>
      </div>
      <p className="mt-1 text-[17px] font-bold text-[#131313]">{money(rule?.target)}</p>
      {rule?.current != null && <p className="text-[12px] text-[#8B8B8B]">Now {money(rule.current)}</p>}
      {rule?.triggeredAt && <p className="text-[12px] text-[#8B8B8B]">At {time(rule.triggeredAt)}</p>}
      {rule?.executionStatus && <p className="text-[12px] text-[#8B8B8B]">{rule.executionStatus}</p>}
      {rule?.lastError && <p className="text-[12px] text-[#C8323A]">{rule.lastError}</p>}
      <div className="mt-2 flex gap-2">
        <button onClick={onSet} className="h-8 flex-1 rounded-full bg-white text-[12px] font-semibold text-[#131313] active:scale-95">
          {active ? "Change" : "Set"}
        </button>
        {active && (
          <button onClick={onRemove} className="h-8 flex-1 rounded-full bg-white text-[12px] font-semibold text-[#E5484D] active:scale-95">
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

