'use client';

import Link from 'next/link';

import {
  AccountHealthBadge,
  AccountStatusBadges,
  HeartbeatLabel,
} from '@/components/domain/AccountStatusBadges';
import { Icon } from '@/components/ui/Icon';
import { Metric } from '@/components/ui/Metric';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useCurrency } from '@/hooks/usePreferences';
import { formatCurrency, formatLogin, formatPnl } from '@/lib/format';
import type { Account } from '@/types/domain';

interface AccountCardProps {
  account: Account;
  /** Hides the status strip on dense surfaces such as the home overview. */
  condensed?: boolean;
}

export function AccountCard({ account, condensed = false }: AccountCardProps) {
  const currency = useCurrency();
  const buyBaskets = account.baskets.filter((basket) => basket.direction === 'BUY').length;
  const sellBaskets = account.baskets.filter((basket) => basket.direction === 'SELL').length;

  return (
    <Link href={`/accounts/${account.accountNumber}`} className="card card--interactive">
      <div className="account-card__head">
        <div style={{ minWidth: 0 }}>
          <div className="account-card__login">
            {formatLogin(account.accountNumber)}
            {account.role === 'MASTER' && (
              <StatusBadge tone="gold" icon="gold">
                MASTER
              </StatusBadge>
            )}
          </div>
          <div className="account-card__broker truncate">
            {account.broker} · {account.server}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <AccountHealthBadge account={account} />
          <Icon name="chevron-right" size={16} style={{ color: 'var(--text-faint)' }} />
        </div>
      </div>

      <div className="account-card__figures">
        <Metric label="Balance" value={formatCurrency(account.balance, { currency })} size="sm" />
        <Metric label="Equity" value={formatCurrency(account.equity, { currency })} size="sm" />
        <Metric
          label="Today"
          value={formatPnl(account.todayPnL, { currency })}
          size="sm"
          pnl={account.todayPnL}
        />
      </div>

      {!condensed && (
        <div className="account-card__statuses">
          <AccountStatusBadges account={account} />
          <StatusBadge tone="neutral">
            {account.openPositions} {account.openPositions === 1 ? 'position' : 'positions'}
          </StatusBadge>
          {buyBaskets > 0 && (
            <StatusBadge tone="positive" icon="trend-up">
              {buyBaskets > 1 ? `${buyBaskets} BUY` : 'BUY'}
            </StatusBadge>
          )}
          {sellBaskets > 0 && (
            <StatusBadge tone="negative" icon="trend-down">
              {sellBaskets > 1 ? `${sellBaskets} SELL` : 'SELL'}
            </StatusBadge>
          )}
          <span className="spacer" />
          <HeartbeatLabel account={account} />
        </div>
      )}
    </Link>
  );
}
