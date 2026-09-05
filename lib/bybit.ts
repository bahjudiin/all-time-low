import type { BinanceKline, BinanceFundingRate, BinanceOpenInterest, BinanceLongShortRatio } from "@/types/signal";

const BASE_URL = "https://api.bybit.com";
const TIMEOUT_MS = 12_000;

export const COINGECKO_TO_BYBIT: Record<string, string> = {
  bitcoin: "BTCUSDT",
  ethereum: "ETHUSDT",
  tether: "USDTUSDT",
  binancecoin: "BNBUSDT",
  solana: "SOLUSDT",
  ripple: "XRPUSDT",
  "usd-coin": "USDCUSDT",
  dogecoin: "DOGEUSDT",
  cardano: "ADAUSDT",
  "shiba-inu": "SHIBUSDT",
  "avalanche-2": "AVAXUSDT",
  polkadot: "DOTUSDT",
  chainlink: "LINKUSDT",
  tron: "TRXUSDT",
  "bitcoin-cash": "BCHUSDT",
  litecoin: "LTCUSDT",
  uniswap: "UNIUSDT",
  stellar: "XLMUSDT",
  cosmos: "ATOMUSDT",
  "ethereum-classic": "ETCUSDT",
  filecoin: "FILUSDT",
  near: "NEARUSDT",
  aptos: "APTUSDT",
  arbitrum: "ARBUSDT",
  optimism: "OPUSDT",
  sui: "SUIUSDT",
  "injective-protocol": "INJUSDT",
  "the-graph": "GRTUSDT",
  "render-token": "RENDERUSDT",
  celestia: "TIAUSDT",
  kaspa: "KASUSDT",
  bonk: "BONKUSDT",
  pepe: "PEPEUSDT",
  floki: "FLOKIUSDT",
  "ondo-finance": "ONDOUSDT",
  ethena: "ENAUSDT",
  pendle: "PENDLEUSDT",
  thorchain: "RUNEUSDT",
  maker: "MKRUSDT",
  aave: "AAVEUSDT",
  "hedera-hashgraph": "HBARUSDT",
  "the-open-network": "TONUSDT",
  internetcomputer: "ICPUSDT",
  "worldcoin-wld": "WLDUSDT",
  "pyth-network": "PYTHUSDT",
  "fetch-ai": "FETUSDT",
  "lido-dao": "LDOUSDT",
  mantle: "MNTUSDT",
  starknet: "STRKUSDT",
  "immutable-x": "IMXUSDT",
  "the-sandbox": "SANDUSDT",
  decentraland: "MANAUSDT",
  "axie-infinity": "AXSUSDT",
  "pancakeswap-token": "CAKEUSDT",
  "curve-dao-token": "CRVUSDT",
  "compound-governance-token": "COMPUSDT",
  algorand: "ALGOUSDT",
  vechain: "VETUSDT",
  "crypto-com-chain": "CROUSDT",
  tezos: "XTZUSDT",
  "chiliz": "CHZUSDT",
  "official-trump": "TRUMPUSDT",
  "hyperliquid": "HYPEUSDT",
};

async function fetchWithTimeout<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchBybitKlines(symbol: string, interval: string = "60", limit: number = 200): Promise<BinanceKline[]> {
  const url = `${BASE_URL}/v5/market/kline?category=linear&symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const raw = await fetchWithTimeout<{
    result: { list: Array<[string, string, string, string, string, string, string]> };
  }>(url);
  if (!raw?.result?.list) return [];
  return raw.result.list.map((k) => ({
    openTime: parseInt(k[0]),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
    closeTime: parseInt(k[0]) + 3600000,
    quoteVolume: parseFloat(k[6]),
    trades: 0,
  })).reverse();
}

export async function fetchBybitFundingRate(symbol: string): Promise<BinanceFundingRate[]> {
  const url = `${BASE_URL}/v5/market/funding/history?category=linear&symbol=${symbol}&limit=100`;
  const raw = await fetchWithTimeout<{
    result: { list: Array<{ symbol: string; fundingRate: string; fundingRateTimestamp: string }> };
  }>(url);
  if (!raw?.result?.list) return [];
  return raw.result.list.map((r) => ({
    symbol: r.symbol,
    fundingRate: parseFloat(r.fundingRate),
    fundingTime: parseInt(r.fundingRateTimestamp),
  }));
}

export async function fetchBybitOpenInterest(symbol: string): Promise<BinanceOpenInterest | null> {
  const url = `${BASE_URL}/v5/market/open-interest?category=linear&symbol=${symbol}`;
  const raw = await fetchWithTimeout<{
    result: { list: Array<{ openInterest: string; symbol: string; timestamp: string }> };
  }>(url);
  if (!raw?.result?.list?.[0]) return null;
  const item = raw.result.list[0];
  return {
    current: item.openInterest,
    symbol: item.symbol,
    time: parseInt(item.timestamp),
  };
}

export async function fetchBybitLongShortRatio(symbol: string): Promise<BinanceLongShortRatio[]> {
  const url = `${BASE_URL}/v5/market/account-ratio?category=linear&symbol=${symbol}&period=1h&limit=30`;
  const raw = await fetchWithTimeout<{
    result: { list: Array<{ buyRatio: string; sellRatio: string; timestamp: string }> };
  }>(url);
  if (!raw?.result?.list) return [];
  return raw.result.list.map((r) => ({
    symbol,
    longShortRatio: (parseFloat(r.buyRatio) / parseFloat(r.sellRatio)).toFixed(4),
    longAccount: r.buyRatio,
    shortAccount: r.sellRatio,
    timestamp: parseInt(r.timestamp),
  }));
}

export async function fetchBybitData(symbol: string) {
  const [klines, fundingRate, openInterest, longShort] = await Promise.all([
    fetchBybitKlines(symbol),
    fetchBybitFundingRate(symbol),
    fetchBybitOpenInterest(symbol),
    fetchBybitLongShortRatio(symbol),
  ]);

  return {
    klines,
    fundingRate,
    openInterest,
    globalRatio: longShort,
    topRatio: [] as BinanceLongShortRatio[],
    topPositionRatio: [] as BinanceLongShortRatio[],
    takerRatio: [] as BinanceLongShortRatio[],
  };
}

export async function fetchBybitMultiTimeframeData(symbol: string) {
  const [klines15m, klines1h, klines4h, fundingRate, openInterest, longShort] = await Promise.all([
    fetchBybitKlines(symbol, "15", 200),
    fetchBybitKlines(symbol, "60", 500),
    fetchBybitKlines(symbol, "240", 300),
    fetchBybitFundingRate(symbol),
    fetchBybitOpenInterest(symbol),
    fetchBybitLongShortRatio(symbol),
  ]);

  return {
    klines15m,
    klines1h,
    klines4h,
    fundingRate,
    openInterest,
    globalRatio: longShort,
    topRatio: [] as BinanceLongShortRatio[],
    topPositionRatio: [] as BinanceLongShortRatio[],
    takerRatio: [] as BinanceLongShortRatio[],
  };
}
