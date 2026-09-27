'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { AccountCard } from '@/components/domain/AccountCard';
import { TopBar } from '@/components/layout/TopBar';
import { Chips } from '@/components/ui/Chips';
import { Icon } from '@/components/ui/Icon';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { EmptyState, ErrorState, SkeletonList } from '@/components/ui/States';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useCurrency } from '@/hooks/usePreferences';
import { useAccounts } from '@/hooks/useTradingData';
import {
  ACCOUNT_FILTERS,
  ACCOUNT_SORTS,
  filterAndSortAccounts,
  matchesAccountFilter,
  type AccountFilter,
  type AccountSort,
} from '@/lib/accounts';
import { formatCurrency, formatPnl } from '@/lib/format';

export default function AccountsPage() {
  const queryClient = useQueryClient();
  const currency = useCurrency();
  const accounts = useAccounts();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useLocalStorage<AccountFilter>('goldminer.accounts.filter', 'ALL');
  const [sort, setSort] = useLocalStorage<AccountSort>('goldminer.accounts.sort', 'STATUS');

  const list = accounts.data ?? [];

  const visible = useMemo(
    () => filterAndSortAccounts(list, { query, filter, sort }),
    [list, query, filter, sort],
  );

  const filterOptions = useMemo(
    () =>
      ACCOUNT_FILTERS.map((option) => ({
        ...option,
        count: list.filter((account) => matchesAccountFilter(account, option.value)).length,
      })),
    [list],
  );

  const totals = useMemo(
    () => ({
      equity: visible.reduce((sum, account) => sum + account.equity, 0),
      todayPnL: visible.reduce((sum, account) => sum + account.todayPnL, 0),
    }),
    [visible],
  );

  return (
    <>
      <TopBar
        title="Accounts"
        subtitle={`${list.length} MT5 ${list.length === 1 ? 'account' : 'accounts'}`}
        actions={
          <button
            type="button"
            className="icon-button"
            onClick={() => queryClient.invalidateQueries()}
            aria-label="Refresh accounts"
          >
            <Icon name="refresh" size={18} />
          </button>
        }
      />

      <PullToRefresh onRefresh={() => queryClient.invalidateQueries()}>
        <div className="section" style={{ marginTop: 'var(--s-4)' }}>
          <div className="search">
            <Icon name="search" size={17} className="search__icon" />
            <input
              className="search__input"
              type="search"
              inputMode="search"
              placeholder="Search login, broker or server"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search accounts"
            />
          </div>

          <div style={{ marginTop: 'var(--s-3)' }}>
            <Chips
              options={filterOptions}
              value={filter}
              onChange={setFilter}
              ariaLabel="Filter accounts"
            />
          </div>

          <div className="row row--between" style={{ marginTop: 'var(--s-3)' }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              {visible.length} shown · {formatCurrency(totals.equity, { currency })} equity ·{' '}
              <span className={`pnl--${totals.todayPnL >= 0 ? 'up' : 'down'}`}>
                {formatPnl(totals.todayPnL, { currency })}
              </span>
            </span>
            <label className="sr-only" htmlFor="account-sort">
              Sort accounts
            </label>
            <select
              id="account-sort"
              className="select"
              value={sort}
              onChange={(event) => setSort(event.target.value as AccountSort)}
            >
              {ACCOUNT_SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort: {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="section">
          {accounts.isError ? (
            <ErrorState onRetry={() => accounts.refetch()} />
          ) : accounts.isLoading ? (
            <SkeletonList count={4} />
          ) : visible.length === 0 ? (
            <EmptyState
              icon="accounts"
              title={query ? 'No matching accounts' : 'Nothing to show'}
              message={
                query
                  ? `No account matches "${query}" with the current filter.`
                  : 'No account matches the selected filter.'
              }
              action={
                <button
                  type="button"
                  className="btn btn--sm btn--ghost"
                  onClick={() => {
                    setQuery('');
                    setFilter('ALL');
                  }}
                >
                  Clear filters
                </button>
              }
            />
          ) : (
            <div className="stack">
              {visible.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>
    </>
  );
}
