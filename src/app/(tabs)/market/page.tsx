import type { Metadata } from "next";
import { GoldDetail } from "@/components/GoldDetail";

export const metadata: Metadata = { title: "Gold · XAU/USD" };

export default function MarketPage() {
  return <GoldDetail />;
}
