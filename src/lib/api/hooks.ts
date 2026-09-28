"use client";

import { useMemo } from "react";
import { ApiError } from "./errors";
import { useLive, type LiveKey } from "./live";
import * as m from "./mappers";

export type Resource<T> = {
  data: T | undefined;
  /** Request failed (keeps last good data if any) */
  error: ApiError | undefined;
  /** First load still in progress */
  loading: boolean;
  /** Data arrived but the response mapping isn't implemented yet */
  unmapped: boolean;
  updatedAt: number | undefined;
};

function useResource<T>(key: LiveKey, mapper: (raw: unknown) => T): Resource<T> {
  const entry = useLive([key])[key];
  return useMemo(() => {
    let data: T | undefined;
    let unmapped = false;
    let mapError: ApiError | undefined;
    if (entry?.data !== undefined) {
      try {
        data = mapper(entry.data);
      } catch (e) {
        if (e instanceof m.UnmappedError) unmapped = true;
        // Never crash a screen on an unexpected response; show it as an error instead.
        else mapError = new ApiError(0, "BAD_RESPONSE", "Unexpected response format from the server");
      }
    }
    return {
      data,
      error: entry?.error ?? mapError,
      loading: !entry || (entry.loading && entry.data === undefined && !entry.error),
      unmapped,
      updatedAt: entry?.updatedAt,
    };
  }, [entry, mapper]);
}

export const useStatus = () => useResource("status", m.mapStatus);
export const useAccount = () => useResource("account", m.mapAccount);
export const usePositions = () => useResource("positions", m.mapPositions);
export const useOrders = () => useResource("orders", m.mapOrders);
export const useTrades = () => useResource("trades", m.mapTrades);
export const useBaskets = () => useResource("baskets", m.mapBaskets);
export const usePerformance = () => useResource("performance", m.mapPerformance);
export const useAlerts = () => useResource("alerts", m.mapAlerts);
export const useProtection = () => useResource("protection", m.mapProtection);
export const useCommands = () => useResource("commands", m.mapCommands);
export const useMarket = () => useResource("snapshot", m.mapMarket);
