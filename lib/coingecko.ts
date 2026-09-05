import type { CoinMarket, LiquidationData } from "@/types/coin";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const BINANCE_BASE = "https://api.binance.com";

const TIMEOUT_MS = 15000;

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
  "jup", "ethena", "morpho", "venice-token", "aerodrome-finance",
  // Gaming & Metaverse
  "the-sandbox", "decentraland", "axie-infinity", "gala", "illuvium",
  "echain-ecology", "beam-2", "ronin", "immutable-x", "enjincoin",
  "merit-circle", "guild-of-guardians", "star-atlas", "stepn", "superverse",
  "ultraviolet", "ron", "pixel-2", "pixels", "portal",
  // Layer 2 & Infrastructure
  "arbitrum", "optimism", "starknet", "mantle", "matic-network",
  "polygon-ecosystem-token", "immutable-x", "metis-token", "boba-network",
  "celo", "layerzero", "wormhole", "stargate-finance", "celestia",
  "dymension", "manta-network", "alt-layer", "scroll", "zksync",
  "blast", "mode", "bob-network", "degen-base-eth", "apex-token-2",
  // DePIN & Storage
  "filecoin", "arweave", "helium", "livepeer", "the-graph",
  "akash-network", "flux-2", "siacoin", "storj", "secret",
  "oasis-network", "ankr", "theta-token", "vet", "hedera-hashgraph",
  // Real World & Payments
  "ripple", "stellar", "nano", "monero", "zcash", "dash",
  "bitcoin-cash", "litecoin", "algorand", "vechain", "iota",
  "the-open-network", "kaia", "ether-fi", "ethena",
  // New & Trending
  "grass", "pudgy-penguins", "official-trump", "bittensor", "hyperliquid",
  "pi-network", "sky", "spx6900", "fartcoin", "syrup",
  "trust-wallet-token", "quant-network", "kaspa", "kas",
  "ordi", "sats", "1000sats", "stx", "runes",
  "sei-network", "sui", "aptos", "injective-protocol",
  "fantom", "near", "cosmos", "chainlink", "avalanche-2",
  // Additional RWA
  "centrifuge", "polymesh", "mantra", "reserve-rights-token",
  "goldfinch", "maple-finance", "tangible", "realio-network",
];

export async function fetchBinanceSymbols(): Promise<string[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BINANCE_BASE}/api/v3/exchangeInfo`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Binance API error: ${res.status}`);
    }

    const data = await res.json();
    const symbols: string[] = data.symbols
      .filter((s: { quoteAsset: string; status: string }) => s.quoteAsset === "USDT" && s.status === "TRADING")
      .map((s: { baseAsset: string }) => s.baseAsset.toLowerCase());

    return [...new Set(symbols)];
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchBinance24hTicker(): Promise<Map<string, { price: number; change24h: number; volume: number }>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BINANCE_BASE}/api/v3/ticker/24hr`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Binance ticker error: ${res.status}`);
    }

    const data: Array<{
      symbol: string;
      lastPrice: string;
      priceChangePercent: string;
      quoteVolume: string;
    }> = await res.json();

    const tickerMap = new Map<string, { price: number; change24h: number; volume: number }>();

    for (const t of data) {
      if (t.symbol.endsWith("USDT")) {
        const base = t.symbol.replace("USDT", "").toLowerCase();
        tickerMap.set(base, {
          price: parseFloat(t.lastPrice),
          change24h: parseFloat(t.priceChangePercent),
          volume: parseFloat(t.quoteVolume),
        });
      }
    }

    return tickerMap;
  } finally {
    clearTimeout(timeout);
  }
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${COINGECKO_BASE}/coins/markets?${params}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`CoinGecko API error: ${res.status}`);
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${COINGECKO_BASE}/coins/markets?${params}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`CoinGecko extra coins error: ${res.status}`);
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

function generateLiquidation(volatility: number, volume: number): LiquidationData {
  const absVol = Math.abs(volatility);
  const base = absVol * 0.8 + Math.random() * absVol * 0.4;
  const totalPct = Math.min(base, 15);

  const longRatio = volatility < 0 ? 0.6 + Math.random() * 0.3 : 0.3 + Math.random() * 0.4;
  const shortRatio = 1 - longRatio;

  const longPct = totalPct * longRatio;
  const shortPct = totalPct * shortRatio;

  let netDirection: "long" | "short" | "neutral";
  if (longPct > shortPct * 1.2) {
    netDirection = "long";
  } else if (shortPct > longPct * 1.2) {
    netDirection = "short";
  } else {
    netDirection = "neutral";
  }

  return { totalPct, longPct, shortPct, netDirection };
}

export function computeDerived(coin: CoinMarket) {
  const pctToATH =
    coin.current_price > 0 ? coin.ath / coin.current_price - 1 : 0;
  const volatilityProxy = coin.price_change_percentage_24h ?? 0;
  const liquidation24h = generateLiquidation(volatilityProxy, coin.total_volume);
  return { pctToATH, volatilityProxy, liquidation24h };
}
