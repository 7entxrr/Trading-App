// Mock data. Replace with real API calls later.

export const user = {
  name: "Andrew G.",
  balance: 23386,
  todayChange: 236.98,
};

/** The one instrument this app trades: spot gold. */
export const gold = {
  symbol: "XAUUSD",
  pair: "XAU/USD",
  name: "Gold",
  price: 3386.45,
  change: 18.42,
  seed: 11,
};

/** 1 standard lot of gold = 100 troy ounces. */
const OZ_PER_LOT = 100;

export type Position = {
  id: string;
  side: "buy" | "sell";
  lots: number;
  openPrice: number;
  /** Card background gradient on the home screen */
  gradient: string;
};

export const positions: Position[] = [
  {
    id: "48213",
    side: "buy",
    lots: 0.3,
    openPrice: 3350.25,
    gradient: "linear-gradient(135deg, #e3efcf 0%, #edf4e2 55%, #e9f1dc 100%)",
  },
  {
    id: "48220",
    side: "buy",
    lots: 0.1,
    openPrice: 3366.04,
    gradient: "linear-gradient(135deg, #e8f1f9 0%, #dde9f7 55%, #d2e2f6 100%)",
  },
  {
    id: "48231",
    side: "sell",
    lots: 0.05,
    openPrice: 3383.2,
    gradient: "linear-gradient(135deg, #d4d4d4 0%, #e0e0e0 50%, #ececec 100%)",
  },
  {
    id: "48240",
    side: "buy",
    lots: 0.08,
    openPrice: 3366.46,
    gradient: "linear-gradient(135deg, #f6eeea 0%, #f7e6dc 55%, #f9dccb 100%)",
  },
];

/** Price move in the position's favour since it was opened. */
export function positionMove(p: Position, price = gold.price) {
  return (price - p.openPrice) * (p.side === "buy" ? 1 : -1);
}

export function positionPnl(p: Position, price = gold.price) {
  return positionMove(p, price) * p.lots * OZ_PER_LOT;
}

export const closedTrades = [
  { id: "48198", side: "buy", lots: 0.2, open: 3341.1, close: 3362.8, time: "Today, 09:42" },
  { id: "48187", side: "sell", lots: 0.1, open: 3371.5, close: 3358.2, time: "Today, 08:15" },
  { id: "48171", side: "buy", lots: 0.15, open: 3355.9, close: 3349.4, time: "Yesterday" },
  { id: "48160", side: "buy", lots: 0.25, open: 3322.4, close: 3347.6, time: "Yesterday" },
  { id: "48142", side: "sell", lots: 0.1, open: 3339.0, close: 3344.7, time: "Mon" },
  { id: "48133", side: "buy", lots: 0.3, open: 3318.6, close: 3331.9, time: "Mon" },
  { id: "48119", side: "sell", lots: 0.2, open: 3345.2, close: 3329.8, time: "Sep 19" },
  { id: "48104", side: "buy", lots: 0.05, open: 3327.3, close: 3321.1, time: "Sep 18" },
].map((t) => ({
  ...t,
  pnl: (t.close - t.open) * (t.side === "buy" ? 1 : -1) * t.lots * OZ_PER_LOT,
}));

export const notifications = [
  { id: 1, title: "Gold is up 0.55% today", time: "2m ago", unread: true },
  { id: 2, title: "Deposit of $500.00 completed", time: "1h ago", unread: true },
  { id: 3, title: "Gold reached your target $3,380", time: "Yesterday", unread: false },
];

export const transfers = [
  { id: "d-104", kind: "deposit", amount: 500, time: "Today, 07:30" },
  { id: "w-088", kind: "withdraw", amount: 1200, time: "Sep 20" },
  { id: "d-097", kind: "deposit", amount: 2500, time: "Sep 15" },
  { id: "d-091", kind: "deposit", amount: 10000, time: "Sep 01" },
] as const;
