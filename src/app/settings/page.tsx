'use client';

import { useEffect, useState } from 'react';

import { TopBar } from '@/components/layout/TopBar';
import { Icon } from '@/components/ui/Icon';
import { SettingRow, Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';
import { DataModeNotice } from '@/components/domain/DataModeBadge';
import { env } from '@/config/env';
import { goldminer } from '@/config/goldminer';
import { useMounted } from '@/hooks/useMounted';
import { usePreferences } from '@/hooks/usePreferences';
import { useAccounts, useSystemStatus } from '@/hooks/useTradingData';
import { notificationsService } from '@/services/notificationsService';
import { realtimeService } from '@/services/realtimeService';
import type { PushPermission } from '@/services/contracts';
import type { CurrencyCode } from '@/types/domain';
import { formatIstTime } from '@/lib/time';

const CURRENCIES: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP'];

export default function SettingsPage() {
  const { preferences, setPreference, setNotificationPreference } = usePreferences();
  const toast = useToast();
  const mounted = useMounted();
  const accounts = useAccounts();
  const system = useSystemStatus();

  const [permission, setPermission] = useState<PushPermission>('default');
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    setPermission(notificationsService.getPermission());
    void notificationsService.getSubscription();
  }, []);

  async function togglePush(next: boolean) {
    setPushBusy(true);
    try {
      const result = next
        ? await notificationsService.subscribe()
        : await notificationsService.unsubscribe();

      setPermission(notificationsService.getPermission());
      setNotificationPreference('pushEnabled', result.subscribed);

      if (next && !result.subscribed) {
        toast.show('Notification permission was not granted', 'error');
      } else {
        toast.show(result.subscribed ? 'Push notifications enabled' : 'Push notifications off', 'success');
      }
    } finally {
      setPushBusy(false);
    }
  }

  const notifications = preferences.notifications;
  const pushSupported = mounted && notificationsService.isSupported();

  return (
    <>
      <TopBar title="Settings" subtitle="Preferences and system status" />

      <Section title="Account">
        <div className="card card--flush">
          <div className="rows">
            <LinkRow icon="user" label="Profile" value="Raj · Operator" />
            <LinkRow icon="lock" label="Security" value="Backend auth pending" />
          </div>
        </div>
        <Note>
          Broker credentials are never stored in this app. MT5 logins and passwords live only on the
          trading server, behind the backend API.
        </Note>
      </Section>

      <Section title="Notifications">
        <div className="card card--flush">
          <div className="rows">
            <div className="rows__item">
              <div
                className="rows__label"
                style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}
              >
                <span style={{ color: 'var(--text)', fontWeight: 550 }}>Push notifications</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {!pushSupported
                    ? 'Not supported in this browser'
                    : permission === 'denied'
                      ? 'Blocked in browser settings'
                      : 'Delivered by the backend push service'}
                </span>
              </div>
              <Switch
                checked={notifications.pushEnabled}
                onChange={togglePush}
                label="Push notifications"
                disabled={!pushSupported || permission === 'denied' || pushBusy}
              />
            </div>

            <SettingRow
              label="Profit alerts"
              description="Basket closed in profit"
              checked={notifications.profitAlerts}
              onChange={(value) => setNotificationPreference('profitAlerts', value)}
            />
            <SettingRow
              label="Drawdown alerts"
              description="Floating loss beyond threshold"
              checked={notifications.drawdownAlerts}
              onChange={(value) => setNotificationPreference('drawdownAlerts', value)}
            />
            <SettingRow
              label="EA offline alerts"
              description="GoldMiner stops reporting"
              checked={notifications.eaOfflineAlerts}
              onChange={(value) => setNotificationPreference('eaOfflineAlerts', value)}
            />
            <SettingRow
              label="MT5 offline alerts"
              description="Terminal loses connection"
              checked={notifications.mt5OfflineAlerts}
              onChange={(value) => setNotificationPreference('mt5OfflineAlerts', value)}
            />
            <SettingRow
              label="Basket alerts"
              description="Basket opened or closed"
              checked={notifications.basketAlerts}
              onChange={(value) => setNotificationPreference('basketAlerts', value)}
            />
            <SettingRow
              label="Lot increase alerts"
              description="Grid adds a larger position"
              checked={notifications.lotIncreaseAlerts}
              onChange={(value) => setNotificationPreference('lotIncreaseAlerts', value)}
            />
            <SettingRow
              label="Trading window alerts"
              description="New trades paused or resumed"
              checked={notifications.tradingWindowAlerts}
              onChange={(value) => setNotificationPreference('tradingWindowAlerts', value)}
            />
            <SettingRow
              label="System alerts"
              description="Copier and infrastructure errors"
              checked={notifications.systemAlerts}
              onChange={(value) => setNotificationPreference('systemAlerts', value)}
            />
          </div>
        </div>
      </Section>

      <Section title="Trading">
        <div className="card card--flush">
          <div className="rows">
            <div className="rows__item">
              <span className="rows__label">Display currency</span>
              <select
                className="select"
                value={preferences.currency}
                onChange={(event) => setPreference('currency', event.target.value as CurrencyCode)}
                aria-label="Display currency"
              >
                {CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
            <ValueRow label="Timezone" value={`${env.tradingTimezone} (IST)`} />
            <SettingRow
              label="Show trading window"
              description="Display the IST session card on Home"
              checked={preferences.showTradingWindow}
              onChange={(value) => setPreference('showTradingWindow', value)}
            />
          </div>
        </div>
        <Note>
          Trading window logic always uses IST regardless of this device&apos;s timezone. Currency
          conversion is display-only; accounts settle in their broker currency.
        </Note>
      </Section>

      <Section title="Strategy">
        <div className="card card--flush">
          <div className="rows">
            <ValueRow label="EA" value={goldminer.eaName} />
            <ValueRow label="Symbol" value={goldminer.symbol} />
            <ValueRow label="Magic number" value={String(goldminer.magicNumber)} />
            <ValueRow label="Hedge magic" value={String(goldminer.hedgeMagicNumber)} />
            <ValueRow label="Start lot" value={String(goldminer.startLot)} />
            <ValueRow label="Lot multiplier" value={`×${goldminer.lotMultiplier}`} />
            <ValueRow label="Max lot" value={String(goldminer.maxLot)} />
            <ValueRow label="Grid step" value={`${goldminer.gridStepPoints} points`} />
            <ValueRow label="Take profit" value={`${goldminer.takeProfitPoints} points`} />
            <ValueRow label="Stop loss" value={goldminer.stopLoss === null ? 'None' : String(goldminer.stopLoss)} />
            <FlagRow label="Daily target" enabled={goldminer.dailyTargetEnabled} />
            <FlagRow label="DD Guard" enabled={goldminer.ddGuardEnabled} />
            <FlagRow label="SmartHedge" enabled={goldminer.smartHedgeEnabled} />
            <FlagRow label="Working window" enabled={goldminer.workingWindowEnabled} />
          </div>
        </div>
        <Note>
          Read-only mirror of the deployed EA preset. Changing these values requires editing the EA
          inputs on the MT5 terminal.
        </Note>
      </Section>

      <Section title="System">
        <div className="card card--flush">
          <div className="rows">
            <ValueRow label="API base URL" value={env.apiBaseUrl} />
            <ValueRow
              label="Backend"
              value={
                system.isError
                  ? 'Unreachable'
                  : system.isLoading
                    ? 'Connecting…'
                    : system.data?.apiConnected
                      ? 'Connected'
                      : 'Reported offline'
              }
              tone={system.data?.apiConnected ? 'positive' : 'warning'}
            />
            <ValueRow
              label="MT5 bridge"
              value={
                system.data?.mt5AgentConnected === null || system.data === undefined
                  ? 'Not reported'
                  : system.data.mt5AgentConnected
                    ? 'Connected'
                    : 'Disconnected'
              }
            />
            <ValueRow
              label="Refresh interval"
              value={
                env.realtimeTransport === 'polling'
                  ? `Polling every ${Math.round(env.pollIntervalMs / 1000)}s`
                  : realtimeService.isConnected()
                    ? 'WebSocket connected'
                    : 'WebSocket disconnected'
              }
            />
            <ValueRow
              label="Accounts loaded"
              value={accounts.data ? String(accounts.data.length) : '—'}
            />
            <ValueRow
              label="Last sync"
              value={
                mounted && accounts.dataUpdatedAt
                  ? `${formatIstTime(new Date(accounts.dataUpdatedAt))} IST`
                  : '—'
              }
            />
            <ValueRow label="App version" value={env.appVersion} />
          </div>
        </div>
        <div style={{ marginTop: 'var(--s-3)' }}>
          <DataModeNotice />
        </div>
        <Note>
          Read-only monitoring only. This dashboard has no capability to open, close, modify, or
          otherwise act on any position, order, or account setting.
        </Note>
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="section">
      <div className="section__head">
        <h2 className="section__title">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.45 }}>
      {children}
    </p>
  );
}

function ValueRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'positive' | 'warning';
}) {
  return (
    <div className="rows__item">
      <span className="rows__label">{label}</span>
      <span
        className="rows__value"
        style={
          tone === 'positive'
            ? { color: 'var(--positive)' }
            : tone === 'warning'
              ? { color: 'var(--warning)' }
              : undefined
        }
      >
        {value}
      </span>
    </div>
  );
}

/** EA feature flags render as ON/OFF so a disabled guard never looks active. */
function FlagRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="rows__item">
      <span className="rows__label">{label}</span>
      <span className={`badge badge--${enabled ? 'positive' : 'neutral'}`}>
        <span className="dot" />
        {enabled ? 'ON' : 'OFF'}
      </span>
    </div>
  );
}

function LinkRow({ icon, label, value }: { icon: 'user' | 'lock'; label: string; value: string }) {
  return (
    <div className="rows__item">
      <span className="rows__label">
        <Icon name={icon} size={16} style={{ color: 'var(--text-muted)' }} />
        {label}
      </span>
      <span className="rows__value rows__value--muted">{value}</span>
    </div>
  );
}
