"use client";

import { useState } from "react";
import { Avatar } from "./Avatar";
import { AlertsSheet } from "./AlertsSheet";
import { Change } from "./Change";
import { BellIcon, ChevronRight, PlusSquare, UploadSquare } from "./icons";
import { useToast } from "./Sheet";
import { useAccount, useAlerts, useStatus } from "@/lib/api/hooks";
import { splitMoney } from "@/lib/format";
import type { ConnectionState } from "@/lib/models";

const STATUS_STYLE: Record<ConnectionState, { dot: string; label: string }> = {
  connected: { dot: "bg-[#22B573]", label: "Connected" },
  stale: { dot: "bg-[#F5A524]", label: "Stale" },
  disconnected: { dot: "bg-[#E5484D]", label: "Disconnected" },
  unknown: { dot: "bg-[#6B6B6B]", label: "Status unknown" },
};

/** Dark header: account, live balance, floating P/L and the two action buttons. */
export function HomeTop() {
  const account = useAccount();
  const status = useStatus();
  const alerts = useAlerts();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [seenAlerts, setSeenAlerts] = useState(0);
  const [toast, showToast] = useToast();

  const a = account.data;
  const [whole, cents] = splitMoney(a?.balance, a?.currency);
  const conn: ConnectionState = status.data?.mt5 ?? "unknown";
  const alertCount = alerts.data?.length ?? 0;

  const notAvailable = () => showToast("Not available — the trading API has no deposit/withdraw endpoint");

  return (
    <header className="px-6 pt-[max(20px,env(safe-area-inset-top))] pb-9 text-white">
      <div className="flex h-12 items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar size={40} />
          <div>
            <p className="flex items-center gap-1 text-[15px] font-medium">
              {a?.login ? `#${a.login}` : "GoldMiner"}
              <ChevronRight className="h-4 w-4 text-[#7A7A7A]" />
            </p>
            <p className="flex items-center gap-1.5 text-[12px] text-[#9A9A9A]">
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLE[conn].dot}`} />
              {status.unmapped || status.error
                ? "Status unavailable"
                : status.data?.eaRunning === false
                  ? `${STATUS_STYLE[conn].label} · Algo Trading off`
                  : STATUS_STYLE[conn].label}
            </p>
          </div>
        </div>
        <button
          aria-label="Alerts"
          className="relative grid h-10 w-10 place-items-center rounded-full active:bg-white/10"
          onClick={() => {
            setAlertsOpen(true);
            setSeenAlerts(alertCount);
          }}
        >
          <BellIcon className="h-6 w-6" />
          {alertCount > seenAlerts && <span className="absolute top-[6px] right-[6px] h-[10px] w-[10px] rounded-full bg-[#F04438]" />}
        </button>
      </div>

      <div className="mt-9 text-center">
        <p className="text-[42px] leading-none font-bold tracking-[-0.01em]">
          {whole}
          <span className="text-[#4A4A4A]">{cents}</span>
        </p>
        <div className="mt-4 flex min-h-[26px] items-center justify-center gap-3">
          {a?.profit !== null && a?.profit !== undefined ? (
            <>
              <Change value={a.profit} colored className="text-[15px]" currency={a.currency} />
              <span className="rounded-full bg-[#232323] px-3 py-1 text-[13px] font-medium text-[#D6D6D6]">Open P/L</span>
            </>
          ) : (
            <span className="text-[13px] text-[#9A9A9A]">
              {account.unmapped
                ? "Awaiting response mapping"
                : account.error
                  ? account.error.message
                  : account.loading
                    ? "Loading…"
                    : "P/L unavailable"}
            </span>
          )}
        </div>
      </div>

      {/* Deposit/Withdraw kept for the design; the API has no endpoint for them. */}
      <div className="mt-9 grid grid-cols-2 gap-3">
        <button
          onClick={notAvailable}
          aria-disabled="true"
          className="flex h-[54px] items-center justify-center gap-3 rounded-[16px] bg-[#2966FF] text-[16px] font-semibold opacity-50"
        >
          <PlusSquare className="h-6 w-6" />
          <span className="flex flex-col items-start leading-tight">
            Deposit
            <span className="text-[11px] font-medium opacity-80">Not available</span>
          </span>
        </button>
        <button
          onClick={notAvailable}
          aria-disabled="true"
          className="flex h-[54px] items-center justify-center gap-3 rounded-[16px] bg-[#232323] text-[16px] font-semibold opacity-50"
        >
          <UploadSquare className="h-6 w-6" />
          <span className="flex flex-col items-start leading-tight">
            Withdraw
            <span className="text-[11px] font-medium opacity-80">Not available</span>
          </span>
        </button>
      </div>

      <AlertsSheet open={alertsOpen} onClose={() => setAlertsOpen(false)} />
      {toast}
    </header>
  );
}
