/** Illustrated placeholder avatar (man in a cap against a city backdrop). */
export function Avatar({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0 rounded-full">
      <defs>
        <linearGradient id="av-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9d3dc" />
          <stop offset="100%" stopColor="#8e9aa6" />
        </linearGradient>
        <clipPath id="av-clip">
          <circle cx="20" cy="20" r="20" />
        </clipPath>
      </defs>
      <g clipPath="url(#av-clip)">
        <rect width="40" height="40" fill="url(#av-sky)" />
        <rect x="2" y="14" width="6" height="26" fill="#7b8793" />
        <rect x="31" y="10" width="7" height="30" fill="#6e7a86" />
        <path d="M7 40c1-8 6-11 13-11s12 3 13 11z" fill="#3b3a36" />
        <path d="M17 26h6v4l-3 2-3-2z" fill="#c69477" />
        <ellipse cx="20" cy="21" rx="5.2" ry="6" fill="#d4a383" />
        <path d="M14.2 17.4c.4-3.4 2.8-5 5.8-5s5.4 1.6 5.8 5c-3.8-.9-7.8-.9-11.6 0z" fill="#e8e2d6" />
        <rect x="13" y="17" width="14" height="1.6" rx=".8" fill="#d6cfc2" />
      </g>
    </svg>
  );
}
