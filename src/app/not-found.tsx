import Link from 'next/link';

import { EmptyState } from '@/components/ui/States';

export default function NotFound() {
  return (
    <div style={{ paddingTop: 'var(--s-8)' }}>
      <EmptyState
        icon="search"
        title="Page not found"
        message="That screen does not exist in the control centre."
        action={
          <Link href="/" className="btn btn--sm btn--ghost">
            Back to dashboard
          </Link>
        }
      />
    </div>
  );
}
