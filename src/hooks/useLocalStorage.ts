'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Persists harmless UI preferences (theme, filters, notification toggles).
 *
 * Never put credentials or account secrets through this hook — localStorage is
 * readable by any script on the origin.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);

  // Read after mount so the server render and hydration agree.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) setValue(JSON.parse(stored) as T);
    } catch {
      // Corrupt or blocked storage — keep the default.
    }
  }, [key]);

  const update = useCallback(
    (next: T | ((previous: T) => T)) => {
      setValue((previous) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(previous) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Storage unavailable; the value still applies for this session.
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, update] as const;
}
