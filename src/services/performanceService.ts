import { dataProvider } from '@/services/dataProvider';
import type { PerformancePoint } from '@/types/domain';

/**
 * Portfolio P/L time series.
 *
 * Every point is today's CUMULATIVE portfolio P/L (realised + floating) at a
 * real timestamp. The chart component receives this array as-is and never
 * generates or interpolates values of its own.
 */
export const performanceService = {
  getPortfolioPerformance(signal?: AbortSignal): Promise<PerformancePoint[]> {
    return dataProvider.getPortfolioPerformance(signal);
  },

  getAccountPerformance(accountId: string, signal?: AbortSignal): Promise<PerformancePoint[]> {
    return dataProvider.getAccountPerformance(accountId, signal);
  },
};
