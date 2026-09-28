"use client";

import { DataNotice } from "./DataNotice";
import { Sheet } from "./Sheet";
import { useAlerts } from "@/lib/api/hooks";
import { time } from "@/lib/format";

/** GET /api/alerts — system and trading events from the backend. */
export function AlertsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const alerts = useAlerts();
  const list = alerts.data ?? [];
  return (
    <Sheet open={open} onClose={onClose} title="Alerts">
      <DataNotice resource={alerts} isEmpty={list.length === 0} empty="No alerts" />
      <ul className="divide-y divide-[#F0F0F0] text-[#131313]">
        {list.map((a) => (
          <li key={a.id} className="flex items-start gap-3 py-3">
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                a.severity === "critical" ? "bg-[#E5484D]" : a.severity === "warning" ? "bg-[#F5A524]" : "bg-[#2966FF]"
              }`}
            />
            <div className="flex-1">
              <p className="text-[15px] font-medium">{a.message}</p>
              <p className="mt-0.5 text-[13px] text-[#9A9A9A]">
                {a.kind ? `${a.kind} · ` : ""}
                {time(a.time)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
