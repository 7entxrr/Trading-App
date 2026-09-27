'use client';

import { useEffect, useState } from 'react';

/**
 * `false` during SSR and the first client render.
 *
 * Time-derived output (countdowns, greetings, "4m ago") would otherwise differ
 * between the server render and hydration and trip React's mismatch warning.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
