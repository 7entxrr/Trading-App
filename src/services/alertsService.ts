import { dataProvider } from '@/services/dataProvider';
import type { Alert } from '@/types/domain';

export const alertsService = {
  getAlerts(signal?: AbortSignal): Promise<Alert[]> {
    return dataProvider.getAlerts(signal);
  },

  markAsRead(id: string): Promise<void> {
    return dataProvider.markAlertRead(id);
  },

  markAllAsRead(): Promise<void> {
    return dataProvider.markAllAlertsRead();
  },
};
