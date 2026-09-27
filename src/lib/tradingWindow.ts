import { TRADING_SESSIONS } from '@/config/goldminer';
import type { SessionId, TradingSession, TradingWindowState } from '@/types/domain';
import { MINUTES_PER_DAY, istDateAt, istMinuteOfDay } from '@/lib/time';

/**
 * Whether the EA is allowed to open NEW positions right now.
 *
 * Outside a session the EA stops *opening* — it does not close anything.
 * Existing baskets keep being managed and their TP stays live, which is why the
 * UI says "NEW TRADES PAUSED" and never "trading stopped".
 */
export function getTradingWindowState(now: Date = new Date()): TradingWindowState {
  const minute = istMinuteOfDay(now);
  const active = TRADING_SESSIONS.find((session) => containsMinute(session, minute)) ?? null;

  if (active) {
    const currentSessionEnd = endInstantFor(active, now, minute);
    const nextSession = sessionAfter(active.id);
    const nextSessionStart = nextStartInstantFor(nextSession, now, minute);
    return {
      isNewTradingAllowed: true,
      currentSession: active.id,
      status: 'ACTIVE',
      nextSessionStart,
      nextSessionId: nextSession.id,
      currentSessionEnd,
      minutesUntilChange: minutesBetween(now, currentSessionEnd),
      sessions: TRADING_SESSIONS,
    };
  }

  const nextSession = nextSessionWhenPaused(minute);
  const nextSessionStart = nextStartInstantFor(nextSession, now, minute);
  return {
    isNewTradingAllowed: false,
    currentSession: null,
    status: 'PAUSED',
    nextSessionStart,
    nextSessionId: nextSession.id,
    currentSessionEnd: null,
    minutesUntilChange: minutesBetween(now, nextSessionStart),
    sessions: TRADING_SESSIONS,
  };
}

/** Session 2 wraps past midnight (20:00 -> 02:30), so containment wraps too. */
export function containsMinute(session: TradingSession, minute: number): boolean {
  if (session.startMinute <= session.endMinute) {
    return minute >= session.startMinute && minute < session.endMinute;
  }
  return minute >= session.startMinute || minute < session.endMinute;
}

function sessionById(id: SessionId): TradingSession {
  const session = TRADING_SESSIONS.find((candidate) => candidate.id === id);
  if (!session) throw new Error(`Unknown trading session: ${id}`);
  return session;
}

function sessionAfter(id: SessionId): TradingSession {
  return sessionById(id === 1 ? 2 : 1);
}

function nextSessionWhenPaused(minute: number): TradingSession {
  // Two pause gaps exist: 02:30-04:00 (before session 1) and 17:30-20:00 (before session 2).
  const session1 = sessionById(1);
  return minute < session1.startMinute ? session1 : sessionById(2);
}

function endInstantFor(session: TradingSession, now: Date, minute: number): Date {
  const wrapsMidnight = session.startMinute > session.endMinute;
  // Inside the post-midnight tail of a wrapping session the end is today;
  // before midnight it is tomorrow.
  const dayOffset = wrapsMidnight && minute >= session.startMinute ? 1 : 0;
  return istDateAt(now, session.endMinute, dayOffset);
}

function nextStartInstantFor(session: TradingSession, now: Date, minute: number): Date {
  const dayOffset = minute < session.startMinute ? 0 : 1;
  return istDateAt(now, session.startMinute, dayOffset);
}

function minutesBetween(from: Date, to: Date): number {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 60_000));
}

/** Total minutes per IST day during which new positions are allowed. */
export function tradingMinutesPerDay(): number {
  return TRADING_SESSIONS.reduce((total, session) => {
    const span =
      session.startMinute <= session.endMinute
        ? session.endMinute - session.startMinute
        : MINUTES_PER_DAY - session.startMinute + session.endMinute;
    return total + span;
  }, 0);
}
