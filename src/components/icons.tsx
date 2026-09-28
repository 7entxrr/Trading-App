import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

export function BellIcon(p: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12 2.5a1.5 1.5 0 0 1 1.5 1.5v.6A6.5 6.5 0 0 1 18.5 11v3.3l1.4 2.3a1 1 0 0 1-.86 1.5H4.96a1 1 0 0 1-.86-1.5l1.4-2.3V11a6.5 6.5 0 0 1 5-6.4V4A1.5 1.5 0 0 1 12 2.5Z" />
      <path d="M9.5 19.2h5a2.5 2.5 0 0 1-5 0Z" />
    </svg>
  );
}

export function ChevronRight(p: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m9.5 6 6 6-6 6" />
    </svg>
  );
}

export function ChevronDown(p: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m6 9.5 6 6 6-6" />
    </svg>
  );
}

/** Filled circle with an up/down caret, as next to every change figure. */
export function TrendDot({ up, className }: { up: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <circle cx="10" cy="10" r="10" fill={up ? "#22B573" : "#E5484D"} />
      <path
        d={up ? "m6.4 11.6 3.6-3.6 3.6 3.6" : "m6.4 8.4 3.6 3.6 3.6-3.6"}
        fill="none"
        stroke="#fff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlusSquare(p: P) {
  return (
    <svg viewBox="0 0 24 24" {...p}>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#fff" />
      <path d="M12 7.5v9M7.5 12h9" stroke="#2966FF" strokeWidth={2.2} strokeLinecap="round" />
    </svg>
  );
}

export function UploadSquare(p: P) {
  return (
    <svg viewBox="0 0 24 24" {...p}>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#fff" />
      <path
        d="M12 14.5V7m0 0-3 3m3-3 3 3M7.5 14.5v1.8c0 .66.54 1.2 1.2 1.2h6.6c.66 0 1.2-.54 1.2-1.2v-1.8"
        fill="none"
        stroke="#131313"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CoinsIcon(p: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v4c0 1.66 3.13 3 7 3s7-1.34 7-3V6" />
      <path d="M5 10v4c0 1.66 3.13 3 7 3s7-1.34 7-3v-4" />
      <path d="M5 14v4c0 1.66 3.13 3 7 3s7-1.34 7-3v-4" />
    </svg>
  );
}

/* Bottom navigation icons (filled, rounded, as in the design). */

export function HomeIcon(p: P) {
  return (
    <svg viewBox="0 0 24 24" {...p}>
      <path
        fill="currentColor"
        d="M10.1 3.3a3 3 0 0 1 3.8 0l6 4.9A3 3 0 0 1 21 10.5V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-7.5a3 3 0 0 1 1.1-2.3z"
      />
      <path d="M12 14.2v2.8" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function BagIcon(p: P) {
  return (
    <svg viewBox="0 0 24 24" {...p}>
      <path
        d="M8.5 8.5V7a3.5 3.5 0 0 1 7 0v1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        fill="currentColor"
        d="M5.6 8.2A2 2 0 0 1 7.6 6.5h8.8a2 2 0 0 1 2 1.7l1.4 10.2A2.3 2.3 0 0 1 17.5 21h-11a2.3 2.3 0 0 1-2.3-2.6z"
      />
      <path d="M9 10.5a3 3 0 0 0 6 0" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

export function AnalyticsIcon(p: P) {
  return (
    <svg viewBox="0 0 24 24" {...p}>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" />
      <path
        d="m7.5 15 3-3.5 2.5 2 3.5-4.5"
        fill="none"
        stroke="#fff"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HistoryIcon(p: P) {
  return (
    <svg viewBox="0 0 24 24" {...p}>
      <circle cx="12" cy="12" r="9.5" fill="currentColor" />
      <path d="M12 7.5V12l3 2" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
