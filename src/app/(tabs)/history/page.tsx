import type { Metadata } from "next";
import { HistoryView } from "@/components/HistoryView";

export const metadata: Metadata = { title: "History" };

export default function HistoryPage() {
  return (
    <div className="screen-in px-5 pt-[max(24px,env(safe-area-inset-top))] pb-6">
      <h1 className="text-[28px] font-bold text-[#131313]">History</h1>
      <HistoryView />
    </div>
  );
}
