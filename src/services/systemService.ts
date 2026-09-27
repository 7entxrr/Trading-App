import { dataProvider } from '@/services/dataProvider';
import type { SystemStatus } from '@/types/domain';

/**
 * Backend and trading-infrastructure reachability.
 *
 * Drives the CONNECTING / API CONNECTED / API OFFLINE indicator, so it must
 * always report the real state — never an optimistic default.
 */
export const systemService = {
  getSystemStatus(signal?: AbortSignal): Promise<SystemStatus> {
    return dataProvider.getSystemStatus(signal);
  },
};
