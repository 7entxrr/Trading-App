import { type NextRequest, NextResponse } from "next/server";
import { apiBaseUrl, apiToken, ConfigError, tradingEnabled } from "@/server/config";
import { MAX_BODY_BYTES, matchRule } from "@/server/endpoints";
import { isSameOrigin, isValidSession, SESSION_COOKIE } from "@/server/session";

/**
 * Server-side proxy: browser → /api/gm/<path> → GoldMiner API.
 *
 * - The Bearer token is added here from server env and never leaves the server.
 * - Only allowlisted endpoints/methods are forwarded (see server/endpoints.ts).
 * - Requests are never retried. If a mutating request's outcome is unknown
 *   (timeout / connection lost) we say so, so the client can check
 *   /api/commands and /api/positions instead of sending it again.
 * - Nothing here logs headers, tokens or request bodies.
 */

export const dynamic = "force-dynamic";

const READ_TIMEOUT_MS = 10_000;
const WRITE_TIMEOUT_MS = 30_000;

function error(status: number, code: string, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: { code, message, ...extra } }, { status, headers: { "cache-control": "no-store" } });
}

async function handle(req: NextRequest, ctx: RouteContext<"/api/gm/[...path]">) {
  const { path: parts } = await ctx.params;
  const path = parts.join("/");
  const method = req.method;

  if (!isValidSession(req.cookies.get(SESSION_COOKIE)?.value)) {
    return error(401, "APP_LOCKED", "Please unlock the app first.");
  }

  const rule = matchRule(method, path);
  if (!rule) return error(404, "NOT_ALLOWED", "This endpoint is not available in the app.");

  const mutating = method !== "GET";
  let body: string | undefined;

  if (mutating && !tradingEnabled()) {
    return error(403, "TRADING_DISABLED", "Trading actions are disabled on this server.");
  }

  if (mutating) {
    // CSRF: only accept writes from this site's own pages.
    if (!isSameOrigin(req.headers.get("origin"), req.headers.get("host"))) {
      return error(403, "BAD_ORIGIN", "Request blocked.");
    }
    if (req.headers.get("x-gm-client") !== "web") return error(403, "BAD_CLIENT", "Request blocked.");

    body = await req.text();
    if (body.length > MAX_BODY_BYTES) return error(413, "TOO_LARGE", "Request too large.");
    if (body) {
      try {
        JSON.parse(body);
      } catch {
        return error(400, "BAD_JSON", "Invalid request body.");
      }
    }
    if (rule.requiresRequestId) {
      const parsed = body ? JSON.parse(body) : null;
      if (!parsed || typeof parsed.request_id !== "string" || !parsed.request_id) {
        return error(400, "MISSING_REQUEST_ID", "Missing request_id.");
      }
    }
  }

  let token: string;
  try {
    token = apiToken();
  } catch (e) {
    if (e instanceof ConfigError) return error(500, "NOT_CONFIGURED", "Server is not configured.");
    throw e;
  }

  const url = `${apiBaseUrl()}/${path}${method === "GET" ? req.nextUrl.search : ""}`;
  const headers: Record<string, string> = { accept: "application/json" };
  if (path !== "health") headers.authorization = `Bearer ${token}`;
  if (body) headers["content-type"] = "application/json";

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method,
      headers,
      body: body || undefined,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(mutating ? WRITE_TIMEOUT_MS : READ_TIMEOUT_MS),
    });
  } catch {
    // Reads: plain connectivity failure. Writes: the request may or may not
    // have reached MT5, so the outcome is unknown — do NOT retry blindly.
    return mutating
      ? error(504, "OUTCOME_UNKNOWN", "Connection lost before the server confirmed. Check commands and positions before retrying.", {
          uncertain: true,
        })
      : error(503, "UNREACHABLE", "Unable to connect to trading server.");
  }

  const text = await upstream.text();
  const contentType = upstream.headers.get("content-type") ?? "";
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "content-type": contentType.includes("json") ? contentType : "application/json",
      "cache-control": "no-store",
    },
  });
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
