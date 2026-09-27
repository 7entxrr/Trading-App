'use client';

import { ErrorState } from '@/components/ui/States';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ paddingTop: 'var(--s-8)' }}>
      <ErrorState
        title="Something went wrong"
        message="The dashboard hit an unexpected error. Your accounts and open positions are unaffected."
        onRetry={reset}
      />
    </div>
  );
}
