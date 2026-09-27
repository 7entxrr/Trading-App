import { env } from '@/config/env';

/**
 * The only place in the app that talks HTTP.
 *
 * UI components never call this directly — they go through a service
 * (`accountsService`, `tradesService`, …) so the transport can change without
 * touching screens.
 *
 * This dashboard is READ-ONLY with respect to trading and account state.
 * `post`/`patch` exist only for non-trading dashboard state (marking an alert
 * read, managing a push-notification subscription) and there is deliberately
 * no `delete`. Nothing in this client, or anywhere upstream of it, may be used
 * to send a trading command — see docs/READ_ONLY.md.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly path: string;

  constructor(message: string, status: number, path: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.path = path;
  }
}

interface RequestOptions {
  signal?: AbortSignal;
  /** Query string parameters; `undefined` values are dropped. */
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const url = buildUrl(path, options.params);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(env.apiKey ? { Authorization: `Bearer ${env.apiKey}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      // Session cookies once the backend adds authentication.
      credentials: 'include',
      signal: options.signal,
    });
  } catch (cause) {
    throw new ApiError(
      cause instanceof Error && cause.name === 'AbortError'
        ? 'Request cancelled'
        : 'Cannot reach the trading backend',
      0,
      path,
    );
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status, path);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const base = env.apiBaseUrl.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) query.set(key, String(value));
  }

  const queryString = query.toString();
  return `${base}${suffix}${queryString ? `?${queryString}` : ''}`;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string; error?: string };
    return payload.message ?? payload.error ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  /** Non-trading dashboard state only (e.g. push subscriptions). */
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
  /** Non-trading dashboard state only (e.g. marking an alert read). */
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),
};
