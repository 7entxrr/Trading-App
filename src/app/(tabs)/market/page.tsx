import type { Metadata } from "next";
import { MarketList } from "@/components/MarketList";

export const metadata: Metadata = { title: "Market" };

export default function MarketPage() {
  return (
    <div className="screen-in px-5 pt-[max(24px,env(safe-area-inset-top))] pb-6">
      <h1 className="text-[28px] font-bold text-[#131313]">Market</h1>
      <MarketList />
    </div>
  );
}
