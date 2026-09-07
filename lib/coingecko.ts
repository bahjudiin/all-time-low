import type { CoinMarket, LiquidationData } from "@/types/coin";
import { COINGECKO_TO_BINANCE } from "@/lib/binance";
import { fetchJson } from "@/lib/retry";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const BINANCE_BASE = "https://api.binance.com";

const TIMEOUT_MS = 15000;
const TICKER_BATCH_SIZE = 90;

const EXTRA_BINANCE_COINS = [
  // Meme coins
  "1000shib", "bonk", "pepe", "floki", "wif", "bome", "dogwifcoin",
  "book-of-meme", "brett", "mog-coin", "popcat", "cat-in-a-dogs-world",
  "neiro", "turbo", "myro", "wojak", "lady", "boson",
  // AI & Data
  "agix", "ocean", "fet", "render-token", "akash-network", "graph-protocol",
  "worldcoin-wld", "arkham", "cta-exchange-traded-on-chain", "virtual-protocol",
  "ai16z", "goko", "griffain", "ai-rig-alchemy", "fetch-ai", "singularitynet",
  "numeraire", "cortex", "effect-network", "deepbrain-chain",
  // RWA & Tokenization
  "ondo-finance", "centrifuge", "polymesh", "mantra", "polkadot",
  "reserve-rights-token", "goldfinch", "maple-finance", "ethena",
  "credible-finance", "hydro", "provenance-blockchain", "tangible",
  "realio-network", "lofty", "propchain", "tokemak", "ondo-global-dollar",
  "dream-machine-ai", "beefy-finance", "yearn-finance", "compound-governance-token",
  // DeFi
  "uniswap", "aave", "maker", "curve-dao-token", "1inch",
  "sushiswap", "pancakeswap-token", "gmx", "jupiter-exchange-solana",
  "pendle", "dydx", "synthetix-network-token", "lido-dao", "rocket-pool",
  "raydium", "orca", "mango-markets", "drift-protocol", "jito-governance-token",
  "jup", "morpho", "venice-token", "aerodrome-finance",
  // Gaming & Metaverse
  "the-sandbox", "decentraland", "axie-infinity", "gala", "illuvium",
  "echain-ecology", "beam-2", "ronin", "immutable-x", "enjincoin",
  "merit-circle", "guild-of-guardians", "star-atlas", "stepn", "superverse",
  "ultraviolet", "ron", "pixel-2", "pixels", "portal",
  // Layer 2 & Infrastructure
  "arbitrum", "optimism", "starknet", "mantle", "matic-network",
  "polygon-ecosystem-token", "metis-token", "boba-network",
  "celo", "layerzero", "wormhole", "stargate-finance", "celestia",
  "dymension", "manta-network", "alt-layer", "scroll", "zksync",
  "blast", "mode", "bob-network", "degen-base-eth", "apex-token-2",
  // DePIN & Storage
  "filecoin", "arweave", "helium", "livepeer", "the-graph",
  "flux-2", "siacoin", "storj", "secret",
  "oasis-network", "ankr", "theta-token", "vet", "hedera-hashgraph",
  // Real World & Payments
  "ripple", "stellar", "nano", "monero", "zcash", "dash",
  "bitcoin-cash", "litecoin", "algorand", "vechain", "iota",
  "the-open-network", "kaia", "ether-fi",
  // New & Trending
  "grass", "pudgy-penguins", "official-trump", "bittensor", "hyperliquid",
  "pi-network", "sky", "spx6900", "fartcoin", "syrup",
  "trust-wallet-token", "quant-network", "kaspa", "kas",
  "ordi", "sats", "1000sats", "stx", "runes",
  "sei-network", "sui", "aptos", "injective-protocol",
  "fantom", "near", "cosmos", "chainlink", "avalanche-2",
];

type BinanceTicker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
};

function coingeckoIdToBinanceSymbol(id: string): string {
  const mapped = COINGECKO_TO_BINANCE[id];
  if (mapped) return mapped;
  return `${id.replace(/-/g, "").toUpperCase()}USDT`;
}

function applyTicker(
  map: Map<string, { price: number; change24h: number; volume: number }>,
  t: BinanceTicker
): void {
  if (!t.symbol.endsWith("USDT")) return;
  const base = t.symbol.replace("USDT", "").toLowerCase();
  map.set(base, {
    price: parseFloat(t.lastPrice),
    change24h: parseFloat(t.priceChangePercent),
    volume: parseFloat(t.quoteVolume),
  });
}

export async function fetchBinanceSymbols(): Promise<string[]> {
  const data = await fetchJson<{ symbols: Array<{ quoteAsset: string; status: string; baseAsset: string }> }>(
    `${BINANCE_BASE}/api/v3/exchangeInfo`,
    { headers: { Accept: "application/json" }, timeoutMs: TIMEOUT_MS }
  );
  const symbols: string[] = data.symbols
    .filter((s) => s.quoteAsset === "USDT" && s.status === "TRADING")
    .map((s) => s.baseAsset.toLowerCase());

  return [...new Set(symbols)];
}

export async function fetchBinance24hTicker(): Promise<Map<string, { price: number; change24h: number; volume: number }>> {
  const needed = new Set<string>();
  for (const id of EXTRA_BINANCE_COINS) needed.add(coingeckoIdToBinanceSymbol(id));
  for (const id of Object.keys(COINGECKO_TO_BINANCE)) {
    const mapped = COINGECKO_TO_BINANCE[id];
    if (mapped) needed.add(mapped);
  }

  const symbols = [...needed];
  const tickerMap = new Map<string, { price: number; change24h: number; volume: number }>();

  const fetchBatch = (batch: string[]) =>
    fetchJson<BinanceTicker[]>(
      `${BINANCE_BASE}/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(batch))}`,
      { headers: { Accept: "application/json" }, timeoutMs: TIMEOUT_MS }
    );

  for (let i = 0; i < symbols.length; i += TICKER_BATCH_SIZE) {
    const batch = symbols.slice(i, i + TICKER_BATCH_SIZE);
    let rows: BinanceTicker[] | null = null;
    try {
      rows = await fetchBatch(batch);
    } catch {
      rows = null;
    }
    if (rows) {
      for (const t of rows) applyTicker(tickerMap, t);
      continue;
    }
    for (const sym of batch) {
      try {
        const one = await fetchBatch([sym]);
        for (const t of one) applyTicker(tickerMap, t);
      } catch {
        // symbol not tradeable on Binance spot; skip.
      }
    }
  }

  return tickerMap;
}

export async function fetchCoinsMarkets(
  currency: string = "usd",
  perPage: number = 250,
  page: number = 1
): Promise<CoinMarket[]> {
  const params = new URLSearchParams({
    vs_currency: currency,
    order: "market_cap_desc",
    per_page: String(perPage),
    page: String(page),
    sparkline: "true",
    price_change_percentage: "24h,7d,30d",
  });

  return fetchJson<CoinMarket[]>(`${COINGECKO_BASE}/coins/markets?${params}`, {
    headers: { Accept: "application/json" },
    timeoutMs: TIMEOUT_MS,
    next: { revalidate: 60 },
  });
}

export async function fetchExtraBinanceCoins(
  currency: string = "usd"
): Promise<CoinMarket[]> {
  const ids = EXTRA_BINANCE_COINS.join(",");
  const params = new URLSearchParams({
    vs_currency: currency,
    ids,
    sparkline: "true",
    price_change_percentage: "24h,7d,30d",
  });

  return fetchJson<CoinMarket[]>(`${COINGECKO_BASE}/coins/markets?${params}`, {
    headers: { Accept: "application/json" },
    timeoutMs: TIMEOUT_MS,
    next: { revalidate: 60 },
  });
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateLiquidation(volatility: number, volume: number): LiquidationData {
  const absVol = Math.abs(volatility);
  const volScale = Math.min(Math.abs(volume) / 1e9, 5);
  const base = Math.min(absVol * 0.8 + volScale * 0.4, 15);

  const seed = Math.round(volatility * 100) * 1e6 + (Math.abs(Math.round(volume / 1e6)) % 1e6);
  const rnd = pseudoRandom(seed);

  const longRatio = volatility < 0 ? 0.6 + rnd * 0.3 : 0.3 + rnd * 0.4;
  const shortRatio = 1 - longRatio;

  const longPct = base * longRatio;
  const shortPct = base * shortRatio;

  let netDirection: "long" | "short" | "neutral";
  if (longPct > shortPct * 1.2) {
    netDirection = "long";
  } else if (shortPct > longPct * 1.2) {
    netDirection = "short";
  } else {
    netDirection = "neutral";
  }

  return { totalPct: base, longPct, shortPct, netDirection };
}

export function computeDerived(coin: CoinMarket) {
  const pctToATH =
    coin.current_price > 0 ? coin.ath / coin.current_price - 1 : 0;
  const volatilityProxy = coin.price_change_percentage_24h ?? 0;
  const liquidation24h = generateLiquidation(volatilityProxy, coin.total_volume);
  return { pctToATH, volatilityProxy, liquidation24h };
}