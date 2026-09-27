import type { TradingSession } from '@/types/domain';

/**
 * Live GoldMiner EA configuration, mirrored here for display only.
 *
 * The dashboard never writes these values — the EA on the MT5 terminal owns
 * them. Keep this file in sync with the deployed EA preset so the System
 * Information panel does not lie about what the strategy is doing.
 */
export const goldminer = {
  eaName: 'GoldMiner',
  symbol: 'XAUUSD.c',
  magicNumber: 222111,
  hedgeMagicNumber: 111112,

  startLot: 0.01,
  lotMultiplier: 1.7,
  maxLot: 1.28,
  gridStepPoints: 800,
  takeProfitPoints: 150,

  /** No hard stop-loss is configured on the live preset right now. */
  stopLoss: null as number | null,

  dailyTargetEnabled: false,
  ddGuardEnabled: false,
  smartHedgeEnabled: false,
  workingWindowEnabled: true,

  /** Hedging account: BUY and SELL baskets can be open at the same time. */
  hedgingAccount: true,
} as const;

/**
 * IST trading windows during which the EA may open NEW positions.
 * Outside these windows existing positions keep running and TP stays active —
 * nothing is force-closed.
 */
export const TRADING_SESSIONS: TradingSession[] = [
  { id: 1, label: '04:00 – 17:30', startMinute: 4 * 60, endMinute: 17 * 60 + 30 },
  { id: 2, label: '20:00 – 02:30', startMinute: 20 * 60, endMinute: 2 * 60 + 30 },
];

/** Point size for XAUUSD on the current broker (5-digit gold quotes). */
export const SYMBOL_POINT = 0.01;
