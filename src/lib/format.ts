const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function money(value: number) {
  return usd.format(value);
}

/** "$23,386.00" split into ["$23,386", ".00"] for the two-tone balance. */
export function splitMoney(value: number): [string, string] {
  const s = usd.format(value);
  const dot = s.lastIndexOf(".");
  return [s.slice(0, dot), s.slice(dot)];
}
