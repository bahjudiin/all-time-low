import { NextRequest, NextResponse } from "next/server";
import { fetchCoinsMarkets, fetchExtraBinanceCoins } from "@/lib/coingecko";
import { fetchExchangeData } from "@/lib/exchange";
import { computeSignals } from "@/lib/signals";
import { cachedGet } from "@/lib/cache";
import { sleep } from "@/lib/sleep";
import type { CoinMarket } from "@/types/coin";
import type { CoinSignals } from "@/types/signal";

export const revalidate = 60;

const MAX_CONCURRENT = 12;
const DELAY_MS = 50;

const VALID_CURRENCIES = new Set(["usd", "eur", "gbp", "jpy", "aud", "cad", "chf", "cny", "krw", "inr", "brl", "rub", "try", "zar"]);
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function validateCurrency(raw: string | null): string {
  if (raw && VALID_CURRENCIES.has(raw.toLowerCase())) return raw.toLowerCase();
  return "usd";
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
      } else {
        console.error("[signals] batch item rejected:", result.reason);
      }
    }

    if (i + MAX_CONCURRENT < coins.length) {
      await sleep(DELAY_MS);
    }
  }

  return results;
}

function isRelevantCoin(coin: CoinMarket): boolean {
  if (coin.ath_change_percentage >= -15 && coin.ath_change_percentage < 0) return true;
  if (coin.atl_change_percentage <= 15 && coin.atl_change_percentage > 0) return true;
  if (coin.ath_change_percentage >= 0) return true;
  if (Math.abs(coin.price_change_percentage_24h) > 5) return true;
  if (coin.ath_change_percentage <= -70) return true;
  return false;
}

export async function OPTIONS() {
  return NextResponse.json(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const currency = validateCurrency(searchParams.get("currency"));

  try {
    const data = await cachedGet(`signals:${currency}`, 20_000, async () => {
      const [mainCoins, extraCoins] = await Promise.allSettled([
        fetchCoinsMarkets(currency, 250, 1),
        fetchExtraBinanceCoins(currency),
      ]);

      const allMain = mainCoins.status === "fulfilled" ? mainCoins.value : [];
      const allExtra = extraCoins.status === "fulfilled" ? extraCoins.value : [];

      if (mainCoins.status === "rejected") {
        console.error("[signals] fetchCoinsMarkets rejected:", mainCoins.reason);
      }
      if (extraCoins.status === "rejected") {
        console.error("[signals] fetchExtraBinanceCoins rejected:", extraCoins.reason);
      }

      if (mainCoins.status === "rejected" && extraCoins.status === "rejected") {
        throw new Error("All upstream fetches failed");
      }

      const seen = new Set<string>();
      const merged: CoinMarket[] = [];

      for (const coin of [...allMain, ...allExtra]) {
        if (!seen.has(coin.id)) {
          seen.add(coin.id);
          merged.push(coin);
        }
      }

      const relevant = merged
        .filter((c) => c.market_cap > 0 && isRelevantCoin(c))
        .sort((a, b) => {
          const aNearATH = a.ath_change_percentage >= -15 && a.ath_change_percentage < 0 ? 1 : 0;
          const bNearATH = b.ath_change_percentage >= -15 && b.ath_change_percentage < 0 ? 1 : 0;
          if (aNearATH !== bNearATH) return bNearATH - aNearATH;

          const aAboveATH = a.ath_change_percentage >= 0 ? 1 : 0;
          const bAboveATH = b.ath_change_percentage >= 0 ? 1 : 0;
          if (aAboveATH !== bAboveATH) return bAboveATH - aAboveATH;

          const aNearATL = a.atl_change_percentage <= 15 && a.atl_change_percentage > 0 ? 1 : 0;
          const bNearATL = b.atl_change_percentage <= 15 && b.atl_change_percentage > 0 ? 1 : 0;
          if (aNearATL !== bNearATL) return bNearATL - aNearATL;

          return Math.abs(b.price_change_percentage_24h) - Math.abs(a.price_change_percentage_24h);
        });

      const withSignals = await processCoinsWithSignals(relevant);

      return withSignals.filter((c) => {
        if (!c.signals) return false;
        return c.signals.direction !== "wait";
      });
    });

    return NextResponse.json(data, {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[signals] handler error:", { currency, error: message });
    return NextResponse.json(
      { error: "Failed to fetch signal data", details: message },
      { status: 502, headers: CORS_HEADERS }
    );
  }
}
