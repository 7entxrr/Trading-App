import type { SVGProps } from 'react';

/**
 * Single inline icon set. Keeps the bundle free of an icon dependency and
 * guarantees every glyph shares the same stroke weight and optical size.
 */

export type IconName =
  | 'home'
  | 'accounts'
  | 'trades'
  | 'alerts'
  | 'settings'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'search'
  | 'refresh'
  | 'warning'
  | 'offline'
  | 'check'
  | 'close'
  | 'pause'
  | 'play'
  | 'power'
  | 'arrow-up'
  | 'arrow-down'
  | 'shield'
  | 'clock'
  | 'info'
  | 'bolt'
  | 'layers'
  | 'server'
  | 'user'
  | 'lock'
  | 'bell-off'
  | 'inbox'
  | 'plus'
  | 'trend-up'
  | 'trend-down'
  | 'copy-link'
  | 'gold';

const PATHS: Record<IconName, string> = {
  home: 'M3 10.5 12 3l9 7.5M5.5 9.5V20a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9.5',
  accounts: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M3 10h18 M7 15h4',
  trades: 'M3 17l5-5 3.5 3.5L21 6 M21 6h-5 M21 6v5',
  alerts: 'M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7 M13.7 20a2 2 0 0 1-3.4 0',
  settings:
    'M4 6h10 M18 6h2 M4 12h4 M12 12h8 M4 18h9 M17 18h3 M16 6a2 2 0 1 0-4 0 2 2 0 0 0 4 0 M10 12a2 2 0 1 0 0 .01 M15 18a2 2 0 1 0 0 .01',
  'chevron-right': 'M9 6l6 6-6 6',
  'chevron-left': 'M15 6l-6 6 6 6',
  'chevron-down': 'M6 9l6 6 6-6',
  search: 'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z M21 21l-4.3-4.3',
  refresh: 'M21 12a9 9 0 1 1-2.6-6.4 M21 3v6h-6',
  warning: 'M12 3 2.5 19.5h19L12 3z M12 10v4 M12 17.5v.01',
  offline: 'M3 3l18 18 M8.5 15.5a5 5 0 0 1 7 0 M5 12a10 10 0 0 1 3.5-2.3 M19 12a10 10 0 0 0-8-2.9 M12 19v.01',
  check: 'M4 12.5 9.5 18 20 6.5',
  close: 'M6 6l12 12 M18 6 6 18',
  pause: 'M9 5v14 M15 5v14',
  play: 'M7 4.5 19.5 12 7 19.5z',
  power: 'M12 3v9 M18.4 6.6a9 9 0 1 1-12.8 0',
  'arrow-up': 'M12 20V4 M5 11l7-7 7 7',
  'arrow-down': 'M12 4v16 M5 13l7 7 7-7',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4',
  clock: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z M12 7v5.2l3.2 2',
  info: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z M12 11v5 M12 7.8v.01',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  layers: 'M12 3 2.5 8 12 13l9.5-5z M2.5 12.5 12 17.5l9.5-5 M2.5 17 12 22l9.5-5',
  server:
    'M4 5.5a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 20 5.5v3A1.5 1.5 0 0 1 18.5 10h-13A1.5 1.5 0 0 1 4 8.5z M4 15.5A1.5 1.5 0 0 1 5.5 14h13a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z M7.5 7v.01 M7.5 17v.01',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4.5 20.5a7.5 7.5 0 0 1 15 0',
  lock: 'M6 10.5h12a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8.5a1 1 0 0 1 1-1z M8 10.5V7.5a4 4 0 0 1 8 0v3',
  'bell-off': 'M3 3l18 18 M9 4.5A6 6 0 0 1 18 8c0 6 2 7 2 7H8 M4.5 15S6 14 6 8c0-.5.06-1 .17-1.46 M13.7 20a2 2 0 0 1-3.4 0',
  inbox:
    'M3 13h5l1.5 3h5L16 13h5 M5.2 5.5 3 13v5a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-5l-2.2-7.5a1 1 0 0 0-1-.7H6.2a1 1 0 0 0-1 .7z',
  plus: 'M12 5v14 M5 12h14',
  'trend-up': 'M3 17l6-6 4 4 8-8 M21 7h-5 M21 7v5',
  'trend-down': 'M3 7l6 6 4-4 8 8 M21 17h-5 M21 17v-5',
  'copy-link':
    'M10 13a4 4 0 0 0 5.7.3l3-3A4 4 0 0 0 13 4.7l-1.7 1.7 M14 11a4 4 0 0 0-5.7-.3l-3 3A4 4 0 0 0 11 19.3l1.7-1.7',
  gold: 'M12 3 4 8.5 7 20h10l3-11.5z M9.5 12.5h5 M12 9.5v7',
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  filled?: boolean;
}

export function Icon({ name, size = 20, strokeWidth = 1.75, filled = false, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
