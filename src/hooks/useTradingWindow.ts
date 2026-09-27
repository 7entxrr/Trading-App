'use client';

import { useEffect, useState } from 'react';

import { getTradingWindowState } from '@/lib/tradingWindow';
import type { TradingWindowState } from '@/types/domain';

/**
 * Recomputes the IST trading window every 30s so the countdown and the
 * ACTIVE/PAUSED flip happen without a reload.
 */
export function useTradingWindow(): TradingWindowState {
  const [state, setState] = useState<TradingWindowState>(() => getTradingWindowState());

  useEffect(() => {
    const timer = setInterval(() => setState(getTradingWindowState()), 30_000);
    return () => clearInterval(timer);
  }, []);

  return state;
}
