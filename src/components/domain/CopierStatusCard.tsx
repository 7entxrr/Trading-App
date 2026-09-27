'use client';

import Link from 'next/link';

import { Icon } from '@/components/ui/Icon';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatLogin, formatLots } from '@/lib/format';
import { formatRelativeTime } from '@/lib/time';
import type { CopierStatus } from '@/types/domain';

/**
 * Master → copier → slaves health. This is the first thing to check when
 * slave accounts stop mirroring the master's trades.
 */
export function CopierStatusCard({ status }: { status: CopierStatus }) {
  const online = status.copierStatus === 'ONLINE';
  const allSynced = status.failedSlaves === 0;

  return (
    <div className="card">
      <div className="row row--between">
        <span className="row" style={{ gap: 8 }}>
          <Icon name="copy-link" size={17} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: 14, fontWeight: 650 }}>Trade copier</span>
        </span>
        <StatusBadge tone={online ? 'positive' : 'negative'} dot pulse={online}>
          {status.copierStatus}
        </StatusBadge>
      </div>

      <div className="rows" style={{ marginTop: 4 }}>
        <div className="rows__item" style={{ paddingInline: 0 }}>
          <span className="rows__label">Master</span>
          <span className="rows__value">
            <Link href={`/accounts/${status.masterAccountNumber}`} style={{ color: 'var(--gold)' }}>
              {formatLogin(status.masterAccountNumber)}
            </Link>{' '}
            <span style={{ color: status.masterEaStatus === 'ONLINE' ? 'var(--positive)' : 'var(--negative)' }}>
              · EA {status.masterEaStatus}
            </span>
          </span>
        </div>

        <div className="rows__item" style={{ paddingInline: 0 }}>
          <span className="rows__label">Copied accounts</span>
          <span className="rows__value" style={{ color: allSynced ? 'var(--positive)' : 'var(--warning)' }}>
            {status.syncedSlaves} / {status.totalSlaves}
          </span>
        </div>

        <div className="rows__item" style={{ paddingInline: 0 }}>
          <span className="rows__label">Failed</span>
          <span
            className="rows__value"
            style={{ color: status.failedSlaves > 0 ? 'var(--negative)' : 'var(--text-secondary)' }}
          >
            {status.failedSlaves}
          </span>
        </div>

        <div className="rows__item" style={{ paddingInline: 0 }}>
          <span className="rows__label">Last trade</span>
          <span className="rows__value rows__value--muted">
            {status.lastTrade
              ? `${status.lastTrade.direction} ${formatLots(status.lastTrade.lot)} ${status.lastTrade.symbol}`
              : 'No trades yet'}
          </span>
        </div>

        <div className="rows__item" style={{ paddingInline: 0 }}>
          <span className="rows__label">Last sync</span>
          <span className="rows__value rows__value--muted">
            {formatRelativeTime(status.lastSyncAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
