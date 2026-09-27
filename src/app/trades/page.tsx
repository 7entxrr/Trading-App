'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { BasketCard } from '@/components/domain/BasketCard';
import { TradeRow } from '@/components/domain/TradeCard';
import { TopBar } from '@/components/layout/TopBar';
import { Chips } from '@/components/ui/Chips';
import { Icon } from '@/components/ui/Icon';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { EmptyState, ErrorState, SkeletonList } from '@/components/ui/States';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useCurrency } from '@/hooks/usePreferences';
import { useAccounts, useTrades } from '@/hooks/useTradingData';
import { formatLogin, formatLots, formatPnl } from '@/lib/format';
import { TRADE_FILTERS, filterTrades, matchesTradeFilter, type TradeFilter } from '@/lib/trades';

type ViewMode = 'POSITIONS' | 'BASKETS';

export default function TradesPage() {
  return (
    <Suspense fallback={<TradesFallback />}>
      <TradesScreen />
    </Suspense>
  );
}

function TradesFallback() {
  return (
    <>
      <TopBar title="Trades" />
      <div className="section" style={{ marginTop: 'var(--s-4)' }}>
        <SkeletonList count={4} height={104} />
      </div>
    </>
  );
}

function TradesScreen() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const currency = useCurrency();

  const accounts = useAccounts();
  const trades = useTrades();

  const [view, setView] = useState<ViewMode>('POSITIONS');
  const [filter, setFilter] = useLocalStorage<TradeFilter>('goldminer.trades.filter', 'ALL');
  const [accountLogin, setAccountLogin] = useState<string>(searchParams.get('account') ?? 'ALL');

  const accountList = accounts.data ?? [];
  const selectedAccount =
    accountLogin === 'ALL' ? null : (accountList.find((a) => a.accountNumber === accountLogin) ?? null);

  const allTrades = trades.data ?? [];
  const scopedTrades = useMemo(
    () =>
      selectedAccount === null
        ? allTrades
        : allTrades.filter((trade) => trade.accountId === selectedAccount.id),
    [allTrades, selectedAccount],
  );

  const visibleTrades = useMemo(
    () => filterTrades(scopedTrades, { filter }),
    [scopedTrades, filter],
  );

  const filterOptions = useMemo(
    () =>
      TRADE_FILTERS.map((option) => ({
        ...option,
        count: scopedTrades.filter((trade) => matchesTradeFilter(trade, option.value)).length,
      })),
    [scopedTrades],
  );

  const baskets = useMemo(() => {
    const source = selectedAccount ? [selectedAccount] : accountList;
    return source.flatMap((account) => account.baskets);
  }, [accountList, selectedAccount]);

  const totals = useMemo(
    () => ({
      pnl: visibleTrades.reduce((sum, trade) => sum + trade.pnl, 0),
      lots: visibleTrades.reduce((sum, trade) => sum + trade.lot, 0),
    }),
    [visibleTrades],
  );

  const currentPrice = allTrades[0]?.currentPrice ?? 0;
  const loading = trades.isLoading || accounts.isLoading;

  return (
    <>
      <TopBar
        title="Trades"
        subtitle={`${allTrades.length} open ${allTrades.length === 1 ? 'position' : 'positions'}`}
        actions={
          <button
            type="button"
            className="icon-button"
            onClick={() => queryClient.invalidateQueries()}
            aria-label="Refresh trades"
          >
            <Icon name="refresh" size={18} />
          </button>
        }
      />

      <PullToRefresh onRefresh={() => queryClient.invalidateQueries()}>
        <div className="section" style={{ marginTop: 'var(--s-4)' }}>
          <div className="row" style={{ gap: 8 }}>
            <label className="sr-only" htmlFor="trades-account">
              Filter by account
            </label>
            <select
              id="trades-account"
              className="select"
              style={{ flex: 1 }}
              value={accountLogin}
              onChange={(event) => setAccountLogin(event.target.value)}
            >
              <option value="ALL">All accounts ({accountList.length})</option>
              {accountList.map((account) => (
                <option key={account.id} value={account.accountNumber}>
                  {formatLogin(account.accountNumber)} · {account.broker}
                </option>
              ))}
            </select>

            <div className="row" style={{ gap: 4 }}>
              <button
                type="button"
                className="chip"
                aria-pressed={view === 'POSITIONS'}
                onClick={() => setView('POSITIONS')}
              >
                Positions
              </button>
              <button
                type="button"
                className="chip"
                aria-pressed={view === 'BASKETS'}
                onClick={() => setView('BASKETS')}
              >
                Baskets
              </button>
            </div>
          </div>

          {view === 'POSITIONS' && (
            <div style={{ marginTop: 'var(--s-3)' }}>
              <Chips
                options={filterOptions}
                value={filter}
                onChange={setFilter}
                ariaLabel="Filter trades"
              />
            </div>
          )}

          <div className="row row--between" style={{ marginTop: 'var(--s-3)' }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              {view === 'POSITIONS'
                ? `${visibleTrades.length} shown · ${formatLots(totals.lots)} lots`
                : `${baskets.length} ${baskets.length === 1 ? 'basket' : 'baskets'}`}
            </span>
            {view === 'POSITIONS' && (
              <span className={`pnl--${totals.pnl >= 0 ? 'up' : 'down'}`} style={{ fontWeight: 650, fontSize: 13 }}>
                {formatPnl(totals.pnl, { currency })}
              </span>
            )}
          </div>
        </div>

        <div className="section">
          {trades.isError ? (
            <ErrorState onRetry={() => trades.refetch()} />
          ) : loading ? (
            <SkeletonList count={4} height={104} />
          ) : view === 'POSITIONS' ? (
            visibleTrades.length === 0 ? (
              <EmptyState
                icon="trades"
                title="No open trades"
                message={
                  scopedTrades.length === 0
                    ? 'GoldMiner has no positions open right now.'
                    : 'No position matches the selected filter.'
                }
                action={
                  scopedTrades.length > 0 ? (
                    <button
                      type="button"
                      className="btn btn--sm btn--ghost"
                      onClick={() => setFilter('ALL')}
                    >
                      Clear filter
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <div className="card card--flush">
                {visibleTrades.map((trade) => (
                  <TradeRow key={trade.id} trade={trade} showAccount={selectedAccount === null} />
                ))}
              </div>
            )
          ) : baskets.length === 0 ? (
            <EmptyState
              icon="layers"
              title="No open baskets"
              message="A basket appears as soon as GoldMiner opens its first grid level."
            />
          ) : (
            <div className="stack">
              {baskets.map((basket) => (
                <div key={basket.id}>
                  {selectedAccount === null && (
                    <div
                      style={{
                        fontSize: 11.5,
                        color: 'var(--text-muted)',
                        marginBottom: 6,
                        fontWeight: 600,
                      }}
                    >
                      {formatLogin(basket.accountNumber)}
                    </div>
                  )}
                  <BasketCard
                    basket={basket}
                    trades={allTrades.filter((trade) => trade.basketId === basket.id)}
                    currentPrice={currentPrice}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>
    </>
  );
}
