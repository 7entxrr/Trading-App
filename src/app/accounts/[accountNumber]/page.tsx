'use client';

import { use } from 'react';
import Link from 'next/link';

import { AccountHealthBadge, AccountStatusBadges } from '@/components/domain/AccountStatusBadges';
import { BasketCard } from '@/components/domain/BasketCard';
import { NoTradesHint } from '@/components/domain/TradeCard';
import { TradingWindowCard } from '@/components/domain/TradingWindowCard';
import { TopBar } from '@/components/layout/TopBar';
import { Icon } from '@/components/ui/Icon';
import { Metric } from '@/components/ui/Metric';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { goldminer } from '@/config/goldminer';
import { useMounted } from '@/hooks/useMounted';
import { useCurrency } from '@/hooks/usePreferences';
import { useAccount, useBaskets, useTrades } from '@/hooks/useTradingData';
import { getAccountHealthReason } from '@/lib/accounts';
import { formatCurrency, formatLogin, formatPercent, formatPnl, formatPrice } from '@/lib/format';
import { formatIstDateTime, formatRelativeTime } from '@/lib/time';

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ accountNumber: string }>;
}) {
  const { accountNumber } = use(params);
  const currency = useCurrency();
  const mounted = useMounted();

  const account = useAccount(accountNumber);
  const trades = useTrades(account.data?.id);
  const baskets = useBaskets(account.data?.id);

  if (account.isError) {
    return (
      <>
        <TopBar title="Account" showBack />
        <ErrorState
          title="Unable to load account data"
          message={`Account ${formatLogin(accountNumber)} could not be reached. No figures can be shown for it.`}
          onRetry={() => account.refetch()}
        />
      </>
    );
  }

  if (account.isLoading || !account.data) {
    return (
      <>
        <TopBar title={formatLogin(accountNumber)} showBack />
        <div className="section stack" style={{ marginTop: 'var(--s-4)' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Connecting to trading server…</p>
          <Skeleton height={160} radius={20} />
          <Skeleton height={200} radius={16} />
        </div>
      </>
    );
  }

  const data = account.data;
  const basketList = baskets.data ?? data.baskets;
  const tradeList = trades.data ?? [];
  const currentPrice = tradeList[0]?.currentPrice ?? 0;
  const buyBaskets = basketList.filter((basket) => basket.direction === 'BUY');
  const sellBaskets = basketList.filter((basket) => basket.direction === 'SELL');
  const offline = data.mt5Status === 'OFFLINE';

  return (
    <>
      <TopBar
        title={formatLogin(data.accountNumber)}
        subtitle={`${data.broker} · ${data.server}`}
        showBack
        actions={<AccountHealthBadge account={data} />}
      />

      {offline && (
        <div className="section" style={{ marginTop: 'var(--s-4)' }}>
          <div className="callout callout--danger">
            <Icon name="offline" size={18} />
            <span>
              MT5 terminal is offline. These are the last values reported
              {mounted ? ` ${formatRelativeTime(data.lastHeartbeat)}` : ''} — they are not live.
            </span>
          </div>
        </div>
      )}

      <div className="section" style={{ marginTop: offline ? 'var(--s-4)' : 'var(--s-5)' }}>
        <div className="hero">
          <div style={{ position: 'relative' }}>
            <div className="hero__label">Equity</div>
            <div className="hero__value">{formatCurrency(data.equity, { currency })}</div>
            <div className="hero__split">
              <Metric label="Balance" value={formatCurrency(data.balance, { currency })} />
              <Metric
                label="Today's P/L"
                value={formatPnl(data.todayPnL, { currency })}
                pnl={data.todayPnL}
              />
              <Metric
                label="Floating P/L"
                value={formatPnl(data.floatingPnL, { currency })}
                pnl={data.floatingPnL}
              />
              <Metric label="Open positions" value={String(data.openPositions)} />
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          <AccountStatusBadges account={data} />
        </div>
        {mounted && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
            {getAccountHealthReason(data)} · heartbeat {formatRelativeTime(data.lastHeartbeat)} (
            {formatIstDateTime(data.lastHeartbeat)} IST)
          </p>
        )}
      </div>

      <div className="section">
        <div className="section__head">
          <h2 className="section__title">Margin</h2>
        </div>
        <div className="card card--flush">
          <div className="rows">
            <DetailRow label="Margin" value={formatCurrency(data.margin, { currency })} />
            <DetailRow label="Free margin" value={formatCurrency(data.freeMargin, { currency })} />
            <DetailRow
              label="Margin level"
              value={data.marginLevel === null ? '—' : formatPercent(data.marginLevel, 0)}
            />
            <DetailRow
              label="Drawdown from peak"
              value={formatPercent(data.drawdownPct)}
              tone={data.drawdownPct >= 10 ? 'down' : undefined}
            />
            <DetailRow label="Peak equity" value={formatCurrency(data.peakEquity, { currency })} />
          </div>
        </div>
      </div>

      <div className="section">
        <TradingWindowCard compact />
      </div>

      <div className="section">
        <div className="section__head">
          <h2 className="section__title">Open baskets</h2>
          <Link href={`/trades?account=${data.accountNumber}`} className="section__action">
            All trades
          </Link>
        </div>

        {baskets.isError ? (
          <ErrorState
            title="Basket data unavailable"
            message="The trading server did not return basket data for this account."
            onRetry={() => baskets.refetch()}
          />
        ) : basketList.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="layers"
              title="No open baskets"
              message="GoldMiner has no positions on this account right now."
            />
          </div>
        ) : (
          <div className="stack">
            {[...buyBaskets, ...sellBaskets].map((basket) => (
              <BasketCard
                key={basket.id}
                basket={basket}
                trades={tradeList.filter((trade) => trade.basketId === basket.id)}
                currentPrice={currentPrice}
              />
            ))}
            {buyBaskets.length > 0 && sellBaskets.length > 0 && (
              <NoTradesHint label="Hedging account: BUY and SELL baskets run simultaneously." />
            )}
          </div>
        )}
      </div>

      <div className="section">
        <div className="section__head">
          <h2 className="section__title">Strategy</h2>
        </div>
        <div className="card card--flush">
          <div className="rows">
            <DetailRow label="EA" value={`${goldminer.eaName} · magic ${goldminer.magicNumber}`} />
            <DetailRow label="Symbol" value={goldminer.symbol} />
            <DetailRow
              label="Lots"
              value={`${goldminer.startLot} × ${goldminer.lotMultiplier} (max ${goldminer.maxLot})`}
            />
            <DetailRow label="Grid step" value={`${goldminer.gridStepPoints} points`} />
            <DetailRow label="Take profit" value={`${goldminer.takeProfitPoints} points`} />
            <DetailRow
              label="Current price"
              value={currentPrice > 0 ? formatPrice(currentPrice) : 'Waiting for MT5'}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  return (
    <div className="rows__item">
      <span className="rows__label">{label}</span>
      <span className={`rows__value${tone ? ` pnl--${tone}` : ''}`}>{value}</span>
    </div>
  );
}
