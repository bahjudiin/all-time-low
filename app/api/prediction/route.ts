import { NextRequest, NextResponse } from "next/server";
import { fetchExchangeData } from "@/lib/exchange";
import { computePrediction } from "@/lib/prediction";
import type { CoinMarket } from "@/types/coin";
import type { CoinPrediction } from "@/types/prediction";

export const revalidate = 60;

const MAX_CONCURRENT = 5;
const DELAY_MS = 150;
const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const TIMEOUT_MS = 15000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchLowCapCoins(): Promise<CoinMarket[]> {
  const allCoins: CoinMarket[] = [];
  const seen = new Set<string>();

  for (let page = 3; page <= 20; page++) {
    const params = new URLSearchParams({
      vs_currency: "usd",
      order: "market_cap_desc",
      per_page: "250",
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

      if (!res.ok) break;

      const coins: CoinMarket[] = await res.json();
      if (coins.length === 0) break;

      for (const coin of coins) {
        if (seen.has(coin.id)) continue;
        seen.add(coin.id);

        if (
          coin.market_cap > 0 &&
          coin.market_cap < 200_000_000 &&
          coin.total_volume > 5_000_000
        ) {
          allCoins.push(coin);
        }
      }
    } catch {
      break;
    } finally {
      clearTimeout(timeout);
    }

    await sleep(300);
  }

  return allCoins.sort((a, b) => b.total_volume - a.total_volume);
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
    const predictions = await processPredictions(lowCapCoins);

    return NextResponse.json(predictions);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch prediction data", details: message },
      { status: 502 }
    );
  }
}
