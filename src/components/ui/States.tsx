import type { ReactNode } from 'react';

import { Icon, type IconName } from '@/components/ui/Icon';

interface StateProps {
  icon?: IconName;
  title: string;
  message?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ icon = 'inbox', title, message, action }: StateProps) {
  return (
    <div className="state">
      <span className="state__icon">
        <Icon name={icon} size={24} />
      </span>
      <span className="state__title">{title}</span>
      {message && <span className="state__message">{message}</span>}
      {action}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: ReactNode;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Unable to load data',
  message = 'The trading backend did not respond. Check the connection and try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="state">
      <span className="state__icon" style={{ color: 'var(--negative)' }}>
        <Icon name="warning" size={24} />
      </span>
      <span className="state__title">{title}</span>
      <span className="state__message">{message}</span>
      {onRetry && (
        <button type="button" className="btn btn--sm btn--ghost" onClick={onRetry}>
          <Icon name="refresh" size={15} />
          Retry
        </button>
      )}
    </div>
  );
}

export function Skeleton({ height = 16, width = '100%', radius }: {
  height?: number | string;
  width?: number | string;
  radius?: number;
}) {
  return (
    <div
      className="skeleton"
      style={{ height, width, ...(radius !== undefined ? { borderRadius: radius } : {}) }}
      aria-hidden="true"
    />
  );
}

/** Card-shaped placeholder used while account/trade lists load. */
export function SkeletonList({ count = 3, height = 128 }: { count?: number; height?: number }) {
  return (
    <div className="stack" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} height={height} radius={16} />
      ))}
    </div>
  );
}
