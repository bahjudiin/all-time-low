import type { BinanceKline, BinanceFundingRate, BinanceOpenInterest, BinanceLongShortRatio } from "@/types/signal";
import { COINGECKO_TO_BINANCE, fetchBinanceData, fetchBinanceMultiTimeframeData } from "./binance";
import { COINGECKO_TO_OKX, fetchOKXData, fetchOKXMultiTimeframeData } from "./okx";
import { COINGECKO_TO_BYBIT, fetchBybitData, fetchBybitMultiTimeframeData } from "./bybit";

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

// Try to resolve symbol dynamically: SYMBOL + USDT
function tryDynamicSymbol(symbol: string): string | null {
  const upper = symbol.toUpperCase();
  if (upper.length >= 2 && upper.length <= 10) {
    return `${upper}USDT`;
  }
  return null;
}

async function tryBinance(coingeckoId: string, symbol: string): Promise<ExchangeData | null> {
  // Try hardcoded mapping first, then dynamic
  const binanceSymbol = COINGECKO_TO_BINANCE[coingeckoId] || COINGECKO_TO_BINANCE[symbol] || tryDynamicSymbol(symbol);
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
  const okxSymbol = COINGECKO_TO_OKX[coingeckoId] || COINGECKO_TO_OKX[symbol] || `${symbol.toUpperCase()}-USDT`;
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
  const bybitSymbol = COINGECKO_TO_BYBIT[coingeckoId] || COINGECKO_TO_BYBIT[symbol] || `${symbol.toUpperCase()}USDT`;
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

export interface MultiTimeframeExchangeData {
  klines15m: BinanceKline[];
  klines1h: BinanceKline[];
  klines4h: BinanceKline[];
  fundingRate: BinanceFundingRate[];
  openInterest: BinanceOpenInterest | null;
  globalRatio: BinanceLongShortRatio[];
  topRatio: BinanceLongShortRatio[];
  topPositionRatio: BinanceLongShortRatio[];
  takerRatio: BinanceLongShortRatio[];
  source: "binance" | "okx" | "bybit";
}

function hasEnoughMultiTimeframeData(data: MultiTimeframeExchangeData): boolean {
  return data.klines1h.length >= 50;
}

async function tryBinanceMultiTimeframe(coingeckoId: string, symbol: string): Promise<MultiTimeframeExchangeData | null> {
  const binanceSymbol = COINGECKO_TO_BINANCE[coingeckoId] || COINGECKO_TO_BINANCE[symbol] || tryDynamicSymbol(symbol);
  if (!binanceSymbol) return null;
  try {
    const data = await fetchBinanceMultiTimeframeData(binanceSymbol);
    const result: MultiTimeframeExchangeData = { ...data, source: "binance" };
    return hasEnoughMultiTimeframeData(result) ? result : null;
  } catch {
    return null;
  }
}

async function tryOKXMultiTimeframe(coingeckoId: string, symbol: string): Promise<MultiTimeframeExchangeData | null> {
  const okxSymbol = COINGECKO_TO_OKX[coingeckoId] || COINGECKO_TO_OKX[symbol] || `${symbol.toUpperCase()}-USDT-SWAP`;
  if (!okxSymbol) return null;
  try {
    const data = await fetchOKXMultiTimeframeData(okxSymbol);
    const result: MultiTimeframeExchangeData = { ...data, source: "okx" };
    return hasEnoughMultiTimeframeData(result) ? result : null;
  } catch {
    return null;
  }
}

async function tryBybitMultiTimeframe(coingeckoId: string, symbol: string): Promise<MultiTimeframeExchangeData | null> {
  const bybitSymbol = COINGECKO_TO_BYBIT[coingeckoId] || COINGECKO_TO_BYBIT[symbol] || `${symbol.toUpperCase()}USDT`;
  if (!bybitSymbol) return null;
  try {
    const data = await fetchBybitMultiTimeframeData(bybitSymbol);
    const result: MultiTimeframeExchangeData = { ...data, source: "bybit" };
    return hasEnoughMultiTimeframeData(result) ? result : null;
  } catch {
    return null;
  }
}

export async function fetchMultiTimeframeExchangeData(
  coingeckoId: string,
  symbol: string,
): Promise<MultiTimeframeExchangeData | null> {
  const binance = await tryBinanceMultiTimeframe(coingeckoId, symbol);
  if (binance) return binance;

  const okx = await tryOKXMultiTimeframe(coingeckoId, symbol);
  if (okx) return okx;

  const bybit = await tryBybitMultiTimeframe(coingeckoId, symbol);
  if (bybit) return bybit;

  return null;
}
