import { NextRequest, NextResponse } from "next/server";
import {
  fetchCoinsMarkets,
  fetchExtraBinanceCoins,
  fetchBinanceSymbols,
  fetchBinance24hTicker,
} from "@/lib/coingecko";
import type { CoinMarket } from "@/types/coin";

export const revalidate = 60;

function binanceTickerToCoinMarket(
  symbol: string,
  ticker: { price: number; change24h: number; volume: number }
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
    high_24h: ticker.price,
    low_24h: ticker.price,
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
  const currency = searchParams.get("currency") || "usd";

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
    if (results[1].status === "fulfilled") extraCoins = results[1].value;
    if (results[2].status === "fulfilled") binanceSymbols = results[2].value;
    if (results[3].status === "fulfilled") binanceTicker = results[3].value;

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

    for (const symbol of binanceOnly) {
      const ticker = binanceTicker.get(symbol);
      if (ticker && ticker.price > 0) {
        const coin = binanceTickerToCoinMarket(symbol, ticker);
        if (!seen.has(coin.id)) {
          seen.add(coin.id);
          merged.push(coin);
        }
      }
    }

    return NextResponse.json(merged);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch coin data", details: message },
      { status: 502 }
    );
  }
}
