import { describe, expect, it } from 'vitest';

import {
  formatLots,
  formatPercent,
  formatPnl,
  formatPoints,
  formatPrice,
  pnlDirection,
} from '@/lib/format';

describe('formatPnl', () => {
  it('signs gains and losses distinctly', () => {
    expect(formatPnl(4820)).toContain('+');
    expect(formatPnl(-1120)).toContain('−');
    expect(formatPnl(0)).toContain('+');
  });

  it('groups INR in the lakh/crore convention', () => {
    // en-IN groups as 2,40,000 rather than 240,000.
    expect(formatPnl(240000)).toContain('2,40,000');
  });

  it('never renders a raw minus sign alongside the currency symbol', () => {
    expect(formatPnl(-500).startsWith('−')).toBe(true);
  });

  it('honours the display currency', () => {
    expect(formatPnl(1000, { currency: 'USD' })).toContain('$');
    expect(formatPnl(1000, { currency: 'INR' })).toContain('₹');
  });

  it('falls back to zero for non-finite input', () => {
    expect(formatPnl(Number.NaN)).toContain('0');
  });
});

describe('pnlDirection', () => {
  it('classifies sign with a dead zone around zero', () => {
    expect(pnlDirection(12)).toBe('up');
    expect(pnlDirection(-12)).toBe('down');
    expect(pnlDirection(0)).toBe('flat');
    expect(pnlDirection(0.00001)).toBe('flat');
  });
});

describe('market value formatting', () => {
  it('renders MT5 volumes with two decimals', () => {
    expect(formatLots(0.01)).toBe('0.01');
    expect(formatLots(1.28)).toBe('1.28');
    expect(formatLots(0.1)).toBe('0.10');
  });

  it('renders gold prices to two decimals', () => {
    expect(formatPrice(4336.6)).toBe('4,336.60');
  });

  it('labels point distances', () => {
    expect(formatPoints(800)).toBe('800 pts');
  });

  it('formats percentages with an explicit minus glyph', () => {
    expect(formatPercent(17.3)).toBe('17.3%');
    expect(formatPercent(-4.25)).toBe('−4.3%');
    expect(formatPercent(3.2, 1, true)).toBe('+3.2%');
  });
});
