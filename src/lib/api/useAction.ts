"use client";

import { useCallback, useRef, useState } from "react";
import { ApiError } from "./errors";
import { REFRESH_AFTER, useLiveRefresh } from "./live";
import { newRequestId } from "./requestId";

export type ActionState =
  | { phase: "idle" }
  | { phase: "running" }
  | { phase: "success"; result: unknown; note: string | null }
  | { phase: "error"; error: ApiError }
  /** Sent, but we could not confirm whether it executed. Never auto-retried. */
  | { phase: "uncertain"; error: ApiError };

/**
 * The backend can answer HTTP 2xx while reporting that the command itself was
 * rejected (deployment report: `status: "rejected"`, reason in
 * `data.retcode_description`). Only `status: "completed"` — or a response
 * without a status field — counts as success.
 */
function interpret(result: unknown): { ok: true; note: string | null } | { ok: false; message: string } {
  if (!result || typeof result !== "object") return { ok: true, note: null };
  const r = result as { status?: unknown; data?: { retcode_description?: unknown }; requested?: unknown; succeeded?: unknown; error?: unknown };
  const reason = typeof r.data?.retcode_description === "string" ? r.data.retcode_description : null;
  const bulk =
    typeof r.requested === "number" && typeof r.succeeded === "number" ? `${r.succeeded} of ${r.requested} succeeded` : null;
  if (typeof r.status === "string") {
    const status = r.status.toLowerCase();
    if (status === "rejected" || status === "failed" || status === "error") {
      return { ok: false, message: `Rejected by the server${reason ? `: ${reason}` : ""}${bulk ? ` (${bulk})` : ""}` };
    }
    if (status !== "completed") return { ok: true, note: `Server status: ${r.status}${bulk ? ` · ${bulk}` : ""}` };
  }
  return { ok: true, note: bulk };
}

/**
 * Runs ONE user-initiated mutation.
 *
 * - A fresh request_id is minted per user action (not per render, not per retry).
 * - While running, further calls are ignored (no double-tap).
 * - No automatic retry. If the outcome is uncertain, it re-reads commands and
 *   positions so the user can see what actually happened before doing anything else.
 * - After success it refreshes the resources listed for that action kind.
 */
export function useAction<Args extends unknown[]>(
  run: (requestId: string, ...args: Args) => Promise<unknown>,
  kind: keyof typeof REFRESH_AFTER,
) {
  const [state, setState] = useState<ActionState>({ phase: "idle" });
  const busy = useRef(false);
  const refresh = useLiveRefresh();

  const execute = useCallback(
    async (...args: Args) => {
      if (busy.current) return;
      busy.current = true;
      setState({ phase: "running" });
      const requestId = newRequestId();
      try {
        const result = await run(requestId, ...args);
        const verdict = interpret(result);
        if (verdict.ok) setState({ phase: "success", result, note: verdict.note });
        else setState({ phase: "error", error: new ApiError(200, "COMMAND_REJECTED", verdict.message) });
        await refresh(REFRESH_AFTER[kind]);
      } catch (e) {
        const error = e instanceof ApiError ? e : new ApiError(0, "UNKNOWN", "Unexpected error");
        if (error.uncertain) {
          setState({ phase: "uncertain", error });
          await refresh(["commands", "positions", "orders", "account"]);
        } else {
          setState({ phase: "error", error });
        }
      } finally {
        busy.current = false;
      }
    },
    [run, kind, refresh],
  );

  const reset = useCallback(() => setState({ phase: "idle" }), []);
  return { state, execute, reset, running: state.phase === "running" };
}
