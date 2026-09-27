'use client';

import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';

import { useCurrency } from '@/hooks/usePreferences';
import { formatPnl } from '@/lib/format';
import { formatIstTime } from '@/lib/time';
import type { CurrencyCode, PerformancePoint } from '@/types/domain';

interface PerformanceChartProps {
  /**
   * Today's cumulative portfolio P/L, supplied by `performanceService`.
   * This component renders exactly what it is given: it never generates,
   * randomises, extrapolates or back-fills points.
   */
  data: PerformancePoint[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const currency = useCurrency();

  const closing = data.at(-1)?.pnl ?? 0;
  const stroke = closing >= 0 ? 'var(--positive)' : 'var(--negative)';

  const values = data.map((point) => point.pnl);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const padding = Math.max(400, (max - min) * 0.15);

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="performance-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="timestamp"
            tickFormatter={(value: string) => formatIstTime(value)}
            tick={{ fill: 'var(--text-faint)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            minTickGap={44}
          />
          <YAxis hide domain={[min - padding, max + padding]} />
          <ReferenceLine y={0} stroke="var(--border-strong)" strokeDasharray="3 3" />
          <Tooltip
            content={<PerformanceTooltip currency={currency} />}
            cursor={{ stroke: 'var(--border-strong)' }}
          />
          <Area
            type="monotone"
            dataKey="pnl"
            stroke={stroke}
            strokeWidth={2}
            fill="url(#performance-fill)"
            isAnimationActive={false}
            activeDot={{ r: 3.5, strokeWidth: 0, fill: stroke }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function PerformanceTooltip({
  active,
  payload,
  label,
  currency,
}: TooltipProps<number, string> & { currency: CurrencyCode }) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;

  return (
    <div className="chart__tooltip">
      <div className="chart__tooltip-time">{formatIstTime(String(label))} IST</div>
      <div
        className="num"
        style={{ fontWeight: 650, color: value >= 0 ? 'var(--positive)' : 'var(--negative)' }}
      >
        {formatPnl(value, { currency })}
      </div>
    </div>
  );
}
