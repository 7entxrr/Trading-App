'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { NAV_ITEMS, isActiveRoute } from '@/components/layout/navigation';
import { Icon } from '@/components/ui/Icon';
import { useAlerts } from '@/hooks/useTradingData';
import { countUnread } from '@/lib/alerts';

export function BottomNav() {
  const pathname = usePathname();
  const { data: alerts } = useAlerts();
  const unread = alerts ? countUnread(alerts) : 0;

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const active = isActiveRoute(pathname, item.href);
        const badge = item.showsAlertCount && unread > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="bottom-nav__item"
            aria-current={active ? 'page' : undefined}
          >
            <span className="bottom-nav__icon">
              <Icon name={item.icon} size={21} strokeWidth={active ? 2.1 : 1.75} />
              {badge && (
                <span className="bottom-nav__badge">{unread > 99 ? '99+' : unread}</span>
              )}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
