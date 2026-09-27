import { dataProvider } from '@/services/dataProvider';
import type { CopierStatus } from '@/types/domain';

export const copierService = {
  getCopierStatus(signal?: AbortSignal): Promise<CopierStatus> {
    return dataProvider.getCopierStatus(signal);
  },
};
