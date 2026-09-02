import type { CoinMarket } from "@/types/coin";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

const TIMEOUT_MS = 15000;

export async function fetchCoinsMarkets(
  currency: string = "usd",
  perPage: number = 100,
  page: number = 1
): Promise<CoinMarket[]> {
  const params = new URLSearchParams({
    vs_currency: currency,
    order: "market_cap_desc",
    per_page: String(perPage),
    page: String(page),
    sparkline: "true",
    price_change_percentage: "24h,7d,30d",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${COINGECKO_BASE}/coins/markets?${params}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`CoinGecko API error: ${res.status}`);
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export function computeDerived(coin: CoinMarket) {
  const pctToATH =
    coin.current_price > 0 ? coin.ath / coin.current_price - 1 : 0;
  const volatilityProxy = coin.price_change_percentage_24h ?? 0;
  return { pctToATH, volatilityProxy };
}
