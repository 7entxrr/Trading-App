import { summarisePortfolio } from '@/lib/accounts';
import { dataProvider } from '@/services/dataProvider';
import type { Account, PortfolioSummary } from '@/types/domain';

/**
 * Account reads. READ-ONLY: this service has no method that changes trading
 * or account state — see docs/READ_ONLY.md.
 *
 * The portfolio summary is DERIVED from account data rather than fetched, so
 * the moment real MT5 accounts arrive the Home totals are correct with no
 * further change.
 */
export const accountsService = {
  getAccounts(signal?: AbortSignal): Promise<Account[]> {
    return dataProvider.getAccounts(signal);
  },

  getAccount(id: string, signal?: AbortSignal): Promise<Account> {
    return dataProvider.getAccount(id, signal);
  },

  async getPortfolioSummary(signal?: AbortSignal): Promise<PortfolioSummary> {
    return summarisePortfolio(await dataProvider.getAccounts(signal));
  },
};
