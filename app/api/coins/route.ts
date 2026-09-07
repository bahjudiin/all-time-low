import { NextRequest, NextResponse } from "next/server";
import {
  fetchCoinsMarkets,
  fetchExtraBinanceCoins,
  fetchBinanceSymbols,
  fetchBinance24hTicker,
} from "@/lib/coingecko";
import type { CoinMarket } from "@/types/coin";

export const revalidate = 60;

const VALID_CURRENCIES = new Set(["usd", "eur", "gbp", "jpy", "aud", "cad", "chf", "cny", "krw", "inr", "brl", "rub", "try", "zar"]);
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function validateCurrency(raw: string | null): string {
  if (raw && VALID_CURRENCIES.has(raw.toLowerCase())) return raw.toLowerCase();
  return "usd";
}

async function fetchJsonWithRetry<T>(url: string, init?: RequestInit, retries = 2): Promise<T | null> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(15000) });
      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`HTTP ${res.status}`);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
        return null;
      }
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }
  console.error("[api/coins] fetchJsonWithRetry failed", { url, error: lastError?.message });
  return null;
}

function binanceTickerToCoinMarket(
  symbol: string,
  ticker: { price: number; change24h: number; volume: number; high?: number; low?: number }
): CoinMarket {
  return {
    id: symbol,
    symbol,
    name: symbol.toUpperCase(),
    image: `https://assets.coincap.io/assets/icons/${symbol}@2x.png`,
    current_price: ticker.price,
    market_cap: 0,
    market_cap_rank: null,
    fully_diluted_valuation: null,
    total_volume: ticker.volume,
    high_24h: ticker.high ?? ticker.price,
    low_24h: ticker.low ?? ticker.price,
    price_change_24h: 0,
    price_change_percentage_24h: ticker.change24h,
    market_cap_change_24h: 0,
    market_cap_change_percentage_24h: 0,
    circulating_supply: 0,
    total_supply: null,
    max_supply: null,
    ath: ticker.price,
    ath_change_percentage: 0,
    ath_date: new Date().toISOString(),
    atl: ticker.price,
    atl_change_percentage: 0,
    atl_date: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    sparkline_in_7d: { price: [] },
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const currency = validateCurrency(searchParams.get("currency"));

  try {
    let mainCoins: CoinMarket[] = [];
    let extraCoins: CoinMarket[] = [];
    let binanceSymbols: string[] = [];
    let binanceTicker = new Map<string, { price: number; change24h: number; volume: number }>();

    const results = await Promise.allSettled([
      fetchCoinsMarkets(currency, 250, 1),
      fetchExtraBinanceCoins(currency),
      fetchBinanceSymbols(),
      fetchBinance24hTicker(),
    ]);

    if (results[0].status === "fulfilled") mainCoins = results[0].value;
    else console.error("[api/coins] fetchCoinsMarkets failed", results[0].reason);
    if (results[1].status === "fulfilled") extraCoins = results[1].value;
    else console.error("[api/coins] fetchExtraBinanceCoins failed", results[1].reason);
    if (results[2].status === "fulfilled") binanceSymbols = results[2].value;
    else console.error("[api/coins] fetchBinanceSymbols failed", results[2].reason);
    if (results[3].status === "fulfilled") binanceTicker = results[3].value;
    else console.error("[api/coins] fetchBinance24hTicker failed", results[3].reason);

    if (results.every((r) => r.status === "rejected")) {
      throw new Error("All upstream fetches failed");
    }

    const seen = new Set(mainCoins.map((c) => c.id));
    const merged = [...mainCoins];

    for (const coin of extraCoins) {
      if (!seen.has(coin.id)) {
        seen.add(coin.id);
        merged.push(coin);
      }
    }

    const coingeckoSymbols = new Set(merged.map((c) => c.symbol.toLowerCase()));
    const binanceOnly = binanceSymbols.filter((s) => !coingeckoSymbols.has(s));

    let binanceTickerRaw: { symbol: string; highPrice: string; lowPrice: string }[] | null = null;
    if (binanceOnly.length > 0) {
      binanceTickerRaw = await fetchJsonWithRetry<{ symbol: string; highPrice: string; lowPrice: string }[]>(
        "https://api.binance.com/api/v3/ticker/24hr"
      );
    }
    const highLowMap = new Map<string, { high: number; low: number }>();
    if (binanceTickerRaw) {
      for (const t of binanceTickerRaw) {
        const base = t.symbol.replace("USDT", "").toLowerCase();
        highLowMap.set(base, { high: parseFloat(t.highPrice), low: parseFloat(t.lowPrice) });
      }
    }

    for (const symbol of binanceOnly) {
      const ticker = binanceTicker.get(symbol);
      if (ticker && ticker.price > 0) {
        const hl = highLowMap.get(symbol);
        const coin = binanceTickerToCoinMarket(symbol, {
          ...ticker,
          high: hl?.high,
          low: hl?.low,
        });
        if (!seen.has(coin.id)) {
          seen.add(coin.id);
          merged.push(coin);
        }
      }
    }

    return NextResponse.json(merged, {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/coins] handler error", { currency, error: message });
    return NextResponse.json(
      { error: "Failed to fetch coin data", details: message },
      { status: 502, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
