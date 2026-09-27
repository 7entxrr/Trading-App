import type { IconName } from '@/components/ui/Icon';

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Shows the unread alert count as a badge. */
  showsAlertCount?: boolean;
}

/**
 * Primary navigation. Five destinations, always visible in the bottom bar on
 * mobile — never behind a hamburger.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/accounts', label: 'Accounts', icon: 'accounts' },
  { href: '/trades', label: 'Trades', icon: 'trades' },
  { href: '/alerts', label: 'Alerts', icon: 'alerts', showsAlertCount: true },
  { href: '/settings', label: 'Settings', icon: 'settings' },
];

export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
