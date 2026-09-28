import Link from "next/link";
import { GoldLogo } from "./GoldLogo";
import { Change } from "./Change";
import { Sparkline } from "./Sparkline";
import { money } from "@/lib/format";
import { positionMove, positionPnl, type Position } from "@/lib/data";

/** An open gold position, styled like the design's portfolio cards. */
export function PositionCard({ position, index }: { position: Position; index: number }) {
  const pnl = positionPnl(position);
  const up = pnl >= 0;
  return (
    <Link
      href="/market"
      className="block rounded-[18px] p-4 transition-transform duration-150 active:scale-[0.97]"
      style={{ background: position.gradient }}
    >
      <div className="flex items-center gap-2.5">
        <GoldLogo size={34} />
        <div className="min-w-0">
          <p className="truncate text-[15px] leading-tight font-semibold text-[#131313]">
            {position.side === "buy" ? "Buy" : "Sell"} {position.lots.toFixed(2)}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-[#A3A3A3]">
            Lots · #{position.id}
          </p>
        </div>
      </div>
      <p className="mt-6 text-[21px] font-bold tracking-[-0.01em] text-[#131313]">
        {up ? "" : "−"}
        {money(Math.abs(pnl))}
      </p>
      <div className="mt-1 flex items-center justify-between text-[#131313]">
        <Change value={positionMove(position)} className="text-[13px]" />
        <Sparkline up={up} variant={index} />
      </div>
    </Link>
  );
}
