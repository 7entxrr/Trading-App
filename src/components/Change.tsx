import { TrendDot } from "./icons";
import { money } from "@/lib/format";

/** Green/red dot plus absolute change, e.g. (^) $12.98 */
export function Change({
  value,
  className = "text-[13px]",
  colored = false,
  currency,
  format = (v) => money(v, currency),
}: {
  value: number;
  className?: string;
  /** Colour the figure itself (header style) instead of keeping it dark. */
  colored?: boolean;
  currency?: string | null;
  format?: (abs: number) => string;
}) {
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium ${className}`}>
      <TrendDot up={up} className="h-4 w-4" />
      <span className={colored ? (up ? "text-[#22B573]" : "text-[#E5484D]") : undefined}>{format(Math.abs(value))}</span>
    </span>
  );
}
