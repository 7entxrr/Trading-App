import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { apiToken, appPasscode } from "./config";

/**
 * Stateless session cookie: "<expiry>.<hmac>". The HMAC key is derived from the
 * server-side API token, so rotating the token also signs everyone out.
 */

export const SESSION_COOKIE = "gm_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function key() {
  return createHash("sha256").update(`gm-session-key:${apiToken()}`).digest();
}

function sign(exp: number) {
  return createHmac("sha256", key()).update(`gm-session.v1.${exp}`).digest("base64url");
}

export function createSessionValue(now = Date.now()) {
  const exp = Math.floor(now / 1000) + SESSION_MAX_AGE;
  return `${exp}.${sign(exp)}`;
}

export function isValidSession(value: string | undefined, now = Date.now()) {
  if (!value) return false;
  const [expStr, sig] = value.split(".");
  const exp = Number(expStr);
  if (!Number.isInteger(exp) || !sig || exp * 1000 < now) return false;
  return safeEqual(sig, sign(exp));
}

/** Constant-time comparison of the typed passcode with the configured one. */
export function passcodeMatches(input: string) {
  return safeEqual(input, appPasscode());
}

function safeEqual(a: string, b: string) {
  // Hash first so inputs of different lengths still compare in constant time.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/* Simple in-memory brute-force throttle for the login route. */
const attempts = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;

export function loginBlocked(ip: string, now = Date.now()) {
  const a = attempts.get(ip);
  return !!a && a.count >= MAX_ATTEMPTS && a.until > now;
}

export function recordFailedLogin(ip: string, now = Date.now()) {
  const a = attempts.get(ip);
  if (!a || a.until < now) attempts.set(ip, { count: 1, until: now + WINDOW_MS });
  else a.count += 1;
}

export function clearLoginAttempts(ip: string) {
  attempts.delete(ip);
}

/** True only when the request's Origin header matches this site's host. */
export function isSameOrigin(origin: string | null, host: string | null) {
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
