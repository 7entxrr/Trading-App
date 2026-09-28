import { type NextRequest, NextResponse } from "next/server";
import { ConfigError } from "@/server/config";
import {
  clearLoginAttempts,
  createSessionValue,
  isSameOrigin,
  isValidSession,
  loginBlocked,
  passcodeMatches,
  recordFailedLogin,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/server/session";

/** App unlock: GET = status, POST = unlock with passcode, DELETE = lock. */

export const dynamic = "force-dynamic";

function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({ unlocked: isValidSession(req.cookies.get(SESSION_COOKIE)?.value) });
  } catch (e) {
    if (e instanceof ConfigError) return NextResponse.json({ unlocked: false, configured: false }, { status: 500 });
    throw e;
  }
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req.headers.get("origin"), req.headers.get("host"))) {
    return NextResponse.json({ error: { code: "BAD_ORIGIN", message: "Request blocked." } }, { status: 403 });
  }
  const ip = clientIp(req);
  if (loginBlocked(ip)) {
    return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Too many attempts. Try again later." } }, { status: 429 });
  }

  let passcode = "";
  try {
    const body = await req.json();
    passcode = typeof body?.passcode === "string" ? body.passcode : "";
  } catch {
    /* fall through with empty passcode */
  }

  try {
    if (!passcode || !passcodeMatches(passcode)) {
      recordFailedLogin(ip);
      return NextResponse.json({ error: { code: "WRONG_PASSCODE", message: "Incorrect passcode." } }, { status: 401 });
    }
    clearLoginAttempts(ip);
    const res = NextResponse.json({ unlocked: true });
    res.cookies.set(SESSION_COOKIE, createSessionValue(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  } catch (e) {
    if (e instanceof ConfigError) {
      return NextResponse.json({ error: { code: "NOT_CONFIGURED", message: "Server is not configured." } }, { status: 500 });
    }
    throw e;
  }
}

export async function DELETE() {
  const res = NextResponse.json({ unlocked: false });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
