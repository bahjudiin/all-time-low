import { NextRequest, NextResponse } from "next/server";
import { fetchExchangeData } from "@/lib/exchange";
import { computePrediction } from "@/lib/prediction";
import { cachedGet } from "@/lib/cache";
import { sleep } from "@/lib/sleep";
import type { CoinMarket } from "@/types/coin";
import type { CoinPrediction } from "@/types/prediction";

export const revalidate = 60;

const MAX_CONCURRENT = 5;
const DELAY_MS = 150;
const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const TIMEOUT_MS = 20000;

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

async function fetchCoinsPage(page: number, perPage: number, currency: string): Promise<CoinMarket[]> {
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

async function fetchLowCapCoins(currency: string): Promise<CoinMarket[]> {
  const seen = new Set<string>();
  const lowCaps: CoinMarket[] = [];

  const BATCH_SIZE = 3;
  const pages = [1, 2, 3, 4, 5];
  let successfulPages = 0;

  for (let i = 0; i < pages.length; i += BATCH_SIZE) {
    const batch = pages.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((page) => fetchCoinsPage(page, 250, currency))
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      if (result.status === "fulfilled") {
        successfulPages++;
        for (const coin of result.value) {
          if (seen.has(coin.id)) continue;
          seen.add(coin.id);

          const isLowCap = coin.market_cap > 0 && coin.market_cap < 200_000_000 && coin.total_volume > 3_000_000;
          const isHighVolLowCap = coin.market_cap > 0 && coin.market_cap < 500_000_000 && coin.total_volume > 10_000_000;

          if (isLowCap || isHighVolLowCap) {
            lowCaps.push(coin);
          }
        }
      } else {
        console.error("[prediction] fetchCoinsPage failed:", { page: batch[j], error: result.reason });
      }
    }

    if (i + BATCH_SIZE < pages.length) {
      await sleep(200);
    }
  }

  if (successfulPages === 0) {
    throw new Error("All CoinGecko pages failed");
  }

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
        const data = await fetchExchangeData(coin.id, coin.symbol.toLowerCase());
        if (!data || data.klines.length < 30) return null;

        return computePrediction(
          coin.symbol.toUpperCase(),
          coin.name,
          coin.image,
          coin.current_price,
          data.klines,
          data.takerRatio,
          false,
          data.source,
        );
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

export async function OPTIONS() {
  return NextResponse.json(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const currency = validateCurrency(searchParams.get("currency"));

  try {
    const data = await cachedGet(`prediction:${currency}`, 60_000, async () => {
      const lowCapCoins = await fetchLowCapCoins(currency);
      if (lowCapCoins.length === 0) return [];
      return processPredictions(lowCapCoins);
    });

    return NextResponse.json(data, {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[prediction] handler error:", { currency, error: message });
    return NextResponse.json(
      { error: "Failed to fetch prediction data", details: message },
      { status: 502, headers: CORS_HEADERS }
    );
  }
}
