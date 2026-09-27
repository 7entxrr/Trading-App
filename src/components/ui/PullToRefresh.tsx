'use client';

import { useRef, useState, type ReactNode, type TouchEvent } from 'react';

import { Icon } from '@/components/ui/Icon';

const TRIGGER_DISTANCE = 72;
const MAX_PULL = 110;

interface PullToRefreshProps {
  onRefresh: () => Promise<unknown>;
  children: ReactNode;
}

/**
 * Native-feeling pull-to-refresh for the installed PWA, where there is no
 * browser reload affordance. Only engages when the page is already at the top.
 */
export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (window.scrollY > 0 || refreshing) return;
    startY.current = event.touches[0]?.clientY ?? null;
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (startY.current === null) return;
    const currentY = event.touches[0]?.clientY ?? 0;
    const delta = currentY - startY.current;
    if (delta <= 0) {
      setDistance(0);
      return;
    }
    // Resistance curve so the pull feels weighted rather than linear.
    setDistance(Math.min(MAX_PULL, delta * 0.45));
  }

  async function handleTouchEnd() {
    if (startY.current === null) return;
    startY.current = null;

    if (distance < TRIGGER_DISTANCE) {
      setDistance(0);
      return;
    }

    setRefreshing(true);
    setDistance(TRIGGER_DISTANCE);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      setDistance(0);
    }
  }

  const armed = distance >= TRIGGER_DISTANCE;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div className="pull-indicator" style={{ height: distance }}>
        {distance > 8 && (
          <Icon
            name="refresh"
            size={18}
            style={{
              transform: `rotate(${distance * 3}deg)`,
              color: armed || refreshing ? 'var(--gold)' : 'var(--text-muted)',
            }}
          />
        )}
      </div>
      {children}
    </div>
  );
}
