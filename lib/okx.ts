import type { BinanceKline, BinanceFundingRate, BinanceOpenInterest, BinanceLongShortRatio } from "@/types/signal";
import { fetchJson } from "@/lib/retry";

const BASE_URL = "https://www.okx.com";
const TIMEOUT_MS = 12_000;

const BAR_MS: Record<string, number> = {
  "1M": 60000,
  "3M": 180000,
  "5M": 300000,
  "15M": 900000,
  "30M": 1800000,
  "1H": 3600000,
  "2H": 7200000,
  "4H": 14400000,
  "6H": 21600000,
  "12H": 43200000,
  "1D": 86400000,
  "3D": 259200000,
  "1W": 604800000,
  "1Mon": 2592000000,
};

function barToMs(bar: string): number {
  return BAR_MS[bar.toUpperCase()] ?? 3600000;
}

export const COINGECKO_TO_OKX: Record<string, string> = {
  bitcoin: "BTC-USDT-SWAP",
  ethereum: "ETH-USDT-SWAP",
  tether: "USDT-USDT-SWAP",
  binancecoin: "BNB-USDT-SWAP",
  solana: "SOL-USDT-SWAP",
  ripple: "XRP-USDT-SWAP",
  "usd-coin": "USDC-USDT-SWAP",
  dogecoin: "DOGE-USDT-SWAP",
  cardano: "ADA-USDT-SWAP",
  "shiba-inu": "SHIB-USDT-SWAP",
  "avalanche-2": "AVAX-USDT-SWAP",
  polkadot: "DOT-USDT-SWAP",
  chainlink: "LINK-USDT-SWAP",
  tron: "TRX-USDT-SWAP",
  "bitcoin-cash": "BCH-USDT-SWAP",
  litecoin: "LTC-USDT-SWAP",
  uniswap: "UNI-USDT-SWAP",
  stellar: "XLM-USDT-SWAP",
  cosmos: "ATOM-USDT-SWAP",
  "ethereum-classic": "ETC-USDT-SWAP",
  filecoin: "FIL-USDT-SWAP",
  near: "NEAR-USDT-SWAP",
  aptos: "APT-USDT-SWAP",
  arbitrum: "ARB-USDT-SWAP",
  optimism: "OP-USDT-SWAP",
  sui: "SUI-USDT-SWAP",
  "injective-protocol": "INJ-USDT-SWAP",
  "the-graph": "GRT-USDT-SWAP",
  "render-token": "RENDER-USDT-SWAP",
  celestia: "TIA-USDT-SWAP",
  kaspa: "KAS-USDT-SWAP",
  bonk: "BONK-USDT-SWAP",
  pepe: "PEPE-USDT-SWAP",
  floki: "FLOKI-USDT-SWAP",
  "ondo-finance": "ONDO-USDT-SWAP",
  ethena: "ENA-USDT-SWAP",
  pendle: "PENDLE-USDT-SWAP",
  thorchain: "RUNE-USDT-SWAP",
  maker: "MKR-USDT-SWAP",
  aave: "AAVE-USDT-SWAP",
  "hedera-hashgraph": "HBAR-USDT-SWAP",
  "the-open-network": "TON-USDT-SWAP",
  internetcomputer: "ICP-USDT-SWAP",
  "worldcoin-wld": "WLD-USDT-SWAP",
  "fetch-ai": "FET-USDT-SWAP",
  "lido-dao": "LDO-USDT-SWAP",
  mantle: "MNT-USDT-SWAP",
  starknet: "STRK-USDT-SWAP",
  "immutable-x": "IMX-USDT-SWAP",
  "the-sandbox": "SAND-USDT-SWAP",
  decentraland: "MANA-USDT-SWAP",
  "axie-infinity": "AXS-USDT-SWAP",
  "pancakeswap-token": "CAKE-USDT-SWAP",
  "curve-dao-token": "CRV-USDT-SWAP",
  "compound-governance-token": "COMP-USDT-SWAP",
  algorand: "ALGO-USDT-SWAP",
  vechain: "VET-USDT-SWAP",
  "crypto-com-chain": "CRO-USDT-SWAP",
  tezos: "XTZ-USDT-SWAP",
  "chiliz": "CHZ-USDT-SWAP",
  "official-trump": "TRUMP-USDT-SWAP",
  "hyperliquid": "HYPE-USDT-SWAP",
  "pyth-network": "PYTH-USDT-SWAP",
};

async function fetchWithTimeout<T>(url: string): Promise<T | null> {
  try {
    return await fetchJson<T>(url, { timeoutMs: TIMEOUT_MS });
  } catch {
    return null;
  }
}

export async function fetchOKXKlines(instId: string, bar: string = "1H", limit: number = 300): Promise<BinanceKline[]> {
  const url = `${BASE_URL}/api/v5/market/candles?instId=${instId}&bar=${bar}&limit=${limit}`;
  const raw = await fetchWithTimeout<{ data: string[][] }>(url);
  if (!raw?.data) return [];
  const barMs = barToMs(bar);
  return raw.data.map((k) => ({
    openTime: parseInt(k[0], 10),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
    closeTime: parseInt(k[0], 10) + barMs,
    quoteVolume: parseFloat(k[7]),
    trades: 0,
  })).reverse();
}

export async function fetchOKXFundingRate(instId: string): Promise<BinanceFundingRate[]> {
  const url = `${BASE_URL}/api/v5/public/funding-rate-history?instId=${instId}&limit=100`;
  const raw = await fetchWithTimeout<{ data: Array<{ instId: string; fundingRate: string; fundingTime: string }> }>(url);
  if (!raw?.data) return [];
  return raw.data.map((r) => ({
    symbol: r.instId,
    fundingRate: parseFloat(r.fundingRate),
    fundingTime: parseInt(r.fundingTime, 10),
  }));
}

export async function fetchOKXOpenInterest(instId: string): Promise<BinanceOpenInterest | null> {
  const url = `${BASE_URL}/api/v5/public/open-interest?instType=SWAP&instId=${instId}`;
  const raw = await fetchWithTimeout<{ data: Array<{ oi: string; instId: string; ts: string }> }>(url);
  if (!raw?.data?.[0]) return null;
  return {
    current: raw.data[0].oi,
    symbol: raw.data[0].instId,
    time: parseInt(raw.data[0].ts, 10),
  };
}

export async function fetchOKXLongShortRatio(instId: string): Promise<BinanceLongShortRatio[]> {
  const url = `${BASE_URL}/api/v5/rubik/stat/contracts/long-short-account-ratio?ccy=${instId.replace("-USDT-SWAP", "")}&period=1H`;
  const raw = await fetchWithTimeout<{ data: Array<{ ratio: string; ts: string }> }>(url);
  if (!raw?.data) return [];
  return raw.data
    .map((r) => ({ ratio: parseFloat(r.ratio), ts: parseInt(r.ts, 10) }))
    .filter((r) => Number.isFinite(r.ratio))
    .map((r) => {
      const denom = 1 + r.ratio;
      const longAccount = denom !== 0 ? r.ratio / denom : 0;
      const shortAccount = denom !== 0 ? 1 / denom : 0;
      return {
        symbol: instId,
        longShortRatio: String(r.ratio),
        longAccount: String(longAccount),
        shortAccount: String(shortAccount),
        timestamp: r.ts,
      };
    });
}

export async function fetchOKXData(instId: string) {
  const [klines, fundingRate, openInterest, longShort] = await Promise.all([
    fetchOKXKlines(instId),
    fetchOKXFundingRate(instId),
    fetchOKXOpenInterest(instId),
    fetchOKXLongShortRatio(instId),
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

export async function fetchOKXMultiTimeframeData(instId: string) {
  const [klines15m, klines1h, klines4h, fundingRate, openInterest, longShort] = await Promise.all([
    fetchOKXKlines(instId, "15m", 200),
    fetchOKXKlines(instId, "1H", 500),
    fetchOKXKlines(instId, "4H", 300),
    fetchOKXFundingRate(instId),
    fetchOKXOpenInterest(instId),
    fetchOKXLongShortRatio(instId),
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

export type OKXLiquidationItem = {
  instId: string;
  instType: string;
  bkPx: string;
  bz: string;
  side: string;
  ts: string;
};

export async function fetchOKXLiquidationHistory(
  params: { instId?: string; state?: string; before?: string; after?: string; limit?: number } = {},
): Promise<OKXLiquidationItem[]> {
  const { instId, state = "filled", before, after, limit = 100 } = params;
  const urlParams: Record<string, string | number> = { instType: "SWAP", state, limit };
  if (instId) urlParams.instId = instId;
  if (before) urlParams.before = before;
  if (after) urlParams.after = after;
  const url = `${BASE_URL}/api/v5/rubik/contracts/liquidation-orders?${new URLSearchParams(urlParams as Record<string, string>).toString()}`;
  const raw = await fetchWithTimeout<{ data: OKXLiquidationItem[] }>(url);
  return raw?.data ?? [];
}