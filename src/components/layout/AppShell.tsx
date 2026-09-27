'use client';

import type { ReactNode } from 'react';

import { BottomNav } from '@/components/layout/BottomNav';
import { Sidebar } from '@/components/layout/Sidebar';
import { useRealtimeSync } from '@/hooks/useTradingData';

/**
 * Mobile: content column + fixed bottom navigation.
 * Desktop (>=1024px): persistent sidebar, bottom bar hidden.
 */
export function AppShell({ children }: { children: ReactNode }) {
  useRealtimeSync();

  return (
    <div className="shell">
      <Sidebar />
      <div className="shell__body">{children}</div>
      <BottomNav />
    </div>
  );
}
