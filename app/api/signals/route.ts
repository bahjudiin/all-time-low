import { NextRequest, NextResponse } from "next/server";
import { fetchCoinsMarkets, fetchExtraBinanceCoins } from "@/lib/coingecko";
import { fetchExchangeData } from "@/lib/exchange";
import { computeSignals } from "@/lib/signals";
import type { CoinMarket } from "@/types/coin";
import type { CoinSignals } from "@/types/signal";

export const revalidate = 60;

const MAX_CONCURRENT = 5;
const DELAY_MS = 150;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processCoinsWithSignals(
  coins: CoinMarket[],
): Promise<(CoinMarket & { signals?: CoinSignals; exchangeSource?: string })[]> {
  const results: (CoinMarket & { signals?: CoinSignals; exchangeSource?: string })[] = [];

  for (let i = 0; i < coins.length; i += MAX_CONCURRENT) {
    const batch = coins.slice(i, i + MAX_CONCURRENT);

    const batchResults = await Promise.allSettled(
      batch.map(async (coin) => {
        try {
          const data = await fetchExchangeData(coin.id, coin.symbol.toLowerCase());
          if (!data || data.klines.length < 30) {
            return { coin, signals: undefined, source: undefined };
          }

          const closes = data.klines.map((k) => k.close);
          const signals = computeSignals(
            closes,
            data.klines,
            data.fundingRate,
            data.openInterest,
            {
              global: data.globalRatio,
              topAccount: data.topRatio,
              topPosition: data.topPositionRatio,
              taker: data.takerRatio,
            },
            {
              currentPrice: coin.current_price,
              ath: coin.ath,
              athChangePercentage: coin.ath_change_percentage,
              athDate: coin.ath_date,
              atl: coin.atl,
              atlChangePercentage: coin.atl_change_percentage,
              atlDate: coin.atl_date,
            },
          );

          return { coin, signals, source: data.source };
        } catch {
          return { coin, signals: undefined, source: undefined };
        }
      })
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push({
          ...result.value.coin,
          signals: result.value.signals,
          exchangeSource: result.value.source,
        });
      }
    }

    if (i + MAX_CONCURRENT < coins.length) {
      await sleep(DELAY_MS);
    }
  }

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
      .filter((c) => c.market_cap > 0)
      .sort((a, b) => b.market_cap - a.market_cap)
      .slice(0, 50);

    const withSignals = await processCoinsWithSignals(top50);

    return NextResponse.json(withSignals);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch signal data", details: message },
      { status: 502 }
    );
  }
}
