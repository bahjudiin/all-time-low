import type {
  BinanceKline,
  BinanceFundingRate,
  BinanceOpenInterest,
  BinanceLongShortRatio,
} from "@/types/signal";

const BASE_URL = "https://fapi.binance.com";
const TIMEOUT_MS = 12_000;

export const COINGECKO_TO_BINANCE: Record<string, string> = {
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
  "matic-network": "MATICUSDT",
  "polygon-ecosystem-token": "POLUSDT",
  "bitcoin-cash": "BCHUSDT",
  litecoin: "LTCUSDT",
  uniswap: "UNIUSDT",
  stellar: "XLMUSDT",
  cosmos: "ATOMUSDT",
  monero: "XMRUSDT",
  "ethereum-classic": "ETCUSDT",
  filecoin: "FILUSDT",
  near: "NEARUSDT",
  aptos: "APTUSDT",
  arbitrum: "ARBUSDT",
  optimism: "OPUSDT",
  "sei-network": "SEIUSDT",
  sui: "SUIUSDT",
  "injective-protocol": "INJUSDT",
  fantom: "FTMUSDT",
  "the-graph": "GRTUSDT",
  "render-token": "RENDERUSDT",
  celestia: "TIAUSDT",
  "jupiter-exchange-solana": "JUPUSDT",
  "jito-governance-token": "JTOUSDT",
  kaspa: "KASUSDT",
  bonk: "BONKUSDT",
  pepe: "PEPEUSDT",
  floki: "FLOKIUSDT",
  dogwifcoin: "WIFUSDT",
  "book-of-meme": "BOMEUSDT",
  "ondo-finance": "ONDOUSDT",
  ethena: "ENAUSDT",
  pendle: "PENDLEUSDT",
  thorchain: "RUNEUSDT",
  ordi: "ORDIUSDT",
  stacks: "STXUSDT",
  blockstack: "STXUSDT",
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
  "havven": "SNXUSDT",
  algorand: "ALGOUSDT",
  vechain: "VETUSDT",
  "crypto-com-chain": "CROUSDT",
  dash: "DASHUSDT",
  zcash: "ZECUSDT",
  tezos: "XTZUSDT",
  neo: "NEOUSDT",
  "quant-network": "QNTUSDT",
  "elrond-erd-2": "EGLDUSDT",
  iota: "IOTAUSDT",
  "theta-token": "THETAUSDT",
  chiliz: "CHZUSDT",
  "conflux-token": "CFXUSDT",
  apecoin: "APEUSDT",
  gala: "GALAUSDT",
  jasmycoin: "JASMYUSDT",
  ankr: "ANKRUSDT",
  bittorrent: "BTTUSDT",
  "sun-token": "SUNUSDT",
  raydium: "RAYUSDT",
  "aerodrome-finance": "AEROUSDT",
  "virtual-protocol": "VIRTUALUSDT",
  layerzero: "ZROUSDT",
  grass: "GRASSUSDT",
  "pudgy-penguins": "PENGUUSDT",
  "official-trump": "TRUMPUSDT",
  bittensor: "TAOUSDT",
  "pi-network": "PIUSDT",
  hyperliquid: "HYPEUSDT",
  "pump-fun": "PUMPUSDT",
  fartcoin: "FARTCOINUSDT",
  sky: "SKYUSDT",
  spx6900: "SPXUSDT",
  eos: "EOSUSDT",
  woo: "WOOUSDT",
  "trust-wallet-token": "TWTUSDT",
  kaia: "KAIAUSDT",
  eigenlayer: "EIGENUSDT",
  morpho: "MORPHOUSDT",
  gno: "GNOUSDT",
  ens: "ENSUSDT",
  syrup: "SYRUPUSDT",
  "venice-token": "VVVUSDT",
};

function buildUrl(path: string, params?: Record<string, string | number>): string {
  const url = new URL(path, BASE_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function fetchWithTimeout<T>(url: string, timeout: number = TIMEOUT_MS): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
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

export async function fetchKlines(
  symbol: string,
  interval: string = "1h",
  limit: number = 500,
): Promise<BinanceKline[]> {
  const url = buildUrl("/fapi/v1/klines", { symbol, interval, limit });
  const raw = await fetchWithTimeout<
    [number, string, string, string, string, string, number, string, number, string][]
  >(url);
  if (!raw) return [];
  return raw.map((k) => ({
    openTime: k[0],
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
    closeTime: k[6],
    quoteVolume: parseFloat(k[7]),
    trades: k[8],
  }));
}

export async function fetchFundingRate(
  symbol: string,
  limit: number = 100,
): Promise<BinanceFundingRate[]> {
  const url = buildUrl("/fapi/v1/fundingRate", { symbol, limit });
  const raw = await fetchWithTimeout<{ symbol: string; fundingRate: string; fundingTime: number }[]>(url);
  if (!raw) return [];
  return raw.map((r) => ({
    symbol: r.symbol,
    fundingRate: parseFloat(r.fundingRate),
    fundingTime: r.fundingTime,
  }));
}

export async function fetchOpenInterest(
  symbol: string,
): Promise<BinanceOpenInterest | null> {
  const url = buildUrl("/fapi/v1/openInterest", { symbol });
  const raw = await fetchWithTimeout<{ openInterest: string; symbol: string; time: number }>(url);
  if (!raw) return null;
  return { current: raw.openInterest, symbol: raw.symbol, time: raw.time };
}

export async function fetchGlobalLongShortRatio(
  symbol: string,
  period: string = "1h",
  limit: number = 30,
): Promise<BinanceLongShortRatio[]> {
  const url = buildUrl("/futures/data/globalLongShortAccountRatio", {
    symbol, period, limit,
  });
  const raw = await fetchWithTimeout<BinanceLongShortRatio[]>(url);
  return raw ?? [];
}

export async function fetchTopLongShortRatio(
  symbol: string,
  period: string = "1h",
  limit: number = 30,
): Promise<BinanceLongShortRatio[]> {
  const url = buildUrl("/futures/data/topLongShortAccountRatio", {
    symbol, period, limit,
  });
  const raw = await fetchWithTimeout<BinanceLongShortRatio[]>(url);
  return raw ?? [];
}

export async function fetchTopPositionRatio(
  symbol: string,
  period: string = "1h",
  limit: number = 30,
): Promise<BinanceLongShortRatio[]> {
  const url = buildUrl("/futures/data/topLongShortPositionRatio", {
    symbol, period, limit,
  });
  const raw = await fetchWithTimeout<BinanceLongShortRatio[]>(url);
  return raw ?? [];
}

export async function fetchTakerLongShortRatio(
  symbol: string,
  period: string = "1h",
  limit: number = 30,
): Promise<BinanceLongShortRatio[]> {
  const url = buildUrl("/futures/data/takerlongshortRatio", {
    symbol, period, limit,
  });
  const raw = await fetchWithTimeout<BinanceLongShortRatio[]>(url);
  return raw ?? [];
}

export async function fetchBinanceData(symbol: string) {
  const [klines, fundingRate, openInterest, globalRatio, topRatio, topPositionRatio, takerRatio] =
    await Promise.all([
      fetchKlines(symbol),
      fetchFundingRate(symbol),
      fetchOpenInterest(symbol),
      fetchGlobalLongShortRatio(symbol),
      fetchTopLongShortRatio(symbol),
      fetchTopPositionRatio(symbol),
      fetchTakerLongShortRatio(symbol),
    ]);

  return {
    klines,
    fundingRate,
    openInterest,
    globalRatio,
    topRatio,
    topPositionRatio,
    takerRatio,
  };
}

export type BinanceForceOrderItem = {
  symbol: string;
  price: string;
  origQty: string;
  executedQty: string;
  avgPrice: string;
  side: string;
  time: number;
};

export async function fetchBinanceLiquidationHistory(
  params: { symbol?: string; startTime?: number; endTime?: number; limit?: number } = {},
): Promise<BinanceForceOrderItem[]> {
  const { symbol, startTime, endTime, limit = 100 } = params;
  const urlParams: Record<string, string | number> = { limit };
  if (symbol) urlParams.symbol = symbol;
  if (startTime) urlParams.startTime = startTime;
  if (endTime) urlParams.endTime = endTime;
  const url = buildUrl("/fapi/v1/allForceOrders", urlParams);
  const raw = await fetchWithTimeout<BinanceForceOrderItem[]>(url);
  return raw ?? [];
}
