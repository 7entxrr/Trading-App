'use client';

import { createContext, createElement, useContext, useMemo, type ReactNode } from 'react';

import { env } from '@/config/env';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { CurrencyCode } from '@/types/domain';

export interface NotificationPreferences {
  pushEnabled: boolean;
  profitAlerts: boolean;
  drawdownAlerts: boolean;
  eaOfflineAlerts: boolean;
  mt5OfflineAlerts: boolean;
  basketAlerts: boolean;
  lotIncreaseAlerts: boolean;
  tradingWindowAlerts: boolean;
  systemAlerts: boolean;
}

export interface Preferences {
  theme: 'dark' | 'light';
  currency: CurrencyCode;
  showTradingWindow: boolean;
  notifications: NotificationPreferences;
}

const DEFAULT_PREFERENCES: Preferences = {
  theme: 'dark',
  currency: env.defaultCurrency,
  showTradingWindow: true,
  notifications: {
    pushEnabled: false,
    profitAlerts: true,
    drawdownAlerts: true,
    eaOfflineAlerts: true,
    mt5OfflineAlerts: true,
    basketAlerts: true,
    lotIncreaseAlerts: false,
    tradingWindowAlerts: true,
    systemAlerts: true,
  },
};

interface PreferencesContextValue {
  preferences: Preferences;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  setNotificationPreference: (key: keyof NotificationPreferences, value: boolean) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useLocalStorage<Preferences>(
    'goldminer.preferences',
    DEFAULT_PREFERENCES,
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({
      // Merge against defaults so a preference added in a later release does not
      // come back `undefined` for someone with an older stored blob.
      preferences: {
        ...DEFAULT_PREFERENCES,
        ...preferences,
        notifications: { ...DEFAULT_PREFERENCES.notifications, ...preferences.notifications },
      },
      setPreference: (key, next) => setPreferences((previous) => ({ ...previous, [key]: next })),
      setNotificationPreference: (key, next) =>
        setPreferences((previous) => ({
          ...previous,
          notifications: { ...DEFAULT_PREFERENCES.notifications, ...previous.notifications, [key]: next },
        })),
    }),
    [preferences, setPreferences],
  );

  return createElement(PreferencesContext.Provider, { value }, children);
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used inside PreferencesProvider');
  return context;
}

/** Convenience accessor for the display currency used by every money format call. */
export function useCurrency(): CurrencyCode {
  return usePreferences().preferences.currency;
}
