'use client';

import { LabelledStatus, StatusBadge } from '@/components/ui/StatusBadge';
import { useMounted } from '@/hooks/useMounted';
import { getAccountHealth, isHeartbeatStale } from '@/lib/accounts';
import { formatRelativeTime } from '@/lib/time';
import type { Account } from '@/types/domain';

/**
 * EA / MT5 / Trading status trio.
 *
 * Every badge carries a text label as well as a colour, so status is readable
 * without relying on colour perception. All values come from the backend.
 */
export function AccountStatusBadges({ account }: { account: Account }) {
  return (
    <>
      <LabelledStatus
        label="EA"
        value={account.eaStatus}
        tone={account.eaStatus === 'ONLINE' ? 'positive' : 'negative'}
      />
      <LabelledStatus
        label="MT5"
        value={account.mt5Status}
        tone={account.mt5Status === 'ONLINE' ? 'positive' : 'negative'}
      />
      <LabelledStatus
        label="Trading"
        value={account.tradingEnabled ? 'ENABLED' : 'PAUSED'}
        tone={account.tradingEnabled ? 'positive' : 'warning'}
      />
    </>
  );
}

export function AccountHealthBadge({ account }: { account: Account }) {
  const mounted = useMounted();
  // Health depends on heartbeat age, so only evaluate it on the client.
  const health = mounted ? getAccountHealth(account) : 'HEALTHY';

  switch (health) {
    case 'HEALTHY':
      return (
        <StatusBadge tone="positive" dot>
          Healthy
        </StatusBadge>
      );
    case 'STALE':
      return (
        <StatusBadge tone="neutral" dot>
          Stale
        </StatusBadge>
      );
    case 'WARNING':
      return (
        <StatusBadge tone="warning" dot>
          Warning
        </StatusBadge>
      );
    case 'CRITICAL':
      return (
        <StatusBadge tone="negative" dot pulse>
          Attention
        </StatusBadge>
      );
  }
}

export function HeartbeatLabel({ account }: { account: Account }) {
  const mounted = useMounted();
  if (!mounted) return null;

  const offline = account.mt5Status === 'OFFLINE';
  const stale = !offline && isHeartbeatStale(account);
  const colour = offline ? 'var(--negative)' : stale ? 'var(--warning)' : 'var(--text-faint)';

  return (
    <span style={{ fontSize: 11.5, color: colour }}>
      {offline ? 'Last seen ' : stale ? 'Stale · ' : 'Heartbeat '}
      {formatRelativeTime(account.lastHeartbeat)}
    </span>
  );
}
