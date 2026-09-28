"use client";

import { useState } from "react";
import { Avatar } from "./Avatar";
import { Change } from "./Change";
import { BellIcon, ChevronRight, PlusSquare, UploadSquare } from "./icons";
import { Sheet, useToast } from "./Sheet";
import { money, splitMoney } from "@/lib/format";
import { notifications, user } from "@/lib/data";

type Panel = "deposit" | "withdraw" | "notifications" | null;

/** Dark header: profile, balance, today's change and the two action buttons. */
export function HomeTop() {
  const [panel, setPanel] = useState<Panel>(null);
  const [balance, setBalance] = useState(user.balance);
  const [unread, setUnread] = useState(notifications.some((n) => n.unread));
  const [toast, showToast] = useToast();
  const [whole, cents] = splitMoney(balance);
  const close = () => setPanel(null);

  return (
    <header className="px-6 pt-[max(20px,env(safe-area-inset-top))] pb-9 text-white">
      <div className="flex h-12 items-center justify-between">
        <button className="flex items-center gap-3 active:opacity-70">
          <Avatar size={40} />
          <span className="text-[15px] font-medium">{user.name}</span>
          <ChevronRight className="h-4 w-4 text-[#7A7A7A]" />
        </button>
        <button
          aria-label="Notifications"
          className="relative grid h-10 w-10 place-items-center rounded-full active:bg-white/10"
          onClick={() => {
            setPanel("notifications");
            setUnread(false);
          }}
        >
          <BellIcon className="h-6 w-6" />
          {unread && <span className="absolute top-[6px] right-[6px] h-[10px] w-[10px] rounded-full bg-[#F04438]" />}
        </button>
      </div>

      <div className="mt-9 text-center">
        <p className="text-[42px] leading-none font-bold tracking-[-0.01em]">
          {whole}
          <span className="text-[#4A4A4A]">{cents}</span>
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Change value={user.todayChange} colored className="text-[15px]" />
          <span className="rounded-full bg-[#232323] px-3 py-1 text-[13px] font-medium text-[#D6D6D6]">Today</span>
        </div>
      </div>

      <div className="mt-9 grid grid-cols-2 gap-3">
        <button
          onClick={() => setPanel("deposit")}
          className="flex h-[54px] items-center justify-center gap-3 rounded-[16px] bg-[#2966FF] text-[16px] font-semibold transition active:scale-[0.97] active:bg-[#1f57e6]"
        >
          <PlusSquare className="h-6 w-6" />
          Deposit
        </button>
        <button
          onClick={() => setPanel("withdraw")}
          className="flex h-[54px] items-center justify-center gap-3 rounded-[16px] bg-[#232323] text-[16px] font-semibold transition active:scale-[0.97] active:bg-[#2c2c2c]"
        >
          <UploadSquare className="h-6 w-6" />
          Withdraw
        </button>
      </div>

      <Sheet open={panel === "notifications"} onClose={close} title="Notifications">
        <ul className="divide-y divide-[#F0F0F0] text-[#131313]">
          {notifications.map((n) => (
            <li key={n.id} className="flex items-start gap-3 py-3">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.unread ? "bg-[#2966FF]" : "bg-[#E0E0E0]"}`} />
              <div className="flex-1">
                <p className="text-[15px] font-medium">{n.title}</p>
                <p className="mt-0.5 text-[13px] text-[#9A9A9A]">{n.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </Sheet>

      <AmountSheet
        kind="deposit"
        open={panel === "deposit"}
        onClose={close}
        onConfirm={(v) => {
          setBalance((b) => b + v);
          showToast(`Deposited ${money(v)}`);
          close();
        }}
      />
      <AmountSheet
        kind="withdraw"
        open={panel === "withdraw"}
        max={balance}
        onClose={close}
        onConfirm={(v) => {
          setBalance((b) => b - v);
          showToast(`Withdrew ${money(v)}`);
          close();
        }}
      />
      {toast}
    </header>
  );
}

const QUICK = [100, 250, 500, 1000];

function AmountSheet({
  kind,
  open,
  onClose,
  onConfirm,
  max,
}: {
  kind: "deposit" | "withdraw";
  open: boolean;
  onClose: () => void;
  onConfirm: (v: number) => void;
  max?: number;
}) {
  const [value, setValue] = useState("");
  const amount = Number(value) || 0;
  const valid = amount > 0 && (max === undefined || amount <= max);
  const deposit = kind === "deposit";

  return (
    <Sheet
      open={open}
      onClose={() => {
        setValue("");
        onClose();
      }}
      title={deposit ? "Deposit" : "Withdraw"}
    >
      <label className="block rounded-[16px] bg-[#F4F6FB] px-4 py-3 text-[#131313]">
        <span className="text-[13px] text-[#8B8B8B]">Amount (USD)</span>
        <div className="flex items-center text-[28px] font-bold">
          $
          <input
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0.00"
            className="w-full bg-transparent pl-1 outline-none placeholder:text-[#C4C4C4]"
          />
        </div>
      </label>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            onClick={() => setValue(String(q))}
            className="h-10 rounded-full border border-[#E3E3E3] text-[14px] font-medium text-[#131313] active:scale-95"
          >
            ${q}
          </button>
        ))}
      </div>
      {max !== undefined && <p className="mt-3 text-[13px] text-[#8B8B8B]">Available: {money(max)}</p>}
      <button
        disabled={!valid}
        onClick={() => {
          onConfirm(amount);
          setValue("");
        }}
        className={`mt-5 h-[54px] w-full rounded-[16px] text-[16px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-40 ${deposit ? "bg-[#2966FF]" : "bg-[#131313]"}`}
      >
        {deposit ? "Deposit" : "Withdraw"} {valid ? money(amount) : ""}
      </button>
    </Sheet>
  );
}
