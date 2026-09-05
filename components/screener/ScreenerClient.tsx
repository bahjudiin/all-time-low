"use client";

import useSWR from "swr";
import { useMemo } from "react";
import type { CoinMarket, CoinWithDerived, TabId } from "@/types/coin";
import type { CoinSignals } from "@/types/signal";
import { computeDerived } from "@/lib/coingecko";
import { useScreenerStore, setActiveTab } from "@/lib/store";
import { DataTable } from "./DataTable";
import { Toolbar } from "./Toolbar";
import { MarketGlance } from "./MarketGlance";
import { isStable, isLowVolatility, hasNoMovement } from "@/lib/filters";
import { SignalCardDetailed } from "@/components/signals/SignalCardDetailed";

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
  const { currency, layout, search, filters, page, rowsPerPage, activeTab } =
    useScreenerStore();

  const { data: rawCoins, isLoading } = useSWR<CoinMarket[]>(
    `/api/coins?currency=${currency}`,
    fetcher,
    {
      fallbackData: initialCoins,
      refreshInterval: 60_000,
      revalidateOnFocus: true,
      revalidateOnMount: false,
    }
  );

  const { data: signalCoins, isLoading: signalsLoading } = useSWR<(CoinMarket & { signals?: CoinSignals })[]>(
    activeTab === "ath-signals" ? `/api/signals?currency=${currency}` : null,
    fetcher,
    { refreshInterval: 60_000 }
  );

  const coins: CoinWithDerived[] = useMemo(() => {
    if (!rawCoins) return [];
    return rawCoins
      .map((coin) => ({ ...coin, ...computeDerived(coin) }))
      .filter((c) => !isStable(c) && !isLowVolatility(c) && !hasNoMovement(c));
  }, [rawCoins]);

  const tabCoins = useMemo(() => {
    switch (activeTab) {
      case "gainers":
        return [...coins].sort(
          (a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h
        );
      case "losers":
        return [...coins].sort(
          (a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h
        );
      case "near-ath":
        return [...coins]
          .filter((c) => c.ath_change_percentage >= -15 && c.ath_change_percentage < 0)
          .sort((a, b) => b.market_cap - a.market_cap);
      case "near-atl":
        return [...coins]
          .filter((c) => c.atl_change_percentage <= 15 && c.atl_change_percentage > 0)
          .sort((a, b) => b.market_cap - a.market_cap);
      case "biggest-drop":
        return [...coins]
          .sort((a, b) => a.ath_change_percentage - b.ath_change_percentage)
          .slice(0, 30);
      case "biggest-pump":
        return [...coins]
          .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
          .slice(0, 30);
      case "biggest-dump":
        return [...coins]
          .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
          .slice(0, 30);
      case "all":
      default:
        return [...coins].sort((a, b) => b.market_cap - a.market_cap);
    }
  }, [coins, activeTab]);

  const filteredCoins = useMemo(() => {
    let result = tabCoins;
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
  }, [tabCoins, search, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.marketCap) count++;
    if (filters.volume) count++;
    if (filters.pctFromATH) count++;
    if (filters.pctFromATL) count++;
    if (filters.athDateRange) count++;
    return count;
  }, [filters]);

  const signalCoinsWithDerived = useMemo(() => {
    if (!signalCoins) return [];
    return signalCoins
      .map((c) => ({ ...c, ...computeDerived(c) }))
      .filter((c) => c.signals && !isStable(c as never) && !isLowVolatility(c as never));
  }, [signalCoins]);

  const TABS: { id: TabId; label: string }[] = [
    { id: "ath-signals", label: "ATH/ATL Signals" },
    { id: "all", label: "All Coins" },
    { id: "near-ath", label: "Near ATH" },
    { id: "near-atl", label: "Near ATL" },
    { id: "gainers", label: "Gainers" },
    { id: "losers", label: "Losers" },
    { id: "biggest-pump", label: "Biggest Pump" },
    { id: "biggest-dump", label: "Biggest Dump" },
    { id: "biggest-drop", label: "From ATH" },
  ];

  return (
    <>
      {/* Sub-nav tabs */}
      <div className="flex items-center gap-1 px-6 py-2 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab !== "ath-signals" && (
        <MarketGlance coins={coins} />
      )}

      {activeTab !== "ath-signals" && (
        <Toolbar data={filteredCoins} activeFilterCount={activeFilterCount} />
      )}

      {activeTab === "ath-signals" ? (
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {signalsLoading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-zinc-500">Computing ATH/ATL signals...</p>
              </div>
            </div>
          )}

          {!signalsLoading && signalCoinsWithDerived.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-zinc-500 mb-2">No signals available</p>
                <p className="text-xs text-zinc-600">Exchange data is being fetched</p>
              </div>
            </div>
          )}

          {!signalsLoading && signalCoinsWithDerived.length > 0 && (
            <div className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {signalCoinsWithDerived.map((coin) => (
                  <SignalCardDetailed
                    key={coin.id}
                    coin={coin as CoinWithDerived}
                    signals={coin.signals!}
                  />
                ))}
              </div>
            </div>
          )}
        </main>
      ) : (
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {isLoading && tabCoins.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-zinc-500">Loading coin data...</p>
              </div>
            </div>
          )}

          {!isLoading && tabCoins.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-zinc-500 mb-2">No extreme coins found</p>
              </div>
            </div>
          )}

          {!isLoading && filteredCoins.length === 0 && tabCoins.length > 0 && (
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
      )}
    </>
  );
}
