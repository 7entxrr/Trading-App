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

type CommandResult = {
  status?: unknown;
  error?: { code?: unknown; message?: unknown } | null;
  data?: { retcode_description?: unknown; requested?: unknown; succeeded?: unknown; failed?: unknown } | null;
};

/**
 * Backend contract (main.py `_result_response`, trading.py `execute_command`):
 *   { success, data: { success, status, error: {code, message}, data: {...} } }
 * HTTP 200 is used for every well-formed outcome INCLUDING rejected / failed /
 * partial / uncertain, so the inner `status` decides — never the HTTP code.
 * Protection endpoints return the plain envelope { success, data: <row> }.
 */
type Verdict =
  | { kind: "ok"; note: string | null }
  | { kind: "error"; message: string }
  | { kind: "uncertain"; message: string };

export function interpret(response: unknown): Verdict {
  if (!response || typeof response !== "object") return { kind: "ok", note: null };
  const env = response as { success?: unknown; data?: unknown };
  const r = (env.data && typeof env.data === "object" ? env.data : {}) as CommandResult;
  const status = typeof r.status === "string" ? r.status : null;
  if (!status) {
    // Not a trading command (e.g. protection): trust the envelope's success flag.
    return env.success === false ? { kind: "error", message: "The server reported a failure." } : { kind: "ok", note: null };
  }
  const reason =
    (typeof r.error?.message === "string" && r.error.message) ||
    (typeof r.data?.retcode_description === "string" && r.data.retcode_description) ||
    null;
  const bulk =
    typeof r.data?.requested === "number" && typeof r.data?.succeeded === "number"
      ? `${r.data.succeeded} of ${r.data.requested} succeeded`
      : null;
  switch (status) {
    case "completed":
      return { kind: "ok", note: bulk };
    case "uncertain":
      return { kind: "uncertain", message: reason ?? "Execution status unknown." };
    case "partial":
      return { kind: "error", message: `Partly completed — ${bulk ?? "some operations failed"}. Check positions.` };
    case "rejected":
    case "failed":
    case "error":
      return { kind: "error", message: `${status === "rejected" ? "Rejected" : "Failed"}${reason ? `: ${reason}` : ""}${bulk ? ` (${bulk})` : ""}` };
    default:
      return { kind: "error", message: `Unexpected server status "${status}". Check positions and commands.` };
  }
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
        if (verdict.kind === "ok") {
          setState({ phase: "success", result, note: verdict.note });
          await refresh(REFRESH_AFTER[kind]);
        } else if (verdict.kind === "uncertain") {
          setState({ phase: "uncertain", error: new ApiError(200, "OUTCOME_UNKNOWN", verdict.message, true) });
          await refresh(["commands", "positions", "orders", "account"]);
        } else {
          setState({ phase: "error", error: new ApiError(200, "COMMAND_REJECTED", verdict.message) });
          await refresh(REFRESH_AFTER[kind]);
        }
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
