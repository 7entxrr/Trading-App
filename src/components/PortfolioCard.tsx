import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { Change } from "./Change";
import { Sparkline } from "./Sparkline";
import { money } from "@/lib/format";
import type { Stock } from "@/lib/data";

export function PortfolioCard({ stock, index }: { stock: Stock; index: number }) {
  const up = stock.holdingChange >= 0;
  return (
    <Link
      href={`/stock/${stock.symbol}`}
      className="block rounded-[18px] p-4 transition-transform duration-150 active:scale-[0.97]"
      style={{ background: stock.gradient }}
    >
      <div className="flex items-center gap-2.5">
        <BrandLogo brand={stock.brand} size={34} />
        <div className="min-w-0">
          <p className="truncate text-[15px] leading-tight font-semibold text-[#131313]">{stock.name}</p>
          <p className="mt-0.5 truncate text-[13px] text-[#A3A3A3]">{stock.ticker}</p>
        </div>
      </div>
      <p className="mt-6 text-[21px] font-bold tracking-[-0.01em] text-[#131313]">{money(stock.holding)}</p>
      <div className="mt-1 flex items-center justify-between text-[#131313]">
        <Change value={stock.holdingChange} className="text-[13px]" />
        <Sparkline up={up} variant={index} />
      </div>
    </Link>
  );
}
