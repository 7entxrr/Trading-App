'use client';

import { Icon } from '@/components/ui/Icon';
import { useMounted } from '@/hooks/useMounted';
import { useTradingWindow } from '@/hooks/useTradingWindow';
import { formatDuration, formatIstTime } from '@/lib/time';

interface TradingWindowCardProps {
  /** Compact variant for the account detail header. */
  compact?: boolean;
}

/**
 * The IST working window.
 *
 * Wording matters: outside a session the EA stops OPENING positions. Existing
 * baskets keep running and their take-profit stays live, so this never says
 * "trading stopped".
 */
export function TradingWindowCard({ compact = false }: TradingWindowCardProps) {
  const window = useTradingWindow();
  const mounted = useMounted();
  const active = window.isNewTradingAllowed;

  return (
    <div className={`window-card window-card--${active ? 'active' : 'paused'}`}>
      <div className="row row--between">
        <span
          className="window-card__status"
          style={{ color: active ? 'var(--positive)' : 'var(--warning)' }}
        >
          <span className={`dot${active ? ' dot--pulse' : ''}`} />
          {active ? 'TRADING ACTIVE' : 'NEW TRADES PAUSED'}
        </span>
        <span className="badge badge--neutral">
          <Icon name="clock" size={12} strokeWidth={2.2} />
          IST
        </span>
      </div>

      <div className="window-card__sessions">
        {window.sessions.map((session) => (
          <span
            key={session.id}
            className={`session-pill${window.currentSession === session.id ? ' session-pill--current' : ''}`}
          >
            {window.currentSession === session.id && <span className="dot" />}
            {session.label}
          </span>
        ))}
      </div>

      {!compact && (
        <p className="window-card__note">
          {mounted ? (
            active ? (
              <>
                New positions allowed for another{' '}
                <strong style={{ color: 'var(--text)' }}>
                  {formatDuration(window.minutesUntilChange)}
                </strong>
                , until {formatIstTime(window.currentSessionEnd ?? new Date())} IST.
              </>
            ) : (
              <>
                Next trading session starts at{' '}
                <strong style={{ color: 'var(--text)' }}>
                  {formatIstTime(window.nextSessionStart)}
                </strong>{' '}
                IST, in {formatDuration(window.minutesUntilChange)}. Open positions keep running and
                take-profit stays active.
              </>
            )
          ) : (
            'Checking the working window…'
          )}
        </p>
      )}
    </div>
  );
}

/** One-line status used inside account headers where space is tight. */
export function TradingWindowInline() {
  const window = useTradingWindow();
  const mounted = useMounted();
  const active = window.isNewTradingAllowed;

  return (
    <span
      className={`badge badge--${active ? 'positive' : 'warning'}`}
      title={mounted ? `Next change in ${formatDuration(window.minutesUntilChange)}` : undefined}
    >
      <span className="dot" />
      {active ? 'Window open' : 'Window closed'}
    </span>
  );
}
