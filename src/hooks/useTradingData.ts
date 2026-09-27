'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { accountsService } from '@/services/accountsService';
import { alertsService } from '@/services/alertsService';
import { basketsService } from '@/services/basketsService';
import { copierService } from '@/services/copierService';
import { performanceService } from '@/services/performanceService';
import { realtimeService } from '@/services/realtimeService';
import { systemService } from '@/services/systemService';
import { tradesService } from '@/services/tradesService';

/**
 * Every screen reads data through these hooks, which read through services.
 * No component fetches, and no component imports mock data.
 *
 * READ-ONLY: there is deliberately no mutation hook here for trading or
 * account state (no pause/resume/close). `useMarkAlertRead` /
 * `useMarkAllAlertsRead` only flip a local read/unread flag on a
 * notification — see docs/READ_ONLY.md.
 */

export const queryKeys = {
  accounts: ['accounts'] as const,
  account: (id: string) => ['accounts', id] as const,
  portfolio: ['portfolio'] as const,
  performance: ['performance'] as const,
  accountPerformance: (id: string) => ['performance', id] as const,
  trades: (accountId?: string) => ['trades', accountId ?? 'all'] as const,
  baskets: (accountId?: string) => ['baskets', accountId ?? 'all'] as const,
  alerts: ['alerts'] as const,
  copier: ['copier'] as const,
  system: ['system'] as const,
};

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: ({ signal }) => accountsService.getAccounts(signal),
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: queryKeys.account(id),
    queryFn: ({ signal }) => accountsService.getAccount(id, signal),
    enabled: id.length > 0,
  });
}

/** Portfolio totals, derived from the account list rather than fetched. */
export function usePortfolioSummary() {
  return useQuery({
    queryKey: queryKeys.portfolio,
    queryFn: ({ signal }) => accountsService.getPortfolioSummary(signal),
  });
}

export function usePortfolioPerformance() {
  return useQuery({
    queryKey: queryKeys.performance,
    queryFn: ({ signal }) => performanceService.getPortfolioPerformance(signal),
  });
}

export function useTrades(accountId?: string) {
  return useQuery({
    queryKey: queryKeys.trades(accountId),
    queryFn: ({ signal }) => tradesService.getTrades(accountId, signal),
  });
}

export function useBaskets(accountId?: string) {
  return useQuery({
    queryKey: queryKeys.baskets(accountId),
    queryFn: ({ signal }) => basketsService.getBaskets(accountId, signal),
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: queryKeys.alerts,
    queryFn: ({ signal }) => alertsService.getAlerts(signal),
  });
}

export function useCopierStatus() {
  return useQuery({
    queryKey: queryKeys.copier,
    queryFn: ({ signal }) => copierService.getCopierStatus(signal),
  });
}

/** Drives the CONNECTING / API CONNECTED / API OFFLINE indicator. */
export function useSystemStatus() {
  return useQuery({
    queryKey: queryKeys.system,
    queryFn: ({ signal }) => systemService.getSystemStatus(signal),
    // A failing status check is itself the answer, so don't retry hard.
    retry: 0,
    refetchInterval: 30_000,
  });
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertsService.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.alerts }),
  });
}

export function useMarkAllAlertsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => alertsService.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.alerts }),
  });
}

/**
 * Bridges the realtime transport to the query cache. Mount once, near the root:
 * every tick refetches the money-bearing queries through the service layer.
 */
export function useRealtimeSync(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    return realtimeService.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio });
      queryClient.invalidateQueries({ queryKey: queryKeys.performance });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['baskets'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
      queryClient.invalidateQueries({ queryKey: queryKeys.copier });
    });
  }, [queryClient]);
}
