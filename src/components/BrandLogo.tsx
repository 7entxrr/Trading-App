import type { BrandKey } from "@/lib/data";
import type { ReactNode } from "react";

/** Simplified brand marks drawn in SVG, so no image requests are needed. */
export function BrandLogo({ brand, size = 32 }: { brand: BrandKey; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0">
      {MARKS[brand]}
    </svg>
  );
}

const MARKS: Record<BrandKey, ReactNode> = {
  shopify: (
    <>
      <circle cx="20" cy="20" r="20" fill="#95BF47" />
      <path d="M16.2 14.2c0-2.3 1.6-4.2 3.8-4.2s3.8 1.9 3.8 4.2" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
      <path fill="#fff" d="M12.6 14.4h14.8l1.3 13.1a1.6 1.6 0 0 1-1.6 1.8H12.9a1.6 1.6 0 0 1-1.6-1.8z" />
      <text x="20" y="26.3" textAnchor="middle" fontSize="11" fontWeight="800" fill="#95BF47" fontFamily="Arial, sans-serif">
        S
      </text>
    </>
  ),
  walmart: (
    <>
      <circle cx="20" cy="20" r="20" fill="#0071CE" />
      <g fill="#FFC220">
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <rect key={a} x="18.4" y="7.5" width="3.2" height="8.6" rx="1.6" transform={`rotate(${a} 20 20)`} />
        ))}
      </g>
    </>
  ),
  adidas: (
    <>
      <circle cx="20" cy="20" r="20" fill="#000" />
      <g fill="#fff">
        <path d="m10.5 21.2 2.6-1.5 1.9 3.3h-3z" />
        <path d="m15 18.6 2.6-1.5 3.4 5.9h-3z" />
        <path d="m19.5 16 2.6-1.5 4.9 8.5h-3z" />
      </g>
      <text x="20" y="28.6" textAnchor="middle" fontSize="6.4" fontWeight="700" fill="#fff" fontFamily="Arial, sans-serif">
        adidas
      </text>
    </>
  ),
  xiaomi: (
    <>
      <circle cx="20" cy="20" r="20" fill="#FF6900" />
      <g fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round">
        <path d="M12.5 25.5V14.5h7.5a3 3 0 0 1 3 3v8" />
        <path d="M17.7 25.5v-6.5" />
        <path d="M27.5 14.5v11" />
      </g>
    </>
  ),
  apple: (
    <>
      <circle cx="20" cy="20" r="20" fill="#111" />
      <path
        fill="#fff"
        d="M24.6 20.9c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.9-.9-3.1-.8a4.6 4.6 0 0 0-3.9 2.4c-1.7 2.9-.4 7.2 1.2 9.6.8 1.1 1.7 2.4 3 2.4 1.2 0 1.6-.8 3.1-.8s1.8.8 3.1.8 2.1-1.2 2.9-2.3c.9-1.3 1.3-2.6 1.3-2.7 0 0-2.6-1-2.7-4.2Zm-2.3-6.9c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.6 2.8-1.4Z"
      />
    </>
  ),
  tesla: (
    <>
      <circle cx="20" cy="20" r="20" fill="#E31937" />
      <path
        fill="#fff"
        d="m20 30 2.3-13c2 0 2.7.2 2.8 2 0 0 1.4-.5 2-1.6-2.5-1.2-5-1.2-5-1.2L20 18.9l-2.1-2.7s-2.5 0-5 1.2c.6 1.1 2 1.6 2 1.6.1-1.8.8-2 2.8-2zm0-16.7c2 0 4.5.3 7 1.4.4-.6.5-1 .5-1-2.8-1.1-5.4-1.5-7.5-1.5s-4.7.4-7.5 1.5c0 0 .1.4.5 1 2.5-1.1 5-1.4 7-1.4z"
      />
    </>
  ),
  nike: (
    <>
      <circle cx="20" cy="20" r="20" fill="#111" />
      <path
        fill="#fff"
        d="M31 15.2 15.6 21.8c-1.3.5-2.4.8-3.3.8-1 0-1.7-.4-2-1.1-.4-1 .1-2.6 1.4-4.4-.8 1.4-1 2.6-.4 3.2.3.3.7.4 1.2.4.4 0 .9-.1 1.4-.2z"
      />
    </>
  ),
  amazon: (
    <>
      <circle cx="20" cy="20" r="20" fill="#232F3E" />
      <text x="20" y="21.5" textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff" fontFamily="Arial, sans-serif">
        a
      </text>
      <path d="M13.5 25.2c4.2 2.5 9 2.5 13 0" fill="none" stroke="#FF9900" strokeWidth={1.8} strokeLinecap="round" />
      <path d="m24.6 24 2.2.9-.4 2.3" fill="none" stroke="#FF9900" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
};
