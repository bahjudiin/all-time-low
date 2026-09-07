import { NextRequest, NextResponse } from "next/server";
import { fetchCoinsMarkets, fetchExtraBinanceCoins } from "@/lib/coingecko";
import { fetchMultiTimeframeExchangeData } from "@/lib/exchange";
import { computeOvervaluedUndervalued, type OvervaluedUndervaluedResult } from "@/lib/overvaluedUndervalued";
import { cachedGet } from "@/lib/cache";
import { sleep } from "@/lib/sleep";
import type { CoinMarket } from "@/types/coin";

export const revalidate = 60;

const MAX_CONCURRENT = 12;
const DELAY_MS = 50;
const MAX_SYMBOLS = 30;

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

async function computeForCoin(
  coin: CoinMarket,
): Promise<OvervaluedUndervaluedResult | null> {
  try {
    const data = await fetchMultiTimeframeExchangeData(coin.id, coin.symbol.toLowerCase());
    if (!data || data.klines1h.length < 50) return null;

    const result = computeOvervaluedUndervalued({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.image,
      currentPrice: coin.current_price,
      klines15m: data.klines15m,
      klines1h: data.klines1h,
      klines4h: data.klines4h,
      fundingRates: data.fundingRate,
      openInterest: data.openInterest,
      longShort: {
        global: data.globalRatio,
        topAccount: data.topRatio,
        topPosition: data.topPositionRatio,
        taker: data.takerRatio,
      },
      liquidationDataAvailable: false,
      futuresVolume24h: coin.total_volume || 0,
    });

    return result;
  } catch (error) {
    console.error("[overvalued-undervalued] Failed to compute for coin:", coin.id, error);
    return null;
  }
}

function rankCoinsForScan(coins: CoinMarket[]): CoinMarket[] {
  return [...coins]
    .filter((c) => c.market_cap > 0)
    .sort((a, b) => {
      const aScore = Math.abs(a.price_change_percentage_24h) + Math.abs(a.ath_change_percentage) / 20;
      const bScore = Math.abs(b.price_change_percentage_24h) + Math.abs(b.ath_change_percentage) / 20;
      return bScore - aScore;
    })
    .slice(0, MAX_SYMBOLS);
}

export async function OPTIONS() {
  return NextResponse.json(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const currency = validateCurrency(searchParams.get("currency"));

  try {
    const data = await cachedGet(`ovu:${currency}`, 20_000, async () => {
      const [mainCoins, extraCoins] = await Promise.allSettled([
        fetchCoinsMarkets(currency, 250, 1),
        fetchExtraBinanceCoins(currency),
      ]);

      const allMain = mainCoins.status === "fulfilled" ? mainCoins.value : [];
      const allExtra = extraCoins.status === "fulfilled" ? extraCoins.value : [];

      if (mainCoins.status === "rejected") {
        console.error("[overvalued-undervalued] fetchCoinsMarkets rejected:", mainCoins.reason);
      }
      if (extraCoins.status === "rejected") {
        console.error("[overvalued-undervalued] fetchExtraBinanceCoins rejected:", extraCoins.reason);
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

      const scanList = rankCoinsForScan(merged);
      const results: OvervaluedUndervaluedResult[] = [];

      for (let i = 0; i < scanList.length; i += MAX_CONCURRENT) {
        const batch = scanList.slice(i, i + MAX_CONCURRENT);
        const batchResults = await Promise.allSettled(batch.map(computeForCoin));
        for (const r of batchResults) {
          if (r.status === "fulfilled" && r.value) results.push(r.value);
        }
        if (i + MAX_CONCURRENT < scanList.length) await sleep(DELAY_MS);
      }

      results.sort((a, b) => b.opportunityScore - a.opportunityScore);
      return results;
    });

    return NextResponse.json(data, {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[overvalued-undervalued] handler error:", { currency, error: message });
    return NextResponse.json(
      { error: "Failed to compute valuation scan", details: message },
      { status: 502, headers: CORS_HEADERS }
    );
  }
}
