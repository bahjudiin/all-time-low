"use client";

import useSWR from "swr";
import { useMemo } from "react";
import type { CoinMarket, CoinWithDerived } from "@/types/coin";
import { computeDerived } from "@/lib/coingecko";
import { isStable, isLowVolatility, hasNoMovement } from "@/lib/filters";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useCoins(initialCoins: CoinMarket[]) {
  const { data: rawCoins, isLoading } = useSWR<CoinMarket[]>(
    "/api/coins?currency=usd",
    fetcher,
    {
      fallbackData: initialCoins,
      refreshInterval: 120_000,
      revalidateOnFocus: false,
      revalidateOnMount: false,
      dedupingInterval: 60_000,
    }
  );

  const coins: CoinWithDerived[] = useMemo(() => {
    if (!rawCoins) return [];
    return rawCoins
      .map((coin) => ({ ...coin, ...computeDerived(coin) }))
      .filter((c) => !isStable(c) && !isLowVolatility(c) && !hasNoMovement(c));
  }, [rawCoins]);

  const bySymbol = useMemo(() => {
    const map = new Map<string, CoinWithDerived>();
    for (const c of coins) map.set(c.symbol.toLowerCase(), c);
    return map;
  }, [coins]);

  const resolveCoin = (symbol: string): CoinWithDerived | null =>
    bySymbol.get(symbol.toLowerCase()) ?? null;

  return { coins, bySymbol, resolveCoin, isLoading };
}