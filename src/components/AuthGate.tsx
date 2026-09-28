"use client";

import { useEffect, useState, type ReactNode } from "react";
import { GoldLogo } from "./GoldLogo";
import { LiveDataProvider } from "@/lib/api/live";

type Status = "checking" | "locked" | "unlocked" | "unconfigured";

/**
 * Keeps the app locked until the user enters the app passcode. The passcode is
 * checked server-side, which then sets an httpOnly session cookie. The GoldMiner
 * API token itself is never typed here and never reaches the browser.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    fetch("/api/session", { cache: "no-store" })
      .then(async (r) => {
        const b = await r.json().catch(() => ({}));
        setStatus(b.configured === false ? "unconfigured" : b.unlocked ? "unlocked" : "locked");
      })
      .catch(() => setStatus("locked"));
  }, []);

  if (status === "unlocked") return <LiveDataProvider>{children}</LiveDataProvider>;
  if (status === "checking") return <div className="min-h-dvh bg-[#131313]" />;
  return <Unlock unconfigured={status === "unconfigured"} onUnlocked={() => setStatus("unlocked")} />;
}

function Unlock({ unconfigured, onUnlocked }: { unconfigured: boolean; onUnlocked: () => void }) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy || !passcode) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const b = await r.json().catch(() => ({}));
      if (r.ok && b.unlocked) {
        setPasscode("");
        onUnlocked();
      } else setError(b?.error?.message ?? "Unable to unlock");
    } catch {
      setError("Unable to connect");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#131313] px-6 pt-[max(64px,env(safe-area-inset-top))] text-white">
      <div className="flex flex-col items-center text-center">
        <GoldLogo size={64} />
        <h1 className="mt-5 text-[26px] font-bold">GoldMiner</h1>
        <p className="mt-1 text-[15px] text-[#9A9A9A]">Enter your app passcode to continue</p>
      </div>
      {unconfigured ? (
        <p className="mt-10 rounded-[16px] bg-[#232323] p-4 text-center text-[14px] text-[#D6D6D6]">
          The server is not configured yet. Set GOLDMINER_API_TOKEN and GOLDMINER_APP_PASSCODE on the server.
        </p>
      ) : (
        <form
          className="mt-10"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <input
            type="password"
            autoComplete="current-password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Passcode"
            className="h-[54px] w-full rounded-[16px] bg-[#232323] px-4 text-[16px] text-white outline-none placeholder:text-[#6B6B6B] focus:ring-2 focus:ring-[#2966FF]"
          />
          {error && <p className="mt-3 text-[14px] text-[#F26B70]">{error}</p>}
          <button
            disabled={busy || !passcode}
            className="mt-4 h-[54px] w-full rounded-[16px] bg-[#2966FF] text-[16px] font-semibold transition active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? "Unlocking…" : "Unlock"}
          </button>
        </form>
      )}
    </div>
  );
}
