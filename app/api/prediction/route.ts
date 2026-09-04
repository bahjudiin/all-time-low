import { NextRequest, NextResponse } from "next/server";
import { fetchCoinsMarkets, fetchExtraBinanceCoins } from "@/lib/coingecko";
import { fetchExchangeData } from "@/lib/exchange";
import { computePrediction } from "@/lib/prediction";
import type { CoinMarket } from "@/types/coin";
import type { CoinPrediction } from "@/types/prediction";

export const revalidate = 60;

const MAX_CONCURRENT = 5;
const DELAY_MS = 150;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  // Sort by exhaustion probability descending
  results.sort((a, b) => b.exhaustionProbability - a.exhaustionProbability);

  return results;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const currency = searchParams.get("currency") || "usd";

  try {
    const [mainCoins, extraCoins] = await Promise.allSettled([
      fetchCoinsMarkets(currency, 250, 1),
      fetchExtraBinanceCoins(currency),
    ]);

    const allMain = mainCoins.status === "fulfilled" ? mainCoins.value : [];
    const allExtra = extraCoins.status === "fulfilled" ? extraCoins.value : [];

    const seen = new Set<string>();
    const merged: CoinMarket[] = [];

    for (const coin of [...allMain, ...allExtra]) {
      if (!seen.has(coin.id)) {
        seen.add(coin.id);
        merged.push(coin);
      }
    }

    const top50 = merged
      .filter((c) => c.market_cap > 0 && c.total_volume > 1_000_000)
      .sort((a, b) => b.market_cap - a.market_cap)
      .slice(0, 50);

    const predictions = await processPredictions(top50);

    return NextResponse.json(predictions);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch prediction data", details: message },
      { status: 502 }
    );
  }
}
