import { notFound } from "next/navigation";
import { StockDetail } from "@/components/StockDetail";
import { getStock, stocks } from "@/lib/data";

export function generateStaticParams() {
  return stocks.map((s) => ({ symbol: s.symbol }));
}

export async function generateMetadata({ params }: PageProps<"/stock/[symbol]">) {
  const { symbol } = await params;
  return { title: getStock(symbol)?.name ?? "Stock" };
}

export default async function StockPage({ params }: PageProps<"/stock/[symbol]">) {
  const { symbol } = await params;
  const stock = getStock(symbol);
  if (!stock) notFound();
  return <StockDetail stock={stock} />;
}
