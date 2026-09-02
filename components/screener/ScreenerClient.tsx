"use client";

import useSWR from "swr";
import { useMemo } from "react";
import type { CoinMarket, CoinWithDerived } from "@/types/coin";
import { computeDerived } from "@/lib/coingecko";
import { useScreenerStore } from "@/lib/store";
import { DataTable } from "./DataTable";
import { Toolbar } from "./Toolbar";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function GridCard({ coin }: { coin: CoinWithDerived }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-blue-500/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" loading="lazy" />
        <div>
          <div className="font-medium text-sm">{coin.name}</div>
          <div className="text-xs text-zinc-500 uppercase">{coin.symbol}</div>
        </div>
      </div>
      <div className="text-lg font-semibold mb-2">
        ${coin.current_price.toLocaleString()}
      </div>
      <div className="flex justify-between text-xs">
        <span className={coin.ath_change_percentage > -50 ? "text-red-500" : "text-zinc-500"}>
          ATH: {coin.ath_change_percentage.toFixed(1)}%
        </span>
        <span className="text-zinc-500">Vol: ${(coin.total_volume / 1e9).toFixed(1)}B</span>
      </div>
    </div>
  );
}

interface ScreenerClientProps {
  initialCoins: CoinMarket[];
}

export function ScreenerClient({ initialCoins }: ScreenerClientProps) {
  const { currency, layout, search, filters, page, rowsPerPage } =
    useScreenerStore();

  const { data: rawCoins, error, isLoading } = useSWR<CoinMarket[]>(
    `/api/coins?currency=${currency}`,
    fetcher,
    {
      fallbackData: initialCoins,
      refreshInterval: 60_000,
      revalidateOnFocus: true,
      revalidateOnMount: false,
    }
  );

  const coins: CoinWithDerived[] = useMemo(() => {
    if (!rawCoins) return [];
    return rawCoins.map((coin) => ({ ...coin, ...computeDerived(coin) }));
  }, [rawCoins]);

  const filteredCoins = useMemo(() => {
    let result = coins;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
      );
    }
    if (filters.marketCap) {
      const [min, max] = filters.marketCap;
      result = result.filter((c) => c.market_cap >= min && c.market_cap <= max);
    }
    if (filters.volume) {
      const [min, max] = filters.volume;
      result = result.filter((c) => c.total_volume >= min && c.total_volume <= max);
    }
    if (filters.pctFromATH) {
      const [min, max] = filters.pctFromATH;
      result = result.filter(
        (c) => c.ath_change_percentage >= min && c.ath_change_percentage <= max
      );
    }
    if (filters.pctFromATL) {
      const [min, max] = filters.pctFromATL;
      result = result.filter(
        (c) => c.atl_change_percentage >= min && c.atl_change_percentage <= max
      );
    }
    if (filters.athDateRange) {
      const [start, end] = filters.athDateRange;
      result = result.filter((c) => {
        const d = new Date(c.ath_date);
        return d >= new Date(start) && d <= new Date(end);
      });
    }
    return result;
  }, [coins, search, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.marketCap) count++;
    if (filters.volume) count++;
    if (filters.pctFromATH) count++;
    if (filters.pctFromATL) count++;
    if (filters.athDateRange) count++;
    return count;
  }, [filters]);

  return (
    <>
      {/* Sub-nav tabs */}
      <div className="flex items-center gap-1 px-6 py-2 border-b border-zinc-200 dark:border-zinc-800">
        <button className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white">
          All-Time High
        </button>
        <button className="px-3 py-1.5 text-sm font-medium rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          Gainers (24h)
        </button>
        <button className="px-3 py-1.5 text-sm font-medium rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          Losers (24h)
        </button>
        <button className="px-3 py-1.5 text-sm font-medium rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          Categories
        </button>
      </div>

      {/* Toolbar */}
      <Toolbar data={filteredCoins} activeFilterCount={activeFilterCount} />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-zinc-500">Loading coin data...</p>
            </div>
          </div>
        )}

        {!isLoading && filteredCoins.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-zinc-500 mb-2">No coins match your filters</p>
              <button
                onClick={() =>
                  useScreenerStore.setState({
                    search: "",
                    filters: {
                      marketCap: null,
                      volume: null,
                      pctFromATH: null,
                      pctFromATL: null,
                      athDateRange: null,
                    },
                  })
                }
                className="text-sm text-blue-500 hover:text-blue-400"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {!isLoading && filteredCoins.length > 0 && (
          <>
            {layout === "table" ? (
              <DataTable data={filteredCoins} />
            ) : (
              <div className="flex-1 overflow-auto p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredCoins
                    .slice(
                      rowsPerPage === 0 ? 0 : page * rowsPerPage,
                      rowsPerPage === 0 ? undefined : (page + 1) * rowsPerPage
                    )
                    .map((coin) => (
                      <GridCard key={coin.id} coin={coin} />
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
