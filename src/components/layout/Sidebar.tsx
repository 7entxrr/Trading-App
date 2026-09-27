'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { NAV_ITEMS, isActiveRoute } from '@/components/layout/navigation';
import { Icon } from '@/components/ui/Icon';
import { TradingWindowInline } from '@/components/domain/TradingWindowCard';
import { useAlerts } from '@/hooks/useTradingData';
import { countUnread } from '@/lib/alerts';

/** Desktop-only navigation. Mobile always uses the bottom bar. */
export function Sidebar() {
  const pathname = usePathname();
  const { data: alerts } = useAlerts();
  const unread = alerts ? countUnread(alerts) : 0;

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'var(--gold-dim)',
            color: 'var(--gold)',
          }}
        >
          <Icon name="gold" size={19} strokeWidth={2} />
        </span>
        <span>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>
            GoldMiner
          </span>
          <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>
            Control centre
          </span>
        </span>
      </div>

      {NAV_ITEMS.map((item) => {
        const active = isActiveRoute(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="sidebar__item"
            aria-current={active ? 'page' : undefined}
          >
            <Icon name={item.icon} size={19} strokeWidth={active ? 2.1 : 1.75} />
            {item.label}
            {item.showsAlertCount && unread > 0 && (
              <span className="sidebar__count">{unread > 99 ? '99+' : unread}</span>
            )}
          </Link>
        );
      })}

      <div style={{ marginTop: 'auto', padding: 'var(--s-3)' }}>
        <TradingWindowInline />
      </div>
    </aside>
  );
}
