"use client";

import { useState } from "react";
import Link from "next/link";
import { DataNotice } from "./DataNotice";
import { PositionCard } from "./PositionCard";
import { PositionSheet } from "./PositionSheet";
import { useAccount, usePositions } from "@/lib/api/hooks";

/** Live open positions (GET /api/positions) in the design's card grid. */
export function HomePositions() {
  const positions = usePositions();
  const currency = useAccount().data?.currency;
  const [open, setOpen] = useState<string | null>(null);
  const list = positions.data ?? [];

  return (
    <>
      <div className="mt-5 flex items-center justify-between px-1">
        <h2 className="text-[24px] font-bold text-[#131313]">Positions</h2>
        <Link href="/analytics" className="text-[15px] font-medium text-[#2966FF] active:opacity-60">
          View all
        </Link>
      </div>
      <DataNotice className="mt-4" resource={positions} isEmpty={list.length === 0} empty="No open positions" />
      {list.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {list.map((p, i) => (
            <PositionCard key={p.ticket} position={p} index={i} currency={currency} onOpen={() => setOpen(p.ticket)} />
          ))}
        </div>
      )}
      <PositionSheet ticket={open} onClose={() => setOpen(null)} currency={currency} />
    </>
  );
}
