import { ApiError, networkError, toApiError } from "./errors";

/**
 * Low-level client. The browser only ever talks to this app's own
 * `/api/gm/*` proxy; the GoldMiner token is added server-side.
 * No automatic retries — ever — for mutating requests.
 */

const BASE = "/api/gm";
const READ_TIMEOUT_MS = 12_000;
const WRITE_TIMEOUT_MS = 35_000;

async function parse(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function apiGet<T = unknown>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
  const qs = query
    ? "?" +
      Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&")
    : "";
  let res: Response;
  try {
    res = await fetch(`${BASE}/${path}${qs}`, {
      cache: "no-store",
      credentials: "same-origin",
      signal: AbortSignal.timeout(READ_TIMEOUT_MS),
    });
  } catch {
    throw networkError(false);
  }
  const body = await parse(res);
  if (!res.ok) throw toApiError(res.status, body);
  return body as T;
}

export async function apiMutate<T = unknown>(method: "POST" | "DELETE", path: string, body?: object): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/${path}`, {
      method,
      credentials: "same-origin",
      headers: { "content-type": "application/json", "x-gm-client": "web" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(WRITE_TIMEOUT_MS),
    });
  } catch {
    throw networkError(true);
  }
  const data = await parse(res);
  if (!res.ok) throw toApiError(res.status, data);
  return data as T;
}

export { ApiError };
