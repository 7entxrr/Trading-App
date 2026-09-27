import { apiClient } from '@/services/apiClient';
import type { DataProvider } from '@/services/contracts';
import type {
  Account,
  Alert,
  Basket,
  CopierStatus,
  PerformancePoint,
  SystemStatus,
  Trade,
} from '@/types/domain';

/**
 * LIVE PROVIDER — talks to the backend over HTTP.
 *
 * Every method propagates failure. There is deliberately no fallback to demo
 * fixtures: if the backend is unreachable the UI must show an error state, not
 * invented numbers that look like a real account.
 *
 * READ-ONLY. This provider issues GET requests for trading/account data only,
 * plus PATCH for the alert read/unread flag (dashboard UI state, not a trading
 * operation). It has no method that could pause, resume, close, or modify
 * anything on MT5 — see docs/READ_ONLY.md. Do not add one.
 *
 * Expected backend contract (see README):
 *   GET  /accounts
 *   GET  /accounts/:id
 *   GET  /accounts/:id/trades
 *   GET  /accounts/:id/baskets
 *   GET  /accounts/:id/performance
 *   GET  /trades
 *   GET  /baskets
 *   GET  /performance
 *   GET  /alerts
 *   PATCH /alerts            (mark all read — dashboard state, not trading)
 *   PATCH /alerts/:id        (mark one read)
 *   GET  /copier/status
 *   GET  /system/status
 */
export const apiProvider: DataProvider = {
  mode: 'api',

  getAccounts: (signal) => apiClient.get<Account[]>('/accounts', { signal }),
  getAccount: (id, signal) => apiClient.get<Account>(`/accounts/${id}`, { signal }),

  getTrades: (accountId, signal) =>
    accountId
      ? apiClient.get<Trade[]>(`/accounts/${accountId}/trades`, { signal })
      : apiClient.get<Trade[]>('/trades', { signal }),

  getBaskets: (accountId, signal) =>
    accountId
      ? apiClient.get<Basket[]>(`/accounts/${accountId}/baskets`, { signal })
      : apiClient.get<Basket[]>('/baskets', { signal }),

  getPortfolioPerformance: (signal) => apiClient.get<PerformancePoint[]>('/performance', { signal }),
  getAccountPerformance: (accountId, signal) =>
    apiClient.get<PerformancePoint[]>(`/accounts/${accountId}/performance`, { signal }),

  getAlerts: (signal) => apiClient.get<Alert[]>('/alerts', { signal }),
  markAlertRead: (id) => apiClient.patch<void>(`/alerts/${id}`, { read: true }),
  markAllAlertsRead: () => apiClient.patch<void>('/alerts', { read: true }),

  getCopierStatus: (signal) => apiClient.get<CopierStatus>('/copier/status', { signal }),
  getSystemStatus: (signal) => apiClient.get<SystemStatus>('/system/status', { signal }),
};
