import type { ReactNode } from 'react';

import { pnlDirection } from '@/lib/format';

interface MetricProps {
  label: string;
  value: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** When provided, the value is coloured by sign. */
  pnl?: number;
  hint?: ReactNode;
}

export function Metric({ label, value, size = 'md', pnl, hint }: MetricProps) {
  const sizeClass = size === 'lg' ? ' metric__value--lg' : size === 'sm' ? ' metric__value--sm' : '';
  const toneClass = pnl === undefined ? '' : ` pnl--${pnlDirection(pnl)}`;

  return (
    <div style={{ minWidth: 0 }}>
      <div className="metric__label">{label}</div>
      <div className={`metric__value${sizeClass}${toneClass}`}>{value}</div>
      {hint && <div className="stat__hint">{hint}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  pnl?: number;
  tone?: 'default' | 'positive' | 'negative' | 'warning';
}

export function StatCard({ label, value, hint, pnl, tone = 'default' }: StatCardProps) {
  const colour =
    pnl !== undefined
      ? `pnl--${pnlDirection(pnl)}`
      : tone === 'positive'
        ? 'pnl--up'
        : tone === 'negative'
          ? 'pnl--down'
          : tone === 'warning'
            ? ''
            : '';

  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span
        className={`stat__value ${colour}`}
        style={tone === 'warning' ? { color: 'var(--warning)' } : undefined}
      >
        {value}
      </span>
      {hint && <span className="stat__hint">{hint}</span>}
    </div>
  );
}
