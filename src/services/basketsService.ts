import { dataProvider } from '@/services/dataProvider';
import type { Basket } from '@/types/domain';

/**
 * GoldMiner is basket-oriented: several grid positions share one take-profit.
 * Basket aggregation (position count, weighted average entry, basket TP,
 * current P/L) is the backend's job — the frontend only renders what it gets.
 */
export const basketsService = {
  getBaskets(accountId?: string, signal?: AbortSignal): Promise<Basket[]> {
    return dataProvider.getBaskets(accountId, signal);
  },
};
