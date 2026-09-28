import Link from "next/link";
import { HomeTop } from "@/components/HomeTop";
import { PortfolioCard } from "@/components/PortfolioCard";
import { portfolio } from "@/lib/data";

export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100dvh-76px)] flex-col bg-[#131313]">
      <HomeTop />
      <section className="screen-in flex-1 rounded-t-[28px] bg-white px-5 pt-3 pb-6">
        <div className="mx-auto h-1 w-10 rounded-full bg-[#E7E7E7]" />
        <div className="mt-5 flex items-center justify-between px-1">
          <h2 className="text-[24px] font-bold text-[#131313]">Portfolio</h2>
          <Link href="/market" className="text-[15px] font-medium text-[#2966FF] active:opacity-60">
            View all
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {portfolio.map((s, i) => (
            <PortfolioCard key={s.symbol} stock={s} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
