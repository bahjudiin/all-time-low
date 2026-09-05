import { NextRequest, NextResponse } from "next/server";
import { fetchExchangeData } from "@/lib/exchange";
import { computePrediction } from "@/lib/prediction";
import type { CoinMarket } from "@/types/coin";
import type { CoinPrediction } from "@/types/prediction";

export const revalidate = 60;

const MAX_CONCURRENT = 5;
const DELAY_MS = 150;
const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const TIMEOUT_MS = 20000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchCoinsPage(page: number, perPage: number): Promise<CoinMarket[]> {
  const params = new URLSearchParams({
    vs_currency: "usd",
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
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchLowCapCoins(): Promise<CoinMarket[]> {
  const seen = new Set<string>();
  const lowCaps: CoinMarket[] = [];

  // Fetch pages 1-5 (covers ~1250 coins by market cap)
  // Low caps start around page 3+ (ranks 500+)
  for (let page = 1; page <= 5; page++) {
    const coins = await fetchCoinsPage(page, 250);
    if (coins.length === 0) break;

    for (const coin of coins) {
      if (seen.has(coin.id)) continue;
      seen.add(coin.id);

      // Low cap: market cap < $200M, volume > $3M
      // Also include mid-low caps with very high volume
      const isLowCap = coin.market_cap > 0 && coin.market_cap < 200_000_000 && coin.total_volume > 3_000_000;
      const isHighVolLowCap = coin.market_cap > 0 && coin.market_cap < 500_000_000 && coin.total_volume > 10_000_000;

      if (isLowCap || isHighVolLowCap) {
        lowCaps.push(coin);
      }
    }

    // Delay between pages to respect rate limits
    if (page < 5) await sleep(1000);
  }

  // Sort by volume descending — most active first
  return lowCaps.sort((a, b) => b.total_volume - a.total_volume);
}

async function processPredictions(
  coins: CoinMarket[],
): Promise<CoinPrediction[]> {
  const results: CoinPrediction[] = [];

  for (let i = 0; i < coins.length; i += MAX_CONCURRENT) {
    const batch = coins.slice(i, i + MAX_CONCURRENT);

    const batchResults = await Promise.allSettled(
      batch.map(async (coin) => {
        try {
          const data = await fetchExchangeData(coin.id, coin.symbol.toLowerCase());
          if (!data || data.klines.length < 30) return null;

          const prediction = computePrediction(
            coin.symbol.toUpperCase(),
            coin.name,
            coin.image,
            coin.current_price,
            data.klines,
            data.takerRatio,
            false,
            data.source,
          );

          return prediction;
        } catch {
          return null;
        }
      })
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled" && result.value) {
        results.push(result.value);
      }
    }

    if (i + MAX_CONCURRENT < coins.length) {
      await sleep(DELAY_MS);
    }
  }

  results.sort((a, b) => b.exhaustionProbability - a.exhaustionProbability);

  return results;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const currency = searchParams.get("currency") || "usd";

  try {
    const lowCapCoins = await fetchLowCapCoins();

    if (lowCapCoins.length === 0) {
      return NextResponse.json([]);
    }

    const predictions = await processPredictions(lowCapCoins);

    return NextResponse.json(predictions, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch prediction data", details: message },
      { status: 502 }
    );
  }
}
