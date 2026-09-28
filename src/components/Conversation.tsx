"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, SendIcon } from "./icons";
import type { Chat } from "@/lib/data";

export function Conversation({ chat }: { chat: Chat }) {
  const router = useRouter();
  const [messages, setMessages] = useState(chat.messages);
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    const now = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    setMessages((m) => [...m, { from: "me", text: t, time: now }]);
    setText("");
  };

  return (
    <div className="flex h-dvh flex-col bg-white">
      <header className="flex items-center gap-3 border-b border-[#F0F0F0] px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3">
        <button
          aria-label="Back"
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/chat"))}
          className="grid h-10 w-10 place-items-center rounded-full active:bg-black/5"
        >
          <ChevronLeft className="h-6 w-6 text-[#131313]" />
        </button>
        <span className="grid h-10 w-10 place-items-center rounded-full text-[16px] font-bold text-white" style={{ background: chat.color }}>
          {chat.avatar}
        </span>
        <div>
          <p className="text-[16px] font-semibold text-[#131313]">{chat.name}</p>
          <p className="text-[12px] text-[#22B573]">Online</p>
        </div>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto bg-[#F7F8FC] px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[78%] rounded-[18px] px-4 py-2.5 text-[15px] ${
                m.from === "me" ? "rounded-br-[6px] bg-[#2966FF] text-white" : "rounded-bl-[6px] bg-white text-[#131313] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              }`}
            >
              {m.text}
              <span className={`ml-2 text-[11px] ${m.from === "me" ? "text-white/70" : "text-[#A3A3A3]"}`}>{m.time}</span>
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-[#F0F0F0] px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
          className="h-12 flex-1 rounded-full bg-[#F4F6FB] px-4 text-[15px] text-[#131313] outline-none placeholder:text-[#A3A3A3]"
        />
        <button
          aria-label="Send"
          className="grid h-12 w-12 place-items-center rounded-full bg-[#2966FF] text-white transition active:scale-95 disabled:opacity-40"
          disabled={!text.trim()}
        >
          <SendIcon className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
