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
 * The data contract the backend provider satisfies.
 *
 * `apiProvider` (the only implementation) fulfils it over HTTP against a real
 * backend. Services depend on this interface only, never on `apiProvider`
 * directly, so the transport can change without touching the UI.
 *
 * STRICTLY READ-ONLY: this interface has no method that can change trading
 * state. There is no pause/resume/close/modify here and there must never be
 * one added — see docs/READ_ONLY.md. Marking an alert read is dashboard UI
 * state, not a trading or account operation, so it stays.
 */
export interface DataProvider {
  readonly mode: 'api';

  getAccounts(signal?: AbortSignal): Promise<Account[]>;
  getAccount(id: string, signal?: AbortSignal): Promise<Account>;

  getTrades(accountId?: string, signal?: AbortSignal): Promise<Trade[]>;
  getBaskets(accountId?: string, signal?: AbortSignal): Promise<Basket[]>;

  getPortfolioPerformance(signal?: AbortSignal): Promise<PerformancePoint[]>;
  getAccountPerformance(accountId: string, signal?: AbortSignal): Promise<PerformancePoint[]>;

  getAlerts(signal?: AbortSignal): Promise<Alert[]>;
  markAlertRead(id: string): Promise<void>;
  markAllAlertsRead(): Promise<void>;

  getCopierStatus(signal?: AbortSignal): Promise<CopierStatus>;
  getSystemStatus(signal?: AbortSignal): Promise<SystemStatus>;
}

export type PushPermission = 'granted' | 'denied' | 'default' | 'unsupported';

export interface PushSubscriptionSummary {
  subscribed: boolean;
  endpoint: string | null;
}

/**
 * Notification transport, kept separate from the alert *feed*.
 * `alertsService` answers "what happened"; this answers "how do I get told".
 */
export interface NotificationsService {
  isSupported(): boolean;
  getPermission(): PushPermission;
  requestPermission(): Promise<PushPermission>;
  subscribe(): Promise<PushSubscriptionSummary>;
  unsubscribe(): Promise<PushSubscriptionSummary>;
  getSubscription(): Promise<PushSubscriptionSummary>;
}

export interface RealtimeEvent {
  type: 'tick';
  at: string;
}

export interface RealtimeService {
  /** Returns an unsubscribe function. */
  subscribe(handler: (event: RealtimeEvent) => void): () => void;
  isConnected(): boolean;
}
