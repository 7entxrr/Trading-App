import { env } from '@/config/env';
import { apiClient } from '@/services/apiClient';
import type {
  NotificationsService,
  PushPermission,
  PushSubscriptionSummary,
} from '@/services/contracts';

/**
 * Push notification transport, backed by the real Web Push API and the real
 * backend. There is no mock/local variant: `subscribe()` only ever succeeds
 * once the browser grants permission and the backend accepts the subscription.
 *
 * Informational only — see docs/READ_ONLY.md. A push notification tells the
 * operator something happened; it never carries an action to perform.
 */

function currentPermission(): PushPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as PushPermission;
}

export const notificationsService: NotificationsService = {
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    );
  },

  getPermission(): PushPermission {
    return currentPermission();
  },

  async requestPermission(): Promise<PushPermission> {
    if (!this.isSupported()) return 'unsupported';
    if (Notification.permission !== 'default') return Notification.permission as PushPermission;
    return (await Notification.requestPermission()) as PushPermission;
  },

  async subscribe(): Promise<PushSubscriptionSummary> {
    const permission = await this.requestPermission();
    if (permission !== 'granted' || !env.vapidPublicKey) {
      return { subscribed: false, endpoint: null };
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToBuffer(env.vapidPublicKey),
    });

    await apiClient.post('/notifications/subscribe', subscription.toJSON());
    return { subscribed: true, endpoint: subscription.endpoint };
  },

  async unsubscribe(): Promise<PushSubscriptionSummary> {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await apiClient.post('/notifications/unsubscribe', { endpoint: subscription.endpoint });
      await subscription.unsubscribe();
    }
    return { subscribed: false, endpoint: null };
  },

  async getSubscription(): Promise<PushSubscriptionSummary> {
    if (!this.isSupported()) return { subscribed: false, endpoint: null };
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return {
      subscribed: subscription !== null,
      endpoint: subscription?.endpoint ?? null,
    };
  },
};

/** VAPID keys arrive base64url-encoded; PushManager wants raw bytes. */
function urlBase64ToBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let index = 0; index < raw.length; index += 1) {
    view[index] = raw.charCodeAt(index);
  }
  return buffer;
}
