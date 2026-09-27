'use client';

import { useState } from 'react';

import { Icon } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { useCurrency } from '@/hooks/usePreferences';
import {
  formatLots,
  formatLogin,
  formatPnl,
  formatPoints,
  formatPrice,
  pnlDirection,
} from '@/lib/format';
import { pointsToTakeProfit } from '@/lib/trades';
import { formatIstDateTime, formatRelativeTime } from '@/lib/time';
import type { Trade } from '@/types/domain';

interface TradeRowProps {
  trade: Trade;
  showAccount?: boolean;
}

/**
 * One open position as a card row. Deliberately not a table: on a phone a
 * 10-column MT5 grid is unreadable.
 */
export function TradeRow({ trade, showAccount = true }: TradeRowProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const currency = useCurrency();
  const isBuy = trade.direction === 'BUY';
  const directionColour = isBuy ? 'var(--positive)' : 'var(--negative)';
  const toTarget = pointsToTakeProfit(trade);

  return (
    <>
      <button type="button" className="trade-card" onClick={() => setDetailOpen(true)}>
        <div className="trade-card__top">
          <div style={{ minWidth: 0 }}>
            <div className="trade-card__symbol">
              {trade.symbol}
              <span
                className="badge"
                style={{
                  color: directionColour,
                  background: isBuy ? 'var(--positive-dim)' : 'var(--negative-dim)',
                  borderColor: isBuy ? 'var(--positive-border)' : 'var(--negative-border)',
                }}
              >
                {trade.direction} {formatLots(trade.lot)}
              </span>
            </div>
            <div className="trade-card__meta truncate">
              {showAccount && <>{formatLogin(trade.accountNumber)} · </>}
              {formatRelativeTime(trade.openTime)}
              {toTarget !== null && <> · {formatPoints(Math.abs(toTarget))} to TP</>}
            </div>
          </div>
          <span className={`metric__value metric__value--sm pnl--${pnlDirection(trade.pnl)}`}>
            {formatPnl(trade.pnl, { currency })}
          </span>
        </div>

        <div className="trade-card__prices">
          <PriceCell label="Entry" value={formatPrice(trade.entryPrice)} />
          <PriceCell label="Current" value={formatPrice(trade.currentPrice)} />
          <PriceCell
            label="Take profit"
            value={trade.tp === null ? '—' : formatPrice(trade.tp)}
          />
        </div>
      </button>

      <Sheet
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={`${trade.symbol} · ${trade.direction} ${formatLots(trade.lot)}`}
        actions={
          <button type="button" className="btn btn--block btn--ghost" onClick={() => setDetailOpen(false)}>
            Close
          </button>
        }
      >
        <div className="rows" style={{ marginTop: 4 }}>
          <DetailRow label="Account" value={formatLogin(trade.accountNumber)} />
          <DetailRow label="Ticket" value={String(trade.ticket)} mono />
          <DetailRow label="Entry price" value={formatPrice(trade.entryPrice)} />
          <DetailRow label="Current price" value={formatPrice(trade.currentPrice)} />
          <DetailRow
            label="Take profit"
            value={trade.tp === null ? 'Basket TP not set' : formatPrice(trade.tp)}
          />
          <DetailRow
            label="Stop loss"
            value={trade.sl === null ? 'None (grid strategy)' : formatPrice(trade.sl)}
          />
          <DetailRow
            label="Floating P/L"
            value={formatPnl(trade.pnl, { currency })}
            tone={pnlDirection(trade.pnl)}
          />
          <DetailRow label="Swap" value={formatPnl(trade.swap, { currency, decimals: 2 })} />
          <DetailRow label="Commission" value={formatPnl(trade.commission, { currency, decimals: 2 })} />
          <DetailRow label="Opened" value={`${formatIstDateTime(trade.openTime)} IST`} />
          <DetailRow label="Magic number" value={String(trade.magic)} mono />
          <DetailRow label="Comment" value={trade.comment || '—'} />
        </div>
      </Sheet>
    </>
  );
}

function PriceCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="trade-card__price-label">{label}</div>
      <div className="trade-card__price-value">{value}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: 'up' | 'down' | 'flat';
}) {
  return (
    <div className="rows__item">
      <span className="rows__label">{label}</span>
      <span className={`rows__value${mono ? ' mono' : ''}${tone ? ` pnl--${tone}` : ''}`}>
        {value}
      </span>
    </div>
  );
}

/** Zero-state used by the trades screen and account detail. */
export function NoTradesHint({ label }: { label: string }) {
  return (
    <div className="row" style={{ gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
      <Icon name="info" size={15} />
      {label}
    </div>
  );
}
