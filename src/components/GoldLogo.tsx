/** Round gold coin mark with a stacked gold bar, used wherever a logo appears. */
export function GoldLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id="gold-coin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F7D774" />
          <stop offset="55%" stopColor="#E0A526" />
          <stop offset="100%" stopColor="#C98A12" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="20" fill="url(#gold-coin)" />
      <path d="M13.5 17.5h13l2 5h-17z" fill="#fff" />
      <path d="M9.5 23.5h10l1.6 4.5H7.9z" fill="#fff" opacity={0.92} />
      <path d="M20.5 23.5h10l1.6 4.5H18.9z" fill="#fff" opacity={0.92} />
    </svg>
  );
}
