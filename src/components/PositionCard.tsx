import { GoldLogo } from "./GoldLogo";
import { Change } from "./Change";
import { Sparkline } from "./Sparkline";
import { lots, money, price } from "@/lib/format";
import type { Position } from "@/lib/models";

/** Card backgrounds from the design, cycled across positions. */
const GRADIENTS = [
  "linear-gradient(135deg, #e3efcf 0%, #edf4e2 55%, #e9f1dc 100%)",
  "linear-gradient(135deg, #e8f1f9 0%, #dde9f7 55%, #d2e2f6 100%)",
  "linear-gradient(135deg, #d4d4d4 0%, #e0e0e0 50%, #ececec 100%)",
  "linear-gradient(135deg, #f6eeea 0%, #f7e6dc 55%, #f9dccb 100%)",
];

export function cardGradient(index: number) {
  return GRADIENTS[index % GRADIENTS.length];
}

/** Price move in the position's favour, only when the backend gives both prices. */
export function favourableMove(p: Position) {
  if (p.openPrice === null || p.currentPrice === null) return null;
  return (p.currentPrice - p.openPrice) * (p.side === "buy" ? 1 : -1);
}

/** An open position from GET /api/positions, styled like the design's portfolio cards. */
export function PositionCard({
  position,
  index,
  currency,
  onOpen,
}: {
  position: Position;
  index: number;
  currency?: string | null;
  onOpen: () => void;
}) {
  const up = (position.profit ?? 0) >= 0;
  const move = favourableMove(position);
  return (
    <button
      onClick={onOpen}
      className="block w-full rounded-[18px] p-4 text-left transition-transform duration-150 active:scale-[0.97]"
      style={{ background: cardGradient(index) }}
    >
      <div className="flex items-center gap-2.5">
        <GoldLogo size={34} />
        <div className="min-w-0">
          <p className="truncate text-[15px] leading-tight font-semibold text-[#131313]">
            {position.side === "buy" ? "Buy" : "Sell"} {lots(position.volume)}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-[#A3A3A3]">#{position.ticket}</p>
        </div>
      </div>
      <p className="mt-6 text-[21px] font-bold tracking-[-0.01em] text-[#131313]">
        {position.profit !== null && position.profit < 0 ? "−" : ""}
        {money(position.profit === null ? null : Math.abs(position.profit), currency)}
      </p>
      <div className="mt-1 flex min-h-[20px] items-center justify-between text-[#131313]">
        {move !== null ? (
          <Change value={move} className="text-[13px]" format={(v) => price(v)} />
        ) : (
          <span className="text-[13px] text-[#8B8B8B]">@ {price(position.openPrice)}</span>
        )}
        {position.profit !== null && <Sparkline up={up} variant={index} />}
      </div>
    </button>
  );
}
