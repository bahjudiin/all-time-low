import type { BinanceKline, BinanceFundingRate, BinanceOpenInterest, BinanceLongShortRatio } from "@/types/signal";
import { COINGECKO_TO_BINANCE, fetchBinanceData } from "./binance";
import { COINGECKO_TO_OKX, fetchOKXData } from "./okx";
import { COINGECKO_TO_BYBIT, fetchBybitData } from "./bybit";

export interface ExchangeData {
  klines: BinanceKline[];
  fundingRate: BinanceFundingRate[];
  openInterest: BinanceOpenInterest | null;
  globalRatio: BinanceLongShortRatio[];
  topRatio: BinanceLongShortRatio[];
  topPositionRatio: BinanceLongShortRatio[];
  takerRatio: BinanceLongShortRatio[];
  source: "binance" | "okx" | "bybit";
}

function hasEnoughData(data: ExchangeData): boolean {
  return data.klines.length >= 30;
}

async function tryBinance(coingeckoId: string, symbol: string): Promise<ExchangeData | null> {
  const binanceSymbol = COINGECKO_TO_BINANCE[coingeckoId] || COINGECKO_TO_BINANCE[symbol];
  if (!binanceSymbol) return null;
  try {
    const data = await fetchBinanceData(binanceSymbol);
    const result: ExchangeData = { ...data, source: "binance" };
    return hasEnoughData(result) ? result : null;
  } catch {
    return null;
  }
}

async function tryOKX(coingeckoId: string, symbol: string): Promise<ExchangeData | null> {
  const okxSymbol = COINGECKO_TO_OKX[coingeckoId] || COINGECKO_TO_OKX[symbol];
  if (!okxSymbol) return null;
  try {
    const data = await fetchOKXData(okxSymbol);
    const result: ExchangeData = { ...data, source: "okx" };
    return hasEnoughData(result) ? result : null;
  } catch {
    return null;
  }
}

async function tryBybit(coingeckoId: string, symbol: string): Promise<ExchangeData | null> {
  const bybitSymbol = COINGECKO_TO_BYBIT[coingeckoId] || COINGECKO_TO_BYBIT[symbol];
  if (!bybitSymbol) return null;
  try {
    const data = await fetchBybitData(bybitSymbol);
    const result: ExchangeData = { ...data, source: "bybit" };
    return hasEnoughData(result) ? result : null;
  } catch {
    return null;
  }
}

export async function fetchExchangeData(
  coingeckoId: string,
  symbol: string,
): Promise<ExchangeData | null> {
  const binance = await tryBinance(coingeckoId, symbol);
  if (binance) return binance;

  const okx = await tryOKX(coingeckoId, symbol);
  if (okx) return okx;

  const bybit = await tryBybit(coingeckoId, symbol);
  if (bybit) return bybit;

  return null;
}
