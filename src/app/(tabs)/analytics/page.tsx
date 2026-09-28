import type { Metadata } from "next";
import { AnalyticsView } from "@/components/AnalyticsView";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <div className="screen-in px-5 pt-[max(24px,env(safe-area-inset-top))] pb-6">
      <h1 className="text-[28px] font-bold text-[#131313]">Analytics</h1>
      <AnalyticsView />
    </div>
  );
}
