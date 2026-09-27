'use client';

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { AlertCard } from '@/components/domain/AlertCard';
import { TopBar } from '@/components/layout/TopBar';
import { Chips } from '@/components/ui/Chips';
import { Icon } from '@/components/ui/Icon';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { EmptyState, ErrorState, SkeletonList } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAlerts, useMarkAlertRead, useMarkAllAlertsRead } from '@/hooks/useTradingData';
import {
  ALERT_FILTERS,
  countUnread,
  filterAlerts,
  matchesAlertFilter,
  type AlertFilter,
} from '@/lib/alerts';

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const alerts = useAlerts();
  const markRead = useMarkAlertRead();
  const markAllRead = useMarkAllAlertsRead();

  const [filter, setFilter] = useLocalStorage<AlertFilter>('goldminer.alerts.filter', 'ALL');

  const list = alerts.data ?? [];
  const unread = countUnread(list);

  const visible = useMemo(() => filterAlerts(list, { filter }), [list, filter]);

  const filterOptions = useMemo(
    () =>
      ALERT_FILTERS.map((option) => ({
        ...option,
        count: list.filter((alert) => matchesAlertFilter(alert, option.value)).length,
      })),
    [list],
  );

  return (
    <>
      <TopBar
        title="Alerts"
        subtitle={unread > 0 ? `${unread} unread` : 'All caught up'}
        actions={
          <>
            <button
              type="button"
              className="icon-button"
              onClick={() => queryClient.invalidateQueries()}
              aria-label="Refresh alerts"
            >
              <Icon name="refresh" size={18} />
            </button>
            <button
              type="button"
              className="icon-button"
              disabled={unread === 0 || markAllRead.isPending}
              onClick={() =>
                markAllRead.mutate(undefined, {
                  onSuccess: () => toast.show('All alerts marked as read', 'success'),
                })
              }
              aria-label="Mark all as read"
            >
              <Icon name="check" size={18} />
            </button>
          </>
        }
      />

      <PullToRefresh onRefresh={() => queryClient.invalidateQueries()}>
        <div className="section" style={{ marginTop: 'var(--s-4)' }}>
          <Chips
            options={filterOptions}
            value={filter}
            onChange={setFilter}
            ariaLabel="Filter alerts"
          />
        </div>

        <div className="section">
          {alerts.isError ? (
            <ErrorState
              title="Unable to load alerts"
              message="The notification service did not respond."
              onRetry={() => alerts.refetch()}
            />
          ) : alerts.isLoading ? (
            <SkeletonList count={5} height={88} />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={filter === 'UNREAD' ? 'check' : 'inbox'}
              title={filter === 'UNREAD' ? 'Nothing unread' : 'No alerts'}
              message={
                filter === 'ALL'
                  ? 'Profit, drawdown, EA and copier events will appear here as they happen.'
                  : 'No alert matches this filter.'
              }
              action={
                filter !== 'ALL' ? (
                  <button
                    type="button"
                    className="btn btn--sm btn--ghost"
                    onClick={() => setFilter('ALL')}
                  >
                    Show all alerts
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="card card--flush">
              {visible.map((alert) => (
                <AlertCard key={alert.id} alert={alert} onRead={(id) => markRead.mutate(id)} />
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>
    </>
  );
}
