import { env } from '@/config/env';
import type { RealtimeEvent, RealtimeService } from '@/services/contracts';

/**
 * Live update transport.
 *
 * Today this is a polling heartbeat: it emits a tick on an interval and the
 * query layer refetches through the service layer via GET requests. A tick
 * never does anything but ask the real backend again — it has no ability to
 * change any trading or account state.
 *
 * Swapping to WebSocket/SSE later means replacing this module only.
 */

function createPollingRealtimeService(): RealtimeService {
  const handlers = new Set<(event: RealtimeEvent) => void>();
  let timer: ReturnType<typeof setInterval> | null = null;

  function emit(): void {
    const event: RealtimeEvent = { type: 'tick', at: new Date().toISOString() };
    handlers.forEach((handler) => handler(event));
  }

  function start(): void {
    if (timer !== null || typeof window === 'undefined') return;
    timer = setInterval(() => {
      // Don't poll a screen nobody is looking at.
      if (document.visibilityState === 'hidden') return;
      emit();
    }, env.pollIntervalMs);
  }

  function stop(): void {
    if (timer === null) return;
    clearInterval(timer);
    timer = null;
  }

  return {
    subscribe(handler) {
      handlers.add(handler);
      start();
      return () => {
        handlers.delete(handler);
        if (handlers.size === 0) stop();
      };
    },
    isConnected: () => timer !== null,
  };
}

function createWebSocketRealtimeService(): RealtimeService {
  const handlers = new Set<(event: RealtimeEvent) => void>();
  let socket: WebSocket | null = null;

  function connect(): void {
    if (socket !== null || typeof window === 'undefined' || !env.realtimeUrl) return;
    socket = new WebSocket(env.realtimeUrl);
    socket.addEventListener('message', () => {
      const event: RealtimeEvent = { type: 'tick', at: new Date().toISOString() };
      handlers.forEach((handler) => handler(event));
    });
    socket.addEventListener('close', () => {
      socket = null;
    });
  }

  return {
    subscribe(handler) {
      handlers.add(handler);
      connect();
      return () => {
        handlers.delete(handler);
        if (handlers.size === 0) {
          socket?.close();
          socket = null;
        }
      };
    },
    isConnected: () => socket?.readyState === WebSocket.OPEN,
  };
}

export const realtimeService: RealtimeService =
  env.realtimeTransport === 'websocket'
    ? createWebSocketRealtimeService()
    : createPollingRealtimeService();
