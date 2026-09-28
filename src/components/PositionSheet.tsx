"use client";

import { useEffect, useRef, useState } from "react";
import { ActionConfirm } from "./ActionConfirm";
import { Sheet } from "./Sheet";
import { closePosition, modifyPosition } from "@/lib/api/goldminer";
import { ApiError } from "@/lib/api/errors";
import { usePositions } from "@/lib/api/hooks";
import { lots, money, num, price, time } from "@/lib/format";
import type { Position } from "@/lib/models";

/**
 * Details for one open position, with Edit TP/SL and Close.
 * The ticket always comes from the live positions list; if the position has
 * disappeared since the sheet opened, the action is refused.
 */
export function PositionSheet({
  ticket,
  onClose,
  currency,
}: {
  ticket: string | null;
  onClose: () => void;
  currency?: string | null;
}) {
  const positions = usePositions();
  const latest = useRef(positions.data);
  useEffect(() => {
    latest.current = positions.data;
  }, [positions.data]);
  const [confirm, setConfirm] = useState<"modify" | "close" | null>(null);
  const [lastPosition, setLastPosition] = useState<Position | null>(null);

  const live = ticket ? positions.data?.find((p) => p.ticket === ticket) : undefined;
  if (live && live !== lastPosition) setLastPosition(live);
  const p = live ?? lastPosition;
  const gone = !!ticket && !!positions.data && !live;

  const assertStillOpen = () => {
    if (!ticket || !latest.current?.some((x) => x.ticket === ticket)) {
      throw new ApiError(404, "STALE_TICKET", "This position is no longer open. Nothing was sent.");
    }
    return ticket;
  };

  const rows: [string, string][] = p
    ? [
        ["Direction", p.side === "buy" ? "BUY" : "SELL"],
        ["Volume", `${lots(p.volume)} lot`],
        ["Open price", price(p.openPrice)],
        ["Current price", price(p.currentPrice)],
        ["Stop loss", price(p.sl)],
        ["Take profit", price(p.tp)],
        ["Profit", money(p.profit, currency)],
        ["Swap", money(p.swap, currency)],
        ["Magic", num(p.magic, 0)],
        ["Opened", time(p.openTime)],
        ["Comment", p.comment || "—"],
      ]
    : [];

  return (
    <>
      <Sheet open={!!ticket} onClose={onClose} title={p ? `${p.symbol ?? "Position"} · #${p.ticket}` : "Position"}>
        {gone && (
          <p className="mb-3 rounded-[14px] bg-[#FFF5E0] px-4 py-3 text-[14px] font-medium text-[#9A6400]">
            This position is no longer open.
          </p>
        )}
        <ul className="divide-y divide-[#F0F0F0]">
          {rows.map(([k, v]) => (
            <li key={k} className="flex justify-between gap-4 py-2.5 text-[15px]">
              <span className="text-[#8B8B8B]">{k}</span>
              <span className="truncate font-semibold text-[#131313]">{v}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex gap-3">
          <button
            disabled={gone || !p}
            onClick={() => setConfirm("modify")}
            className="h-[54px] flex-1 rounded-[16px] bg-[#2966FF] text-[16px] font-semibold text-white active:scale-[0.98] disabled:opacity-40"
          >
            Edit TP/SL
          </button>
          <button
            disabled={gone || !p}
            onClick={() => setConfirm("close")}
            className="h-[54px] flex-1 rounded-[16px] bg-[#131313] text-[16px] font-semibold text-white active:scale-[0.98] disabled:opacity-40"
          >
            Close position
          </button>
        </div>
      </Sheet>

      <ActionConfirm
        open={confirm === "modify"}
        onClose={() => setConfirm(null)}
        title={`Edit TP/SL · #${ticket ?? ""}`}
        body={<p>Set a new stop loss and/or take profit for this position only.</p>}
        fields={[
          { key: "sl", label: "Stop loss", optional: true, initial: p?.sl != null ? String(p.sl) : "" },
          { key: "tp", label: "Take profit", optional: true, initial: p?.tp != null ? String(p.tp) : "" },
        ]}
        atLeastOne={["sl", "tp"]}
        confirmLabel="Update TP/SL"
        runningLabel="Updating…"
        kind="tpsl"
        run={(request_id, v) => modifyPosition(assertStillOpen(), { request_id, sl: v.sl, tp: v.tp })}
      />
      <ActionConfirm
        open={confirm === "close"}
        onClose={() => setConfirm(null)}
        title="Close position?"
        body={
          p && (
            <p>
              Close <b>#{p.ticket}</b>: {p.side === "buy" ? "BUY" : "SELL"} {lots(p.volume)} lot, current P/L{" "}
              <b>{money(p.profit, currency)}</b>. Only this position is closed. This cannot be undone.
            </p>
          )
        }
        confirmLabel="Close position"
        runningLabel="Closing…"
        danger
        kind="close"
        run={(request_id) => closePosition(assertStillOpen(), { request_id })}
      />
    </>
  );
}
