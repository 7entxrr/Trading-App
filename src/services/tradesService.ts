import { dataProvider } from '@/services/dataProvider';
import type { Trade } from '@/types/domain';

export const tradesService = {
  /** All open positions, or just one account's when `accountId` is given. */
  getTrades(accountId?: string, signal?: AbortSignal): Promise<Trade[]> {
    return dataProvider.getTrades(accountId, signal);
  },
};
