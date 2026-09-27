import { describe, expect, it } from 'vitest';

import { getTradingWindowState, tradingMinutesPerDay } from '@/lib/tradingWindow';
import { IST_OFFSET_MINUTES, istMinuteOfDay } from '@/lib/time';

/**
 * Builds the instant whose IST wall-clock reading is `hour:minute` on
 * 15 March 2026. The tests must never depend on the machine's timezone.
 */
function atIst(hour: number, minute = 0, day = 15): Date {
  return new Date(Date.UTC(2026, 2, day, hour, minute) - IST_OFFSET_MINUTES * 60_000);
}

describe('istMinuteOfDay', () => {
  it('reads IST wall-clock minutes regardless of host timezone', () => {
    expect(istMinuteOfDay(atIst(0, 0))).toBe(0);
    expect(istMinuteOfDay(atIst(4, 0))).toBe(240);
    expect(istMinuteOfDay(atIst(17, 30))).toBe(1050);
    expect(istMinuteOfDay(atIst(23, 59))).toBe(1439);
  });
});

describe('getTradingWindowState', () => {
  // The exact boundary table for the deployed GoldMiner working window.
  const cases: { label: string; time: Date; allowed: boolean; session: 1 | 2 | null }[] = [
    { label: '03:00 pre-dawn gap', time: atIst(3, 0), allowed: false, session: null },
    { label: '03:59 one minute before open', time: atIst(3, 59), allowed: false, session: null },
    { label: '04:00 session 1 opens', time: atIst(4, 0), allowed: true, session: 1 },
    { label: '17:29 last minute of session 1', time: atIst(17, 29), allowed: true, session: 1 },
    { label: '17:30 session 1 closes', time: atIst(17, 30), allowed: false, session: null },
    { label: '19:59 evening gap', time: atIst(19, 59), allowed: false, session: null },
    { label: '20:00 session 2 opens', time: atIst(20, 0), allowed: true, session: 2 },
    { label: '23:00 mid session 2', time: atIst(23, 0), allowed: true, session: 2 },
    { label: '02:29 session 2 tail after midnight', time: atIst(2, 29), allowed: true, session: 2 },
    { label: '02:30 session 2 closes', time: atIst(2, 30), allowed: false, session: null },
  ];

  it.each(cases)('$label', ({ time, allowed, session }) => {
    const state = getTradingWindowState(time);
    expect(state.isNewTradingAllowed).toBe(allowed);
    expect(state.status).toBe(allowed ? 'ACTIVE' : 'PAUSED');
    expect(state.currentSession).toBe(session);
  });

  it('treats midnight as inside session 2', () => {
    const state = getTradingWindowState(atIst(0, 0));
    expect(state.isNewTradingAllowed).toBe(true);
    expect(state.currentSession).toBe(2);
  });

  it('points the morning gap at session 1 later the same day', () => {
    const state = getTradingWindowState(atIst(3, 0));
    expect(state.nextSessionId).toBe(1);
    expect(istMinuteOfDay(state.nextSessionStart)).toBe(240);
    expect(state.minutesUntilChange).toBe(60);
  });

  it('points the evening gap at session 2 later the same day', () => {
    const state = getTradingWindowState(atIst(18, 0));
    expect(state.nextSessionId).toBe(2);
    expect(istMinuteOfDay(state.nextSessionStart)).toBe(1200);
    expect(state.minutesUntilChange).toBe(120);
  });

  it('ends session 1 at 17:30 the same day', () => {
    const state = getTradingWindowState(atIst(16, 30));
    expect(state.currentSessionEnd).not.toBeNull();
    expect(istMinuteOfDay(state.currentSessionEnd as Date)).toBe(1050);
    expect(state.minutesUntilChange).toBe(60);
  });

  it('ends session 2 at 02:30 the NEXT day when entered before midnight', () => {
    const state = getTradingWindowState(atIst(22, 0));
    const end = state.currentSessionEnd as Date;
    expect(istMinuteOfDay(end)).toBe(150);
    // 22:00 -> 02:30 is four and a half hours across the date boundary.
    expect(state.minutesUntilChange).toBe(270);
  });

  it('ends session 2 at 02:30 the SAME day when entered after midnight', () => {
    const state = getTradingWindowState(atIst(1, 0));
    const end = state.currentSessionEnd as Date;
    expect(istMinuteOfDay(end)).toBe(150);
    expect(state.minutesUntilChange).toBe(90);
  });

  it('schedules session 1 next while session 2 is running past midnight', () => {
    const state = getTradingWindowState(atIst(1, 0));
    expect(state.nextSessionId).toBe(1);
    expect(istMinuteOfDay(state.nextSessionStart)).toBe(240);
  });

  it('never reports a session while paused', () => {
    for (const minute of [151, 200, 239, 1051, 1100, 1199]) {
      const state = getTradingWindowState(atIst(Math.floor(minute / 60), minute % 60));
      expect(state.currentSession).toBeNull();
      expect(state.currentSessionEnd).toBeNull();
    }
  });

  it('allows new trades for 17 hours a day in total', () => {
    // 13h30m (session 1) + 6h30m (session 2)
    expect(tradingMinutesPerDay()).toBe(810 + 390);
  });
});
