"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import type { CoinMarket } from "@/types/coin";
import type { CoinSignals } from "@/types/signal";
import { useScreenerStore } from "@/lib/store";
import { SignalCard } from "./SignalCard";
import { isStable, isLowVolatility, hasNoMovement } from "@/lib/filters";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface CoinWithSignals extends CoinMarket {
  signals?: CoinSignals;
}

export function SignalsClient() {
  const { currency, search } = useScreenerStore();
  const [sortBy, setSortBy] = useState<"score" | "market_cap" | "change24h">("score");

  const { data: coins, isLoading } = useSWR<CoinWithSignals[]>(
    `/api/signals?currency=${currency}`,
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
    }
  );

  const filteredCoins = useMemo(() => {
    if (!coins) return [];
    let result = coins.filter(
      (c) => !isStable(c as never) && !isLowVolatility(c as never) && !hasNoMovement(c as never) && c.signals
    );

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
      );
    }

    if (sortBy === "score") {
      result.sort((a, b) => (b.signals?.score ?? 0) - (a.signals?.score ?? 0));
    } else if (sortBy === "market_cap") {
      result.sort((a, b) => b.market_cap - a.market_cap);
    } else if (sortBy === "change24h") {
      result.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
    }

    return result;
  }, [coins, search, sortBy]);

  const summary = useMemo(() => {
    if (!filteredCoins.length) return { strongLong: 0, long: 0, wait: 0, short: 0, strongShort: 0 };
    return filteredCoins.reduce(
      (acc, c) => {
        const dir = c.signals?.direction;
        if (dir === "strong_long") acc.strongLong++;
        else if (dir === "long" || dir === "lean_long") acc.long++;
        else if (dir === "short" || dir === "lean_short") acc.short++;
        else if (dir === "strong_short") acc.strongShort++;
        else acc.wait++;
        return acc;
      },
      { strongLong: 0, long: 0, wait: 0, short: 0, strongShort: 0 }
    );
  }, [filteredCoins]);

  return (
    <>
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-4 text-xs">
          <span className="text-emerald-400 font-semibold">{summary.strongLong} Strong Long</span>
          <span className="text-emerald-300">{summary.long} Long</span>
          <span className="text-zinc-500">{summary.wait} Wait</span>
          <span className="text-red-300">{summary.short} Short</span>
          <span className="text-red-400 font-semibold">{summary.strongShort} Strong Short</span>
        </div>
        <div className="flex items-center gap-1">
          {(["score", "market_cap", "change24h"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                sortBy === s
                  ? "bg-blue-600 text-white"
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {s === "score" ? "By Signal" : s === "market_cap" ? "By Market Cap" : "By Change"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-zinc-500">Computing signals for all coins...</p>
            </div>
          </div>
        )}

        {!isLoading && filteredCoins.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-zinc-500 mb-2">No signals available</p>
              <p className="text-xs text-zinc-600">Binance futures data is being fetched</p>
            </div>
          </div>
        )}

        {!isLoading && filteredCoins.length > 0 && (
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCoins.map((coin) => (
                <SignalCard
                  key={coin.id}
                  name={coin.name}
                  symbol={coin.symbol}
                  image={coin.image}
                  price={coin.current_price}
                  change24h={coin.price_change_percentage_24h}
                  signals={coin.signals!}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
