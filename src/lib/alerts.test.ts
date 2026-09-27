import { describe, expect, it } from 'vitest';

import { countUnread, filterAlerts, matchesAlertFilter } from '@/lib/alerts';
import type { Alert, AlertSeverity, AlertType } from '@/types/domain';

function alert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'a1',
    type: 'PROFIT' as AlertType,
    severity: 'SUCCESS' as AlertSeverity,
    title: 'Basket closed',
    message: '+₹420',
    accountNumber: '33814735',
    timestamp: new Date('2026-03-15T10:00:00Z').toISOString(),
    read: false,
    ...overrides,
  };
}

describe('matchesAlertFilter', () => {
  it('separates trading events from infrastructure events', () => {
    expect(matchesAlertFilter(alert({ type: 'LOT_INCREASE' }), 'TRADING')).toBe(true);
    expect(matchesAlertFilter(alert({ type: 'LOT_INCREASE' }), 'SYSTEM')).toBe(false);
    expect(matchesAlertFilter(alert({ type: 'MT5_OFFLINE' }), 'SYSTEM')).toBe(true);
    expect(matchesAlertFilter(alert({ type: 'EA_OFFLINE' }), 'SYSTEM')).toBe(true);
    expect(matchesAlertFilter(alert({ type: 'SYSTEM_ERROR' }), 'TRADING')).toBe(false);
  });

  it('treats warnings and criticals as the attention bucket', () => {
    expect(matchesAlertFilter(alert({ severity: 'CRITICAL' }), 'CRITICAL')).toBe(true);
    expect(matchesAlertFilter(alert({ severity: 'WARNING' }), 'CRITICAL')).toBe(true);
    expect(matchesAlertFilter(alert({ severity: 'INFO' }), 'CRITICAL')).toBe(false);
    expect(matchesAlertFilter(alert({ severity: 'SUCCESS' }), 'CRITICAL')).toBe(false);
  });

  it('filters unread', () => {
    expect(matchesAlertFilter(alert({ read: false }), 'UNREAD')).toBe(true);
    expect(matchesAlertFilter(alert({ read: true }), 'UNREAD')).toBe(false);
  });
});

describe('filterAlerts', () => {
  const older = alert({ id: 'older', timestamp: '2026-03-15T08:00:00Z' });
  const newer = alert({ id: 'newer', timestamp: '2026-03-15T12:00:00Z' });
  const other = alert({ id: 'other', accountNumber: '90044118' });

  it('returns newest first', () => {
    expect(filterAlerts([older, newer]).map((a) => a.id)).toEqual(['newer', 'older']);
  });

  it('scopes to a single account when asked', () => {
    const result = filterAlerts([newer, other], { accountNumber: '90044118' });
    expect(result.map((a) => a.id)).toEqual(['other']);
  });

  it('keeps portfolio-wide alerts out of an account scope', () => {
    const global = alert({ id: 'global', accountNumber: null });
    expect(filterAlerts([global], { accountNumber: '33814735' })).toHaveLength(0);
  });

  it('does not mutate the source array order', () => {
    const input = [older, newer];
    filterAlerts(input);
    expect(input[0]?.id).toBe('older');
  });
});

describe('countUnread', () => {
  it('counts only unread entries', () => {
    expect(countUnread([alert({ read: false }), alert({ read: true }), alert({ read: false })])).toBe(2);
    expect(countUnread([])).toBe(0);
  });
});
