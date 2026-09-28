"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnalyticsIcon, BagIcon, HistoryIcon, HomeIcon } from "./icons";

const items = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/market", label: "Market", Icon: BagIcon },
  { href: "/analytics", label: "Analytics", Icon: AnalyticsIcon },
  { href: "/history", label: "History", Icon: HistoryIcon },
] as const;

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[430px] border-t border-[#F0F0F0] bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="flex h-[76px] items-center justify-around px-2">
        {items.map(({ href, label, Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center gap-1.5 transition-colors active:scale-95 ${active ? "text-[#2966FF]" : "text-[#A2A2A2]"}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-[26px] w-[26px]" />
                <span className="text-[13px] font-medium">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
