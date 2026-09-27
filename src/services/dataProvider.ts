import { apiProvider } from '@/data/providers/apiProvider';
import type { DataProvider } from '@/services/contracts';

/**
 * The one and only data source: the real backend at NEXT_PUBLIC_API_BASE_URL.
 *
 * There is no mock/demo mode. If the backend is unreachable, every service
 * call rejects and screens show an error state — nothing here ever falls back
 * to invented numbers.
 */
export const dataProvider: DataProvider = apiProvider;
