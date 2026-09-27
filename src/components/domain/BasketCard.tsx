'use client';

import { useState } from 'react';

import { TradeRow } from '@/components/domain/TradeCard';
import { Icon } from '@/components/ui/Icon';
import { useCurrency } from '@/hooks/usePreferences';
import { formatLots, formatPnl, formatPoints, formatPrice, pnlDirection } from '@/lib/format';
import { basketProgressToTarget } from '@/lib/trades';
import { formatRelativeTime } from '@/lib/time';
import type { Basket, Trade } from '@/types/domain';

interface BasketCardProps {
  basket: Basket;
  /** Positions belonging to this basket, revealed when the card is expanded. */
  trades: Trade[];
  currentPrice: number;
}

/**
 * A GoldMiner basket: several grid positions sharing one take-profit.
 * BUY and SELL baskets can be open at the same time on a hedging account, so
 * these always render as independent cards.
 */
export function BasketCard({ basket, trades, currentPrice }: BasketCardProps) {
  const [expanded, setExpanded] = useState(false);
  const currency = useCurrency();
  const isBuy = basket.direction === 'BUY';
  const progress = basketProgressToTarget(basket, currentPrice);
  const tone = isBuy ? 'var(--positive)' : 'var(--negative)';

  return (
    <div className="basket">
      <button
        type="button"
        className="basket__head"
        onClick={() => setExpanded((previous) => !previous)}
        aria-expanded={expanded}
      >
        <span className="basket__direction" style={{ color: tone }}>
          <Icon name={isBuy ? 'trend-up' : 'trend-down'} size={16} strokeWidth={2.2} />
          {basket.direction} BASKET
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className={`metric__value metric__value--sm pnl--${pnlDirection(basket.pnl)}`}
          >
            {formatPnl(basket.pnl, { currency })}
          </span>
          <Icon
            name="chevron-down"
            size={16}
            style={{
              color: 'var(--text-faint)',
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 220ms var(--ease)',
            }}
          />
        </span>
      </button>

      <div className="basket__grid">
        <Figure label="Positions" value={String(basket.positionCount)} />
        <Figure label="Total lots" value={formatLots(basket.totalLots)} />
        <Figure label="Avg entry" value={formatPrice(basket.averageEntry)} />
        {/* The backend owns the basket TP; show a gap rather than guessing one. */}
        <Figure
          label="Basket TP"
          value={basket.basketTP === null ? 'Not set' : formatPrice(basket.basketTP)}
        />
        <Figure
          label="To target"
          value={basket.pointsToTarget === null ? '—' : formatPoints(basket.pointsToTarget)}
        />
        <Figure label="Opened" value={formatRelativeTime(basket.openedAt)} />
      </div>

      {progress !== null && (
        <div
          className="basket__progress"
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${basket.direction} basket progress to take-profit`}
        >
          <div
            className="basket__progress-fill"
            style={{ width: `${Math.max(2, progress * 100)}%`, background: tone }}
          />
        </div>
      )}

      {expanded && (
        <div className="basket__positions">
          {trades.map((trade) => (
            <TradeRow key={trade.id} trade={trade} showAccount={false} />
          ))}
        </div>
      )}
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="trade-card__price-label">{label}</div>
      <div className="trade-card__price-value">{value}</div>
    </div>
  );
}

/** Portfolio-level BUY/SELL basket tally shown on Home. */
export function BasketSummary({ buy, sell }: { buy: number; sell: number }) {
  return (
    <div className="row" style={{ gap: 8 }}>
      <span className="badge badge--positive">
        <Icon name="trend-up" size={12} strokeWidth={2.2} />
        {buy} BUY
      </span>
      <span className="badge badge--negative">
        <Icon name="trend-down" size={12} strokeWidth={2.2} />
        {sell} SELL
      </span>
    </div>
  );
}
