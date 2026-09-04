import type { CoinMarket, LiquidationData } from "@/types/coin";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const BINANCE_BASE = "https://api.binance.com";

const TIMEOUT_MS = 15000;

const EXTRA_BINANCE_COINS = [
  "1000shib",
  "bonk",
  "pepe",
  "floki",
  "wif",
  "bome",
  "jup",
  "jto",
  "tia",
  "sei",
  "sui",
  "apt",
  "arb",
  "op",
  "matic",
  "atom",
  "near",
  "fil",
  "inj",
  "ftm",
  "gala",
  "sand",
  "mana",
  "axs",
  "dydx",
  "pendle",
  "rune",
  "kas",
  "kaspa",
  "sats",
  "ordi",
  "1000sats",
  "stx",
  "runes",
  "ena",
  "ondo",
  "ethfi",
  "pixels",
  "strk",
  "manta",
  "alt",
  "portal",
  "w",
  "agix",
  "ocean",
  "fet",
  "saga",
  "tenet",
  "worldcoin-wld",
  "celestia",
  "jupiter-exchange-solana",
  "pyth-network",
  "jito-governance-token",
  "rocket-pool",
  "lido-dao",
  "render-token",
  "the-graph",
  "immutable-x",
  "mantle",
  "mina-protocol",
  "flow",
  "internet-computer",
  "hedera-hashgraph",
  "vechain",
  "algorand",
  "the-sandbox",
  "decentraland",
  "axie-infinity",
  "aave",
  "uniswap",
  "gmx",
  "pancakeswap-token",
  "sushiswap",
  "curve-dao-token",
  "1inch",
  "maker",
  "compound-governance-token",
  "synthetix-network-token",
  "yearn-finance",
  "haven",
  "monero",
  "zcash",
  "dash",
  "ethereum-classic",
  "bitcoin-cash",
  "litecoin",
  "ripple",
  "stellar",
  "cardano",
  "polkadot",
  "avalanche-2",
  "cosmos",
  "chainlink",
  "polygon-ecosystem-token",
  "arbitrum",
  "optimism",
  "sui",
  "sei-network",
  "celestia",
  "starknet",
  "mantle",
  "beam-2",
  "the-open-network",
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
