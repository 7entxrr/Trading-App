'use client';

import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';

import { AccountCard } from '@/components/domain/AccountCard';
import { BasketSummary } from '@/components/domain/BasketCard';
import { CopierStatusCard } from '@/components/domain/CopierStatusCard';
import { DataModeBadge, DataModeNotice } from '@/components/domain/DataModeBadge';
import { PerformanceChart } from '@/components/domain/PerformanceChart';
import { TradingWindowCard } from '@/components/domain/TradingWindowCard';
import { TopBar } from '@/components/layout/TopBar';
import { Icon } from '@/components/ui/Icon';
import { Metric, StatCard } from '@/components/ui/Metric';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { EmptyState, ErrorState, Skeleton, SkeletonList } from '@/components/ui/States';
import { useMounted } from '@/hooks/useMounted';
import { useCurrency } from '@/hooks/usePreferences';
import {
  useAccounts,
  useAlerts,
  useCopierStatus,
  usePortfolioPerformance,
  usePortfolioSummary,
} from '@/hooks/useTradingData';
import { getAccountHealth } from '@/lib/accounts';
import { countUnread } from '@/lib/alerts';
import { formatCount, formatCurrency, formatPnl } from '@/lib/format';
import { greetingForIst } from '@/lib/time';
import type { AccountHealth } from '@/types/domain';

const OPERATOR_NAME = 'Raj';
const OVERVIEW_LIMIT = 4;

const HEALTH_RANK: Record<AccountHealth, number> = {
  CRITICAL: 0,
  WARNING: 1,
  STALE: 2,
  HEALTHY: 3,
};

export default function HomePage() {
  const queryClient = useQueryClient();
  const mounted = useMounted();
  const currency = useCurrency();

  const portfolio = usePortfolioSummary();
  const accounts = useAccounts();
  const performance = usePortfolioPerformance();
  const copier = useCopierStatus();
  const alerts = useAlerts();

  const unread = alerts.data ? countUnread(alerts.data) : 0;

  // Surface whatever needs attention first; fall back to the largest accounts.
  const overview = [...(accounts.data ?? [])]
    .sort((a, b) => {
      const byHealth = HEALTH_RANK[getAccountHealth(a)] - HEALTH_RANK[getAccountHealth(b)];
      return byHealth !== 0 ? byHealth : b.equity - a.equity;
    })
    .slice(0, OVERVIEW_LIMIT);

  async function refreshAll() {
    await queryClient.invalidateQueries();
  }

  return (
    <>
      <TopBar
        title={
          <span className="row" style={{ gap: 8 }}>
            <Icon name="gold" size={18} style={{ color: 'var(--gold)' }} />
            GoldMiner
          </span>
        }
        subtitle={<DataModeBadge />}
        actions={
          <>
            <button
              type="button"
              className="icon-button"
              onClick={refreshAll}
              aria-label="Refresh data"
            >
              <Icon name="refresh" size={18} />
            </button>
            <Link href="/alerts" className="icon-button" aria-label={`Alerts, ${unread} unread`}>
              <Icon name="alerts" size={18} />
              {unread > 0 && (
                <span className="icon-button__badge">{unread > 99 ? '99+' : unread}</span>
              )}
            </Link>
          </>
        }
      />

      <PullToRefresh onRefresh={refreshAll}>
        <div style={{ paddingTop: 'var(--s-4)' }}>
          <p className="greeting">{mounted ? greetingForIst() : 'Welcome back'}</p>
          <h1 className="greeting__name">{OPERATOR_NAME}</h1>
        </div>

        <div className="section">
          <DataModeNotice />
        </div>

        {portfolio.isError ? (
          <div className="section">
            <ErrorState
              title="Unable to load live account data"
              message="The trading backend did not respond, so no figures can be shown. Your accounts and open positions are unaffected."
              onRetry={() => portfolio.refetch()}
            />
          </div>
        ) : portfolio.isLoading || !portfolio.data ? (
          <div className="section stack">
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Connecting to trading server…
            </p>
            <Skeleton height={168} radius={20} />
            <Skeleton height={92} radius={16} />
          </div>
        ) : (
          <>
            <div className="section">
              <div className="hero">
                <div style={{ position: 'relative' }}>
                  <div className="hero__label">Total balance</div>
                  <div className="hero__value">
                    {formatCurrency(portfolio.data.totalBalance, { currency })}
                  </div>

                  <div className="hero__split">
                    <Metric
                      label="Equity"
                      value={formatCurrency(portfolio.data.totalEquity, { currency })}
                    />
                    <Metric
                      label="Today's P/L"
                      value={formatPnl(portfolio.data.todayPnL, { currency })}
                      pnl={portfolio.data.todayPnL}
                    />
                    <Metric
                      label="Open P/L"
                      value={formatPnl(portfolio.data.floatingPnL, { currency })}
                      pnl={portfolio.data.floatingPnL}
                    />
                    <Metric
                      label="Open positions"
                      value={formatCount(portfolio.data.openPositions)}
                      hint={
                        <BasketSummary
                          buy={portfolio.data.buyBaskets}
                          sell={portfolio.data.sellBaskets}
                        />
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="section">
              <div className="stat-grid">
                <StatCard
                  label="Accounts"
                  value={formatCount(portfolio.data.totalAccounts)}
                  hint={`${portfolio.data.onlineAccounts} online`}
                />
                <StatCard
                  label="Offline"
                  value={formatCount(portfolio.data.offlineAccounts)}
                  tone={portfolio.data.offlineAccounts > 0 ? 'negative' : 'default'}
                  hint="EA or MT5 down"
                />
                <StatCard
                  label="Trading ON"
                  value={formatCount(portfolio.data.tradingEnabledAccounts)}
                  tone="positive"
                  hint="accepting new trades"
                />
                <StatCard
                  label="Paused"
                  value={formatCount(portfolio.data.tradingPausedAccounts)}
                  tone={portfolio.data.tradingPausedAccounts > 0 ? 'warning' : 'default'}
                  hint="no new trades"
                />
              </div>
            </div>
          </>
        )}

        <div className="section">
          <TradingWindowCard />
        </div>

        <div className="section">
          <div className="section__head">
            <h2 className="section__title">Today&apos;s portfolio P/L</h2>
            {portfolio.data && (
              <span
                className={`section__action pnl--${portfolio.data.todayPnL >= 0 ? 'up' : 'down'}`}
              >
                {formatPnl(portfolio.data.todayPnL, { currency })}
              </span>
            )}
          </div>
          <div className="card">
            {performance.isError ? (
              <ErrorState
                title="Performance data unavailable"
                message="Could not load today's P/L series from the trading server."
                onRetry={() => performance.refetch()}
              />
            ) : performance.isLoading || !performance.data ? (
              <Skeleton height={160} radius={12} />
            ) : performance.data.length < 2 ? (
              <EmptyState
                icon="trades"
                title="Not enough data yet"
                message="Today's P/L curve appears once the trading day has produced a few data points."
              />
            ) : (
              <PerformanceChart data={performance.data} />
            )}
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 8 }}>
            Cumulative realised + floating P/L across all accounts, in IST.
          </p>
        </div>

        <div className="section">
          <div className="section__head">
            <h2 className="section__title">Copier</h2>
          </div>
          {copier.isError ? (
            <ErrorState
              title="Copier status unavailable"
              message="Could not reach the trade copier service."
              onRetry={() => copier.refetch()}
            />
          ) : copier.isLoading || !copier.data ? (
            <Skeleton height={220} radius={16} />
          ) : (
            <CopierStatusCard status={copier.data} />
          )}
        </div>

        <div className="section">
          <div className="section__head">
            <h2 className="section__title">Account overview</h2>
            <Link href="/accounts" className="section__action">
              View all
            </Link>
          </div>

          {accounts.isError ? (
            <ErrorState
              title="Unable to load accounts"
              message="The trading backend did not respond."
              onRetry={() => accounts.refetch()}
            />
          ) : accounts.isLoading ? (
            <SkeletonList count={3} />
          ) : overview.length === 0 ? (
            <EmptyState
              icon="accounts"
              title="No accounts connected"
              message="Once the backend is wired to your MT5 terminals, accounts appear here."
            />
          ) : (
            <div className="stack">
              {overview.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          )}
        </div>

        <div className="section">
          <div className="section__head">
            <h2 className="section__title">Quick actions</h2>
          </div>
          <div className="quick-actions">
            <Link href="/accounts" className="quick-action">
              <Icon name="accounts" size={19} />
              Accounts
            </Link>
            <Link href="/trades" className="quick-action">
              <Icon name="trades" size={19} />
              Open trades
            </Link>
            <Link href="/alerts" className="quick-action">
              <Icon name="alerts" size={19} />
              Alerts
            </Link>
          </div>
        </div>
      </PullToRefresh>
    </>
  );
}
