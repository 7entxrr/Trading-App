import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * There is no mock data mode: `dataProvider` is always the real backend
 * provider. A backend failure must surface as an error — nothing here may
 * fall back to invented numbers.
 */

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function loadProvider() {
  vi.resetModules();
  return (await import('@/services/dataProvider')).dataProvider;
}

describe('dataProvider', () => {
  it('is always the real API provider', async () => {
    const provider = await loadProvider();
    expect(provider.mode).toBe('api');
  });
});

describe('backend failure handling', () => {
  it('rejects when the backend is unreachable instead of returning any data', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);

    const provider = await loadProvider();

    await expect(provider.getAccounts()).rejects.toThrow('Cannot reach the trading backend');
    await expect(provider.getPortfolioPerformance()).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalled();
  });

  it('rejects on a server error status', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ message: 'MT5 agent unavailable' }), { status: 503 }),
        ),
    );

    const provider = await loadProvider();
    await expect(provider.getAccounts()).rejects.toThrow('MT5 agent unavailable');
  });

  it('only ever issues GET (and PATCH for alert read-state) requests', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(async () => new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const provider = await loadProvider();
    await provider.getAccounts();
    await provider.getAccount('acc-1');
    await provider.getTrades();
    await provider.getBaskets();
    await provider.getAlerts();
    await provider.markAlertRead('a1');
    await provider.markAllAlertsRead();
    await provider.getCopierStatus();
    await provider.getSystemStatus();

    const methods = fetchMock.mock.calls.map(([, init]) => (init as RequestInit).method);
    expect(new Set(methods)).toEqual(new Set(['GET', 'PATCH']));
  });
});

describe('read-only guarantee', () => {
  it('exposes no trading or account mutation method on the provider', async () => {
    const provider = await loadProvider();
    const forbidden = [
      'controlAccount',
      'controlAllAccounts',
      'pauseNewTrades',
      'resumeNewTrades',
      'closeAllPositions',
      'modifyPosition',
      'placeOrder',
      'closePosition',
    ];
    for (const name of forbidden) {
      expect((provider as unknown as Record<string, unknown>)[name]).toBeUndefined();
    }
  });

  it('apiClient exposes no delete method', async () => {
    const { apiClient } = await import('@/services/apiClient');
    expect((apiClient as unknown as Record<string, unknown>).delete).toBeUndefined();
  });
});
