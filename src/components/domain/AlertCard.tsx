'use client';

import { Icon, type IconName } from '@/components/ui/Icon';
import { ALERT_TYPE_LABEL } from '@/lib/alerts';
import { formatLogin } from '@/lib/format';
import { formatRelativeTime } from '@/lib/time';
import type { Alert, AlertSeverity, AlertType } from '@/types/domain';

const ICON_BY_TYPE: Record<AlertType, IconName> = {
  PROFIT: 'trend-up',
  DRAWDOWN: 'trend-down',
  EA_OFFLINE: 'offline',
  MT5_OFFLINE: 'server',
  NEW_BASKET: 'layers',
  BASKET_CLOSED: 'check',
  LOT_INCREASE: 'bolt',
  TRADING_PAUSED: 'pause',
  TRADING_RESUMED: 'play',
  SYSTEM_ERROR: 'warning',
};

const COLOUR_BY_SEVERITY: Record<AlertSeverity, { fg: string; bg: string }> = {
  INFO: { fg: 'var(--info)', bg: 'var(--info-dim)' },
  SUCCESS: { fg: 'var(--positive)', bg: 'var(--positive-dim)' },
  WARNING: { fg: 'var(--warning)', bg: 'var(--warning-dim)' },
  CRITICAL: { fg: 'var(--negative)', bg: 'var(--negative-dim)' },
};

interface AlertCardProps {
  alert: Alert;
  onRead: (id: string) => void;
}

export function AlertCard({ alert, onRead }: AlertCardProps) {
  const colours = COLOUR_BY_SEVERITY[alert.severity];

  return (
    <button
      type="button"
      className={`alert-card${alert.read ? '' : ' alert-card--unread'}`}
      onClick={() => !alert.read && onRead(alert.id)}
    >
      <span
        className="alert-card__icon"
        style={{ background: colours.bg, color: colours.fg }}
        aria-hidden="true"
      >
        <Icon name={ICON_BY_TYPE[alert.type]} size={17} strokeWidth={2} />
      </span>

      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="alert-card__title" style={{ display: 'block' }}>
          {alert.title}
        </span>
        <span className="alert-card__desc" style={{ display: 'block' }}>
          {alert.message}
        </span>
        <span className="alert-card__meta">
          <span style={{ color: colours.fg, fontWeight: 600 }}>{ALERT_TYPE_LABEL[alert.type]}</span>
          {alert.accountNumber && (
            <>
              <span>·</span>
              <span>{formatLogin(alert.accountNumber)}</span>
            </>
          )}
          <span>·</span>
          <span>{formatRelativeTime(alert.timestamp)}</span>
          {!alert.read && (
            <>
              <span>·</span>
              <span style={{ color: 'var(--info)', fontWeight: 600 }}>Unread</span>
            </>
          )}
        </span>
      </span>

      {!alert.read && <span className="alert-card__unread-dot" aria-hidden="true" />}
    </button>
  );
}
