"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const noop = () => () => {};
/** True only in the browser, after hydration. */
function useIsClient() {
  return useSyncExternalStore(noop, () => true, () => false);
}

/** Bottom sheet that slides up over the current screen. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const isClient = useIsClient();
  if (!isClient) return null;

  // Portal to <body> so the sheet always sits above the bottom nav, even when
  // the current screen has its own stacking context (e.g. the fade-in animation).
  return createPortal(
    <div
      className={`fixed inset-0 z-50 mx-auto max-w-[430px] transition-[visibility] ${open ? "visible" : "invisible delay-300"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute inset-x-0 bottom-0 max-h-[90dvh] overflow-y-auto overscroll-contain rounded-t-[28px] bg-white px-5 pt-3 pb-[max(24px,env(safe-area-inset-bottom))] transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)] ${open ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#E7E7E7]" />
        {title && <h2 className="mb-4 text-[20px] font-bold text-[#131313]">{title}</h2>}
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Small toast shown above the bottom of the screen. */
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const isClient = useIsClient();
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2200);
    return () => clearTimeout(t);
  }, [msg]);

  const node = isClient
    ? createPortal(
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-28 z-[60] mx-auto flex max-w-[430px] justify-center px-5 transition-all duration-300 ${msg ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
      role="status"
    >
      <div className="rounded-2xl bg-[#131313] px-4 py-3 text-[14px] font-medium text-white shadow-lg">{msg}</div>
    </div>,
        document.body,
      )
    : null;
  return [node, setMsg] as const;
}
