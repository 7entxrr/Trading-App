import type { Metadata } from "next";
import Link from "next/link";
import { chats } from "@/lib/data";

export const metadata: Metadata = { title: "Chat" };

export default function ChatPage() {
  return (
    <div className="screen-in px-5 pt-[max(24px,env(safe-area-inset-top))] pb-6">
      <h1 className="text-[28px] font-bold text-[#131313]">Chat</h1>
      <ul className="mt-4">
        {chats.map((c) => (
          <li key={c.id}>
            <Link href={`/chat/${c.id}`} className="flex items-center gap-3 rounded-[16px] py-3 active:bg-[#F7F7F7]">
              <span
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-[18px] font-bold text-white"
                style={{ background: c.color }}
              >
                {c.avatar}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[15px] font-semibold text-[#131313]">{c.name}</p>
                  <span className="shrink-0 text-[12px] text-[#A3A3A3]">{c.time}</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="truncate text-[14px] text-[#8B8B8B]">{c.last}</p>
                  {c.unread > 0 && (
                    <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-[#2966FF] px-1.5 text-[11px] font-semibold text-white">
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
