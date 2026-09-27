import type { Alert, AlertSeverity, AlertType } from '@/types/domain';

export type AlertFilter = 'ALL' | 'UNREAD' | 'CRITICAL' | 'TRADING' | 'SYSTEM';

export const ALERT_FILTERS: { value: AlertFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'UNREAD', label: 'Unread' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'TRADING', label: 'Trading' },
  { value: 'SYSTEM', label: 'System' },
];

const TRADING_TYPES: AlertType[] = [
  'PROFIT',
  'DRAWDOWN',
  'NEW_BASKET',
  'BASKET_CLOSED',
  'LOT_INCREASE',
  'TRADING_PAUSED',
  'TRADING_RESUMED',
];

const SYSTEM_TYPES: AlertType[] = ['EA_OFFLINE', 'MT5_OFFLINE', 'SYSTEM_ERROR'];

export function matchesAlertFilter(alert: Alert, filter: AlertFilter): boolean {
  switch (filter) {
    case 'ALL':
      return true;
    case 'UNREAD':
      return !alert.read;
    case 'CRITICAL':
      return alert.severity === 'CRITICAL' || alert.severity === 'WARNING';
    case 'TRADING':
      return TRADING_TYPES.includes(alert.type);
    case 'SYSTEM':
      return SYSTEM_TYPES.includes(alert.type);
  }
}

export function filterAlerts(
  alerts: Alert[],
  options: { filter?: AlertFilter; accountNumber?: string | null } = {},
): Alert[] {
  const { filter = 'ALL', accountNumber = null } = options;
  return alerts
    .filter(
      (alert) =>
        matchesAlertFilter(alert, filter) &&
        (accountNumber === null || alert.accountNumber === accountNumber),
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function countUnread(alerts: Alert[]): number {
  return alerts.reduce((total, alert) => (alert.read ? total : total + 1), 0);
}

/** Which notification preference toggle governs a given alert type. */
export const ALERT_PREFERENCE_KEY: Record<AlertType, string> = {
  PROFIT: 'profitAlerts',
  BASKET_CLOSED: 'basketAlerts',
  NEW_BASKET: 'basketAlerts',
  DRAWDOWN: 'drawdownAlerts',
  EA_OFFLINE: 'eaOfflineAlerts',
  MT5_OFFLINE: 'mt5OfflineAlerts',
  LOT_INCREASE: 'lotIncreaseAlerts',
  TRADING_PAUSED: 'tradingWindowAlerts',
  TRADING_RESUMED: 'tradingWindowAlerts',
  SYSTEM_ERROR: 'systemAlerts',
};

export const ALERT_TYPE_LABEL: Record<AlertType, string> = {
  PROFIT: 'Profit',
  DRAWDOWN: 'Drawdown',
  EA_OFFLINE: 'EA offline',
  MT5_OFFLINE: 'MT5 offline',
  NEW_BASKET: 'New basket',
  BASKET_CLOSED: 'Basket closed',
  LOT_INCREASE: 'Lot increase',
  TRADING_PAUSED: 'Trades paused',
  TRADING_RESUMED: 'Trades resumed',
  SYSTEM_ERROR: 'System error',
};

export const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  INFO: 'Info',
  SUCCESS: 'Good',
  WARNING: 'Warning',
  CRITICAL: 'Critical',
};
