const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const smallCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 4,
  maximumFractionDigits: 8,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatUSD(n: number): string {
  if (n < 0.01) return smallCurrencyFormatter.format(n);
  return currencyFormatter.format(n);
}

export function formatCompact(n: number): string {
  return compactFormatter.format(n);
}

export function formatPercent(n: number): string {
  const signed = n >= 0 ? `+${(n / 100).toFixed(1)}%` : `${(n / 100).toFixed(1)}%`;
  return signed;
}

export function formatPercentValue(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function athColor(pct: number): string {
  const normalized = Math.min(Math.abs(pct) / 100, 1);
  const h = 0;
  const s = Math.round(80 - normalized * 50);
  const l = Math.round(50 - normalized * 25);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function atlColor(pct: number): string {
  const normalized = Math.min(Math.abs(pct) / 200, 1);
  const h = 140;
  const s = Math.round(80 - normalized * 50);
  const l = Math.round(50 - normalized * 20);
  return `hsl(${h}, ${s}%, ${l}%)`;
}
