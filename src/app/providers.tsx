'use client';

import type { ReactNode } from 'react';

import { AppShell } from '@/components/layout/AppShell';
import { ToastProvider } from '@/components/ui/Toast';
import { PreferencesProvider } from '@/hooks/usePreferences';
import { QueryProvider } from '@/providers/QueryProvider';
import { ServiceWorkerRegistrar } from '@/components/layout/ServiceWorkerRegistrar';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <PreferencesProvider>
        <ToastProvider>
          <ServiceWorkerRegistrar />
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </PreferencesProvider>
    </QueryProvider>
  );
}
