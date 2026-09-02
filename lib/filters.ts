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

export const NEAR_ATH_THRESHOLD = -10;
export const NEAR_ATL_THRESHOLD = 10;

export function isStable(coin: CoinWithDerived): boolean {
  return STABLECOINS.has(coin.symbol.toLowerCase());
}

export function isExtreme(coin: CoinWithDerived): boolean {
  const nearAth = coin.ath_change_percentage >= NEAR_ATH_THRESHOLD;
  const nearAtl = coin.atl_change_percentage <= NEAR_ATL_THRESHOLD;
  return nearAth || nearAtl;
}
