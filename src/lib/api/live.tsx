"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ApiError } from "./errors";
import * as gm from "./goldminer";

/**
 * One centralised polling loop for live data.
 *
 * Screens declare which resources they need with `useLive([...])`; the provider
 * polls only the union of what's mounted, every POLL_MS, and pauses while the
 * tab/app is in the background. There is exactly one timer.
 */

export type LiveKey =
  | "status"
  | "account"
  | "positions"
  | "orders"
  | "trades"
  | "baskets"
  | "performance"
  | "alerts"
  | "protection"
  | "commands";

const FETCHERS: Record<LiveKey, () => Promise<unknown>> = {
  status: gm.getStatus,
  account: gm.getAccount,
  positions: gm.getPositions,
  orders: gm.getOrders,
  trades: gm.getTrades,
  baskets: gm.getBaskets,
  performance: gm.getPerformance,
  alerts: gm.getAlerts,
  protection: gm.getProtection,
  commands: gm.getCommands,
};

/** Fast-moving data polls every cycle; slower data less often. */
const EVERY_N_CYCLES: Record<LiveKey, number> = {
  status: 1,
  account: 1,
  positions: 1,
  orders: 1,
  baskets: 1,
  protection: 2,
  commands: 2,
  alerts: 4,
  trades: 10,
  performance: 10,
};

const POLL_MS = 3000;

type Entry = { data?: unknown; error?: ApiError; updatedAt?: number; loading: boolean };
type State = Partial<Record<LiveKey, Entry>>;

type Ctx = {
  state: State;
  subscribe: (keys: LiveKey[]) => () => void;
  refresh: (keys: LiveKey[]) => Promise<void>;
};

const LiveContext = createContext<Ctx | null>(null);

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({});
  const subs = useRef(new Map<LiveKey, number>());
  const inFlight = useRef(new Set<LiveKey>());
  const cycle = useRef(0);

  const fetchKeys = useCallback(async (keys: LiveKey[]) => {
    const todo = keys.filter((k) => !inFlight.current.has(k));
    if (!todo.length) return;
    todo.forEach((k) => inFlight.current.add(k));
    setState((s) => {
      const n = { ...s };
      todo.forEach((k) => (n[k] = { ...n[k], loading: true }));
      return n;
    });
    await Promise.all(
      todo.map(async (k) => {
        try {
          const data = await FETCHERS[k]();
          setState((s) => ({ ...s, [k]: { data, error: undefined, updatedAt: Date.now(), loading: false } }));
        } catch (e) {
          const error = e instanceof ApiError ? e : new ApiError(0, "UNKNOWN", "Unexpected error");
          // Keep the last good data visible, but surface the error.
          setState((s) => ({ ...s, [k]: { ...s[k], error, loading: false } }));
        } finally {
          inFlight.current.delete(k);
        }
      }),
    );
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const tick = () => {
      if (document.hidden) return;
      cycle.current += 1;
      const due = [...subs.current.keys()].filter((k) => cycle.current % EVERY_N_CYCLES[k] === 0);
      void fetchKeys(due);
    };
    const start = () => {
      if (!timer) timer = setInterval(tick, POLL_MS);
    };
    const stop = () => {
      clearInterval(timer);
      timer = undefined;
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else {
        void fetchKeys([...subs.current.keys()]);
        start();
      }
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchKeys]);

  const subscribe = useCallback(
    (keys: LiveKey[]) => {
      const fresh = keys.filter((k) => !subs.current.has(k));
      keys.forEach((k) => subs.current.set(k, (subs.current.get(k) ?? 0) + 1));
      if (fresh.length) void fetchKeys(fresh);
      return () => {
        keys.forEach((k) => {
          const n = (subs.current.get(k) ?? 1) - 1;
          if (n <= 0) subs.current.delete(k);
          else subs.current.set(k, n);
        });
      };
    },
    [fetchKeys],
  );

  const value = useMemo(() => ({ state, subscribe, refresh: fetchKeys }), [state, subscribe, fetchKeys]);
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

/** Subscribe the calling screen to live resources; returns their current entries. */
export function useLive<K extends LiveKey>(keys: readonly K[]) {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error("useLive must be used inside LiveDataProvider");
  const { subscribe, state } = ctx;
  const sig = keys.join(",");
  useEffect(() => subscribe(sig.split(",") as LiveKey[]), [subscribe, sig]);
  return state as Partial<Record<K, Entry>>;
}

export function useLiveRefresh() {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error("useLiveRefresh must be used inside LiveDataProvider");
  return ctx.refresh;
}

/** What to re-fetch after each kind of mutation (spec §44). */
export const REFRESH_AFTER = {
  trade: ["account", "positions", "orders", "baskets", "commands"],
  tpsl: ["positions", "commands"],
  close: ["account", "positions", "orders", "baskets", "commands"],
  protection: ["protection", "commands"],
  cancelOrders: ["orders", "commands"],
} satisfies Record<string, LiveKey[]>;
