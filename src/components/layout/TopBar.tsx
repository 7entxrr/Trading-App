'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { Icon } from '@/components/ui/Icon';

interface TopBarProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Renders a back chevron instead of the page title block. */
  showBack?: boolean;
  actions?: ReactNode;
}

export function TopBar({ title, subtitle, showBack = false, actions }: TopBarProps) {
  const router = useRouter();

  return (
    <header className="topbar">
      <div className="topbar__lead">
        {showBack && (
          <button
            type="button"
            className="icon-button icon-button--plain"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <Icon name="chevron-left" size={22} />
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <div className="topbar__title">{title}</div>
          {subtitle && <div className="topbar__subtitle">{subtitle}</div>}
        </div>
      </div>
      {actions && <div className="topbar__actions">{actions}</div>}
    </header>
  );
}
