// Mock data. Replace with real API calls later.

export type BrandKey =
  | "shopify"
  | "walmart"
  | "adidas"
  | "xiaomi"
  | "apple"
  | "tesla"
  | "nike"
  | "amazon";

export type Stock = {
  symbol: string;
  ticker: string;
  name: string;
  brand: BrandKey;
  sector: "Tech" | "Retail" | "Sports" | "Auto";
  /** Current share price */
  price: number;
  /** Today's share price change */
  priceChange: number;
  /** Value of the user's holding */
  holding: number;
  /** Today's change in the holding's value */
  holdingChange: number;
  /** Card background gradient on the home screen */
  gradient: string;
  seed: number;
};

export const user = {
  name: "Andrew G.",
  balance: 23386,
  todayChange: 236.98,
};

export const stocks: Stock[] = [
  {
    symbol: "shop",
    ticker: "SHOP",
    name: "Shopify Inc",
    brand: "shopify",
    sector: "Tech",
    price: 95.38,
    priceChange: 12.18,
    holding: 1085.8,
    holdingChange: 12.98,
    gradient: "linear-gradient(135deg, #e3efcf 0%, #edf4e2 55%, #e9f1dc 100%)",
    seed: 11,
  },
  {
    symbol: "wmt",
    ticker: "WMT",
    name: "Wal-Mart",
    brand: "walmart",
    sector: "Retail",
    price: 68.42,
    priceChange: 1.36,
    holding: 204.13,
    holdingChange: 32.98,
    gradient: "linear-gradient(135deg, #e8f1f9 0%, #dde9f7 55%, #d2e2f6 100%)",
    seed: 23,
  },
  {
    symbol: "ads",
    ticker: "ADS@DE",
    name: "Adidas",
    brand: "adidas",
    sector: "Sports",
    price: 212.6,
    priceChange: -1.12,
    holding: 162.72,
    holdingChange: -1.12,
    gradient: "linear-gradient(135deg, #d4d4d4 0%, #e0e0e0 50%, #ececec 100%)",
    seed: 37,
  },
  {
    symbol: "1810",
    ticker: "1810",
    name: "Xiaomi",
    brand: "xiaomi",
    sector: "Tech",
    price: 4.86,
    priceChange: 0.21,
    holding: 159.89,
    holdingChange: 35.76,
    gradient: "linear-gradient(135deg, #f6eeea 0%, #f7e6dc 55%, #f9dccb 100%)",
    seed: 41,
  },
  {
    symbol: "aapl",
    ticker: "AAPL",
    name: "Apple Inc",
    brand: "apple",
    sector: "Tech",
    price: 227.48,
    priceChange: 3.27,
    holding: 0,
    holdingChange: 0,
    gradient: "linear-gradient(135deg, #ececec 0%, #f5f5f5 100%)",
    seed: 53,
  },
  {
    symbol: "tsla",
    ticker: "TSLA",
    name: "Tesla Inc",
    brand: "tesla",
    sector: "Auto",
    price: 254.22,
    priceChange: -4.83,
    holding: 0,
    holdingChange: 0,
    gradient: "linear-gradient(135deg, #f7e4e4 0%, #f9eeee 100%)",
    seed: 67,
  },
  {
    symbol: "nke",
    ticker: "NKE",
    name: "Nike Inc",
    brand: "nike",
    sector: "Sports",
    price: 88.15,
    priceChange: 0.94,
    holding: 0,
    holdingChange: 0,
    gradient: "linear-gradient(135deg, #ececec 0%, #f5f5f5 100%)",
    seed: 71,
  },
  {
    symbol: "amzn",
    ticker: "AMZN",
    name: "Amazon.com",
    brand: "amazon",
    sector: "Retail",
    price: 186.51,
    priceChange: 2.05,
    holding: 0,
    holdingChange: 0,
    gradient: "linear-gradient(135deg, #fbf0de 0%, #fcf5ea 100%)",
    seed: 83,
  },
];

export const portfolio = stocks.filter((s) => s.holding > 0);

export function getStock(symbol: string) {
  return stocks.find((s) => s.symbol === symbol.toLowerCase());
}

export const notifications = [
  { id: 1, title: "Shopify is up 14.6% today", time: "2m ago", unread: true },
  { id: 2, title: "Deposit of $500.00 completed", time: "1h ago", unread: true },
  { id: 3, title: "Xiaomi reached your target price", time: "Yesterday", unread: false },
];

export type Chat = {
  id: string;
  name: string;
  avatar: string;
  color: string;
  last: string;
  time: string;
  unread: number;
  messages: { from: "me" | "them"; text: string; time: string }[];
};

export const chats: Chat[] = [
  {
    id: "support",
    name: "Support Team",
    avatar: "S",
    color: "#2966FF",
    last: "Your withdrawal is on its way 🚀",
    time: "10:24",
    unread: 2,
    messages: [
      { from: "me", text: "Hi, when will my withdrawal arrive?", time: "10:18" },
      { from: "them", text: "Hi Andrew! Let me check that for you.", time: "10:20" },
      { from: "them", text: "Your withdrawal is on its way 🚀", time: "10:24" },
    ],
  },
  {
    id: "advisor",
    name: "Emma — Advisor",
    avatar: "E",
    color: "#22B573",
    last: "Shopify looks strong this quarter.",
    time: "09:02",
    unread: 0,
    messages: [
      { from: "them", text: "Morning! Did you see the earnings report?", time: "08:55" },
      { from: "me", text: "Yes, looks promising.", time: "08:59" },
      { from: "them", text: "Shopify looks strong this quarter.", time: "09:02" },
    ],
  },
  {
    id: "alerts",
    name: "Price Alerts",
    avatar: "A",
    color: "#FF6900",
    last: "Xiaomi crossed $4.80",
    time: "Yesterday",
    unread: 1,
    messages: [{ from: "them", text: "Xiaomi crossed $4.80", time: "18:40" }],
  },
  {
    id: "community",
    name: "Investors Club",
    avatar: "I",
    color: "#131313",
    last: "Anyone watching Tesla today?",
    time: "Mon",
    unread: 0,
    messages: [{ from: "them", text: "Anyone watching Tesla today?", time: "16:12" }],
  },
];
