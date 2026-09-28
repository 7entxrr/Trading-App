"use client";

import { useState, type ReactNode } from "react";
import { ConfirmSheet } from "./ConfirmSheet";
import { useTradingEnabled } from "./AuthGate";
import { useAction } from "@/lib/api/useAction";
import type { REFRESH_AFTER } from "@/lib/api/live";

export type Field = { key: string; label: string; optional?: boolean; initial?: string; hint?: string };
export type Values = Record<string, number | undefined>;

/**
 * Confirmation + input step for one mutating action. Nothing is sent until the
 * user presses the confirm button; a new request_id is generated per press.
 */
export function ActionConfirm({
  open,
  onClose,
  title,
  body,
  fields = [],
  atLeastOne,
  confirmLabel,
  runningLabel,
  danger,
  requireText,
  unavailable,
  kind,
  run,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body?: ReactNode;
  fields?: Field[];
  /** At least one of these field keys must be filled. */
  atLeastOne?: string[];
  confirmLabel: string;
  runningLabel?: string;
  danger?: boolean;
  /** User must type this exact text to enable the confirm button. */
  requireText?: string;
  /** If set, the action cannot be confirmed and this reason is shown. */
  unavailable?: string | null;
  kind: keyof typeof REFRESH_AFTER;
  run: (requestId: string, values: Values) => Promise<unknown>;
}) {
  const tradingEnabled = useTradingEnabled();
  const [raw, setRaw] = useState<Record<string, string>>({});
  const [typed, setTyped] = useState("");
  const { state, execute, reset } = useAction(run, kind);

  // Fresh form each time the sheet opens.
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setRaw(Object.fromEntries(fields.map((f) => [f.key, f.initial ?? ""])));
      setTyped("");
      reset();
    }
  }

  const values: Values = {};
  let invalid = false;
  for (const f of fields) {
    const s = (raw[f.key] ?? "").trim();
    if (!s) {
      if (!f.optional) invalid = true;
      continue;
    }
    const n = Number(s);
    if (!Number.isFinite(n) || n <= 0) invalid = true;
    else values[f.key] = n;
  }
  if (atLeastOne && !atLeastOne.some((k) => values[k] !== undefined)) invalid = true;
  if (requireText && typed !== requireText) invalid = true;

  const blocked = !tradingEnabled ? "Trading actions are disabled on this server." : unavailable;

  return (
    <ConfirmSheet
      open={open}
      onClose={onClose}
      title={title}
      confirmLabel={confirmLabel}
      runningLabel={runningLabel}
      danger={danger}
      state={state}
      confirmDisabled={invalid || !!blocked}
      onConfirm={() => execute(values)}
    >
      {body}
      {fields.length > 0 && (
        <div className="mt-4 space-y-3">
          {fields.map((f) => (
            <label key={f.key} className="block rounded-[16px] bg-[#F4F6FB] px-4 py-2.5">
              <span className="text-[13px] text-[#8B8B8B]">
                {f.label}
                {f.optional ? " (optional)" : ""}
              </span>
              <input
                inputMode="decimal"
                value={raw[f.key] ?? ""}
                disabled={state.phase === "running"}
                onChange={(e) => setRaw((r) => ({ ...r, [f.key]: e.target.value.replace(/[^0-9.]/g, "") }))}
                placeholder={f.hint ?? "0.00"}
                className="block w-full bg-transparent text-[20px] font-bold text-[#131313] outline-none placeholder:text-[#C4C4C4]"
              />
            </label>
          ))}
        </div>
      )}
      {requireText && (
        <label className="mt-4 block">
          <span className="text-[13px] text-[#8B8B8B]">
            Type <b className="text-[#131313]">{requireText}</b> to confirm
          </span>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoCapitalize="characters"
            className="mt-1 h-12 w-full rounded-[14px] border border-[#E3E3E3] px-4 text-[16px] font-semibold text-[#131313] outline-none focus:border-[#E5484D]"
          />
        </label>
      )}
      {blocked && (
        <p className="mt-4 rounded-[14px] bg-[#F4F6FB] px-4 py-3 text-[14px] font-medium text-[#6B6B6B]">{blocked}</p>
      )}
    </ConfirmSheet>
  );
}
