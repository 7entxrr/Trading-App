import type { ReactNode } from 'react';

import { Icon, type IconName } from '@/components/ui/Icon';

export type BadgeTone = 'positive' | 'negative' | 'warning' | 'info' | 'neutral' | 'gold';

interface StatusBadgeProps {
  tone: BadgeTone;
  children: ReactNode;
  /** Status dot. Colour alone never carries meaning — the label always does. */
  dot?: boolean;
  pulse?: boolean;
  icon?: IconName;
}

export function StatusBadge({ tone, children, dot = false, pulse = false, icon }: StatusBadgeProps) {
  return (
    <span className={`badge badge--${tone}`}>
      {dot && <span className={`dot${pulse ? ' dot--pulse' : ''}`} />}
      {icon && <Icon name={icon} size={12} strokeWidth={2.2} />}
      {children}
    </span>
  );
}

interface LabelledStatusProps {
  label: string;
  value: string;
  tone: BadgeTone;
}

/** Compact `EA · ONLINE` pair used across account cards and detail headers. */
export function LabelledStatus({ label, value, tone }: LabelledStatusProps) {
  return (
    <span className={`badge badge--${tone}`}>
      <span className="dot" />
      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      {value}
    </span>
  );
}
