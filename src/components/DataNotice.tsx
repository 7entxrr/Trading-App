import type { Resource } from "@/lib/api/hooks";

/**
 * Standard loading / error / awaiting-mapping / empty message for a live resource.
 * Renders nothing when there is data to show.
 */
export function DataNotice({
  resource,
  empty,
  isEmpty,
  dark = false,
  className = "",
}: {
  resource: Resource<unknown>;
  /** Message when data loaded but there is nothing to show */
  empty?: string;
  isEmpty?: boolean;
  dark?: boolean;
  className?: string;
}) {
  let text: string | null = null;
  if (resource.unmapped) text = "Live data connected — awaiting response mapping";
  else if (resource.error && resource.data === undefined) text = resource.error.message;
  else if (resource.loading) text = "Loading…";
  else if (isEmpty && empty) text = empty;
  if (!text) return null;

  return (
    <p
      className={`rounded-[16px] px-4 py-3 text-center text-[14px] font-medium ${
        dark ? "bg-[#232323] text-[#9A9A9A]" : "bg-[#F4F6FB] text-[#8B8B8B]"
      } ${className}`}
      role="status"
    >
      {text}
    </p>
  );
}
