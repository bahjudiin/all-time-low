import type { CoinWithDerived } from "@/types/coin";

export const STABLECOINS = new Set([
  "usdt",
  "usdc",
  "dai",
  "busd",
  "tusd",
  "usdp",
  "gusd",
  "lusd",
  "frax",
  "usde",
  "usdd",
  "usds",
  "usd1",
  "fdusd",
  "paxg",
  "usd0",
  "usdy",
  "usdg",
  "crvusd",
  "eurs",
  "eurt",
  "xusd",
  "usdb",
  "usdq",
  "eurc",
  "usdce",
  "usdte",
  "gho",
  "usdz",
  "usda",
  "pyusd",
  "usdl",
  "dola",
  "susde",
  "usdx",
  "usdt0",
  "husd",
  "usdr",
  "wusd",
  "usde",
  "savax",
  "reth",
  "tbtc",
  "wbtc",
  "wsteth",
  "steth",
  "cbeth",
  "wbeth",
  "weeth",
  "ezeth",
  "rseth",
  "rsweth",
  "soloeth",
  "oseth",
  "diamond",
]);

const NEAR_ATH_THRESHOLD = -5;
const NEAR_ATL_THRESHOLD = 5;
const EXTREME_ATH_PASSED = 0;
const EXTREME_ATL_PASSED = 0;
const LOW_VOLATILITY_THRESHOLD = 0.1;
const ATH_ATL_MIN_RATIO = 1.1;

export function isStable(coin: CoinWithDerived): boolean {
  return STABLECOINS.has(coin.symbol.toLowerCase());
}

export function isLowVolatility(coin: CoinWithDerived): boolean {
  return Math.abs(coin.price_change_percentage_24h ?? 0) < LOW_VOLATILITY_THRESHOLD;
}

export function hasNoMovement(coin: CoinWithDerived): boolean {
  if (coin.ath <= 0 || coin.atl <= 0) return false;
  return coin.ath / coin.atl < ATH_ATL_MIN_RATIO;
}

export function isNearATH(coin: CoinWithDerived): boolean {
  return coin.ath_change_percentage >= NEAR_ATH_THRESHOLD && coin.ath_change_percentage <= EXTREME_ATH_PASSED;
}

export function isPastATH(coin: CoinWithDerived): boolean {
  return coin.ath_change_percentage > EXTREME_ATH_PASSED;
}

export function isNearATL(coin: CoinWithDerived): boolean {
  return coin.atl_change_percentage <= NEAR_ATL_THRESHOLD && coin.atl_change_percentage >= EXTREME_ATL_PASSED;
}

export function isPastATL(coin: CoinWithDerived): boolean {
  return coin.atl_change_percentage < EXTREME_ATL_PASSED;
}

export function isExtreme(coin: CoinWithDerived): boolean {
  return (isNearATH(coin) || isPastATH(coin) || isNearATL(coin) || isPastATL(coin)) && !hasNoMovement(coin);
}

export function isNearOrPastATHATL(coin: CoinWithDerived): boolean {
  return isExtreme(coin);
}
