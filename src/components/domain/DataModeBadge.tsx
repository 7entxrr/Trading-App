'use client';

import { Icon } from '@/components/ui/Icon';
import { useSystemStatus } from '@/hooks/useTradingData';
import { env } from '@/config/env';

type Indicator = {
  label: string;
  tone: 'positive' | 'negative' | 'neutral';
  detail: string;
};

/**
 * Resolves the connection indicator from actual backend state.
 *
 * There is no demo/mock mode: this always reflects whether the real backend
 * (and, once reported, the MT5 agent) is reachable. It never shows a
 * permanently-green "connected" — it only goes green once a `/system/status`
 * response has actually come back.
 */
function useIndicator(): Indicator {
  const status = useSystemStatus();

  if (status.isError) {
    return {
      label: 'API OFFLINE',
      tone: 'negative',
      detail: `Cannot reach the trading backend at ${env.apiBaseUrl}.`,
    };
  }

  if (status.isLoading || !status.data) {
    return { label: 'CONNECTING', tone: 'neutral', detail: 'Contacting the trading server…' };
  }

  if (!status.data.apiConnected) {
    return {
      label: 'API OFFLINE',
      tone: 'negative',
      detail: 'The backend reported that it is not connected to the trading infrastructure.',
    };
  }

  if (status.data.mt5AgentConnected === false) {
    return {
      label: 'MT5 OFFLINE',
      tone: 'negative',
      detail: 'The backend is reachable but the MT5 bridge is not reporting.',
    };
  }

  return {
    label: status.data.mt5AgentConnected ? 'MT5 CONNECTED' : 'API CONNECTED',
    tone: 'positive',
    detail: status.data.mt5AgentConnected
      ? 'Backend and MT5 bridge are both reachable.'
      : 'Backend reachable. MT5 bridge status not reported.',
  };
}

/** Compact pill for the top bar. */
export function DataModeBadge() {
  const indicator = useIndicator();

  return (
    <span className={`badge badge--${indicator.tone}`} title={indicator.detail}>
      <span className={`dot${indicator.tone === 'positive' ? ' dot--pulse' : ''}`} />
      {indicator.label}
    </span>
  );
}

/** Full-width notice, shown whenever the connection is not fully live. */
export function DataModeNotice() {
  const indicator = useIndicator();

  if (indicator.tone === 'positive') return null;

  return (
    <div className={`callout callout--${indicator.tone === 'negative' ? 'danger' : 'info'}`}>
      <Icon name={indicator.tone === 'negative' ? 'offline' : 'info'} size={18} />
      <span>
        <strong>{indicator.label}</strong> — {indicator.detail}
      </span>
    </div>
  );
}
