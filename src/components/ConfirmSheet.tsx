"use client";

import type { ReactNode } from "react";
import { Sheet } from "./Sheet";
import type { ActionState } from "@/lib/api/useAction";

/**
 * Explicit confirmation for every mutating action, in the app's sheet style.
 * Shows loading / success / error / uncertain results from the server.
 * Nothing is sent until the user presses the confirm button.
 */
export function ConfirmSheet({
  open,
  onClose,
  title,
  children,
  confirmLabel,
  runningLabel = "Sending…",
  danger = false,
  state,
  onConfirm,
  confirmDisabled = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  runningLabel?: string;
  danger?: boolean;
  state: ActionState;
  onConfirm: () => void;
  confirmDisabled?: boolean;
}) {
  const running = state.phase === "running";
  const done = state.phase === "success";

  return (
    <Sheet open={open} onClose={running ? () => {} : onClose} title={title}>
      <div className="text-[15px] text-[#131313]">{children}</div>

      {state.phase === "success" && (
        <p className="mt-4 rounded-[14px] bg-[#E9F8F1] px-4 py-3 text-[14px] font-medium text-[#138A5A]">
          Server confirmed the request.
        </p>
      )}
      {state.phase === "error" && (
        <p className="mt-4 rounded-[14px] bg-[#FDECEC] px-4 py-3 text-[14px] font-medium text-[#C8323A]">{state.error.message}</p>
      )}
      {state.phase === "uncertain" && (
        <p className="mt-4 rounded-[14px] bg-[#FFF5E0] px-4 py-3 text-[14px] font-medium text-[#9A6400]">
          The connection dropped before the server confirmed. It has NOT been re-sent. Check History → Commands and your
          positions before trying again.
        </p>
      )}

      <div className="mt-5 flex gap-3">
        <button
          onClick={onClose}
          disabled={running}
          className="h-[54px] flex-1 rounded-[16px] bg-[#F1F3F8] text-[16px] font-semibold text-[#131313] active:scale-[0.98] disabled:opacity-40"
        >
          {done || state.phase === "uncertain" ? "Close" : "Cancel"}
        </button>
        {!done && state.phase !== "uncertain" && (
          <button
            onClick={onConfirm}
            disabled={running || confirmDisabled}
            className={`h-[54px] flex-[1.4] rounded-[16px] text-[16px] font-semibold text-white active:scale-[0.98] disabled:opacity-50 ${
              danger ? "bg-[#E5484D]" : "bg-[#2966FF]"
            }`}
          >
            {running ? runningLabel : confirmLabel}
          </button>
        )}
      </div>
    </Sheet>
  );
}
