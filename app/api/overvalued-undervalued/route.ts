import { NextRequest, NextResponse } from "next/server";
import { fetchCoinsMarkets, fetchExtraBinanceCoins } from "@/lib/coingecko";
import { COINGECKO_TO_BINANCE, fetchBinanceMultiTimeframeData } from "@/lib/binance";
import { computeOvervaluedUndervalued, type OvervaluedUndervaluedResult } from "@/lib/overvaluedUndervalued";
import type { CoinMarket } from "@/types/coin";

export const revalidate = 60;

const MAX_CONCURRENT = 5;
const DELAY_MS = 150;
const MAX_SYMBOLS = 40;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tryDynamicSymbol(symbol: string): string | null {
  const upper = symbol.toUpperCase();
  if (upper.length >= 2 && upper.length <= 10) {
    return `${upper}USDT`;
  }
  return null;
}

async function resolveFuturesSymbol(coingeckoId: string, symbol: string): Promise<string | null> {
  const mapped = COINGECKO_TO_BINANCE[coingeckoId] || COINGECKO_TO_BINANCE[symbol];
  if (mapped) return mapped;
  return tryDynamicSymbol(symbol);
}

async function computeForCoin(
  coin: CoinMarket,
): Promise<OvervaluedUndervaluedResult | null> {
  const symbol = await resolveFuturesSymbol(coin.id, coin.symbol.toLowerCase());
  if (!symbol) return null;
  try {
    const data = await fetchBinanceMultiTimeframeData(symbol);
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
  } catch {
    return null;
  }
}

function rankCoinsForScan(coins: CoinMarket[]): CoinMarket[] {
  // Prioritize coins with the biggest 24h moves and strongest deviation potential
  return [...coins]
    .filter((c) => c.market_cap > 0)
    .sort((a, b) => {
      const aScore = Math.abs(a.price_change_percentage_24h) + Math.abs(a.ath_change_percentage) / 20;
      const bScore = Math.abs(b.price_change_percentage_24h) + Math.abs(b.ath_change_percentage) / 20;
      return bScore - aScore;
    })
    .slice(0, MAX_SYMBOLS);
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

    // Sort by opportunity score first, then by valuation severity
    results.sort((a, b) => b.opportunityScore - a.opportunityScore);

    return NextResponse.json(results, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to compute valuation scan", details: message },
      { status: 502 }
    );
  }
}