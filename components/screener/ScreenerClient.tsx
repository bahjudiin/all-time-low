"use client";

import useSWR from "swr";
import { useMemo, useState, useCallback } from "react";
import { Search, ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";
import type { CoinMarket, CoinWithDerived, TabId } from "@/types/coin";
import type { CoinSignals, SignalDirection } from "@/types/signal";
import { computeDerived } from "@/lib/coingecko";
import { useScreenerStore, setActiveTab } from "@/lib/store";
import { DataTable } from "./DataTable";
import { Toolbar } from "./Toolbar";
import { MarketGlance } from "./MarketGlance";
import { isStable, isLowVolatility, hasNoMovement } from "@/lib/filters";
import { SignalCardDetailed } from "@/components/signals/SignalCardDetailed";
import { OvervaluedUndervaluedClient } from "@/components/overvalued/OvervaluedUndervaluedClient";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function GridCard({ coin }: { coin: CoinWithDerived }) {
  return (
    <div className="grid-card rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 hover:border-blue-500/50 transition-colors">
      <div className="flex items-center gap-2.5 mb-2">
        <img src={coin.image} alt={coin.name} className="w-7 h-7 rounded-full" loading="lazy" />
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{coin.name}</div>
          <div className="text-[10px] text-zinc-500 uppercase">{coin.symbol}</div>
        </div>
      </div>
      <div className="text-base font-semibold mb-1.5">
        ${coin.current_price.toLocaleString()}
      </div>
      <div className="flex justify-between text-[11px]">
        <span className={coin.ath_change_percentage > -50 ? "text-red-500" : "text-zinc-500"}>
          ATH: {coin.ath_change_percentage.toFixed(1)}%
        </span>
        <span className="text-zinc-500">Vol: ${coin.total_volume >= 1e9 ? `${(coin.total_volume / 1e9).toFixed(1)}B` : `${(coin.total_volume / 1e6).toFixed(0)}M`}</span>
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

  const [signalSort, setSignalSort] = useState<"score" | "ath" | "24h">("score");
  const [signalDir, setSignalDir] = useState<"all" | SignalDirection>("all");
  const [signalSearch, setSignalSearch] = useState("");

  const { data: rawCoins, isLoading } = useSWR<CoinMarket[]>(
    `/api/coins?currency=${currency}`,
    fetcher,
    {
      fallbackData: initialCoins,
      refreshInterval: 120_000,
      revalidateOnFocus: false,
      revalidateOnMount: false,
      dedupingInterval: 60_000,
    }
  );

  const { data: signalCoins, isLoading: signalsLoading } = useSWR<(CoinMarket & { signals?: CoinSignals })[]>(
    activeTab === "ath-signals" ? `/api/signals?currency=${currency}` : null,
    fetcher,
    {
      refreshInterval: 300_000,
      revalidateOnFocus: false,
      dedupingInterval: 120_000,
    }
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
        return [...coins].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
      case "losers":
        return [...coins].sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
      case "near-ath":
        return [...coins].filter((c) => c.ath_change_percentage >= -15 && c.ath_change_percentage < 0).sort((a, b) => b.market_cap - a.market_cap);
      case "near-atl":
        return [...coins].filter((c) => c.atl_change_percentage <= 15 && c.atl_change_percentage > 0).sort((a, b) => b.market_cap - a.market_cap);
      case "biggest-drop":
        return [...coins].sort((a, b) => a.ath_change_percentage - b.ath_change_percentage).slice(0, 30);
      case "biggest-pump":
        return [...coins].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 30);
      case "biggest-dump":
        return [...coins].sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0, 30);
      case "overvalued-undervalued":
        return [...coins].sort((a, b) => {
          const aScore = (a.atl_change_percentage * -0.6) + (a.price_change_percentage_24h * -0.4);
          const bScore = (b.atl_change_percentage * -0.6) + (b.price_change_percentage_24h * -0.4);
          return bScore - aScore;
        });
      case "all":
      default:
        return [...coins].sort((a, b) => b.market_cap - a.market_cap);
    }
  }, [coins, activeTab]);

  const filteredCoins = useMemo(() => {
    let result = tabCoins;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
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
      result = result.filter((c) => c.ath_change_percentage >= min && c.ath_change_percentage <= max);
    }
    if (filters.pctFromATL) {
      const [min, max] = filters.pctFromATL;
      result = result.filter((c) => c.atl_change_percentage >= min && c.atl_change_percentage <= max);
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
    let result = signalCoins
      .map((c) => ({ ...c, ...computeDerived(c) }))
      .filter((c) => c.signals && !isStable(c as never) && !isLowVolatility(c as never));

    if (signalSearch) {
      const q = signalSearch.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
    }

    if (signalDir !== "all") {
      result = result.filter((c) => c.signals?.direction === signalDir);
    }

    result.sort((a, b) => {
      if (!a.signals || !b.signals) return 0;
      if (signalSort === "score") return Math.abs(b.signals.score) - Math.abs(a.signals.score);
      if (signalSort === "ath") return b.ath_change_percentage - a.ath_change_percentage;
      return b.price_change_percentage_24h - a.price_change_percentage_24h;
    });

    return result;
  }, [signalCoins, signalSort, signalDir, signalSearch]);

  const signalSummary = useMemo(() => {
    if (!signalCoins) return null;
    const withSignals = signalCoins.filter((c) => c.signals);
    return {
      total: withSignals.length,
      strongLong: withSignals.filter((c) => c.signals?.direction === "strong_long").length,
      long: withSignals.filter((c) => c.signals?.direction === "long" || c.signals?.direction === "lean_long").length,
      short: withSignals.filter((c) => c.signals?.direction === "short" || c.signals?.direction === "lean_short").length,
      strongShort: withSignals.filter((c) => c.signals?.direction === "strong_short").length,
    };
  }, [signalCoins]);

  const TABS: { id: TabId; label: string; icon?: string }[] = [
    { id: "ath-signals", label: "Signals", icon: "⚡" },
    { id: "all", label: "All" },
    { id: "near-ath", label: "Near ATH", icon: "📈" },
    { id: "near-atl", label: "Near ATL", icon: "📉" },
    { id: "gainers", label: "Gainers" },
    { id: "losers", label: "Losers" },
    { id: "biggest-pump", label: "Pump", icon: "🚀" },
    { id: "biggest-dump", label: "Dump", icon: "💥" },
    { id: "biggest-drop", label: "From ATH" },
    { id: "overvalued-undervalued", label: "O/U", icon: "📊" },
  ];

  const handleSignalSearch = useCallback((value: string) => {
    setSignalSearch(value);
  }, []);

  return (
    <>
      {/* Tabs - Mobile: horizontal scroll */}
      <div className="scroll-x border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1 px-3 md:px-6 py-2 min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 md:px-3 py-1.5 text-xs md:text-sm font-medium rounded-md whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {tab.icon && <span className="mr-1">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Market Glance - all tabs */}
      <MarketGlance coins={coins} />

      {activeTab === "ath-signals" ? (
        <>
          {/* Signal controls bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 px-3 md:px-6 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search signals..."
                value={signalSearch}
                onChange={(e) => handleSignalSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Direction filter */}
            <div className="flex items-center gap-1">
              {(["all", "strong_long", "long", "short", "strong_short"] as const).map((dir) => (
                <button
                  key={dir}
                  onClick={() => setSignalDir(dir)}
                  className={`px-2 py-1 text-[10px] md:text-xs font-medium rounded transition-colors ${
                    signalDir === dir
                      ? dir === "strong_long" || dir === "long"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : dir === "strong_short" || dir === "short"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-blue-600 text-white"
                      : "text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  {dir === "all" ? "All" : dir === "strong_long" ? "Strong Long" : dir === "long" ? "Long" : dir === "short" ? "Short" : "Strong Short"}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-zinc-500" />
              {(["score", "ath", "24h"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSignalSort(s)}
                  className={`px-2 py-1 text-[10px] md:text-xs font-medium rounded transition-colors ${
                    signalSort === s
                      ? "bg-blue-600 text-white"
                      : "text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  {s === "score" ? "Score" : s === "ath" ? "ATH Dist" : "24h"}
                </button>
              ))}
            </div>

            {/* Summary */}
            {signalSummary && (
              <div className="hidden md:flex items-center gap-3 text-[11px] ml-auto">
                <span className="text-emerald-400 font-medium">{signalSummary.strongLong} SL</span>
                <span className="text-emerald-300">{signalSummary.long} L</span>
                <span className="text-red-300">{signalSummary.short} S</span>
                <span className="text-red-400 font-medium">{signalSummary.strongShort} SS</span>
                <span className="text-zinc-500">{signalSummary.total} total</span>
              </div>
            )}
          </div>

          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {signalsLoading && (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-zinc-500">Computing signals...</p>
                </div>
              </div>
            )}

            {!signalsLoading && signalCoinsWithDerived.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-zinc-500">No signals match filters</p>
              </div>
            )}

            {!signalsLoading && signalCoinsWithDerived.length > 0 && (
              <div className="flex-1 overflow-auto p-3 md:p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
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
        </>
      ) : activeTab === "overvalued-undervalued" ? (
        <OvervaluedUndervaluedClient />
      ) : (
        <>
          <Toolbar data={filteredCoins} activeFilterCount={activeFilterCount} />
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {isLoading && tabCoins.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-zinc-500">Loading...</p>
                </div>
              </div>
            )}

            {!isLoading && tabCoins.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-zinc-500">No coins found</p>
              </div>
            )}

            {!isLoading && filteredCoins.length === 0 && tabCoins.length > 0 && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xs text-zinc-500 mb-2">No matches</p>
                  <button
                    onClick={() => useScreenerStore.setState({ search: "", filters: { marketCap: null, volume: null, pctFromATH: null, pctFromATL: null, athDateRange: null } })}
                    className="text-xs text-blue-500 hover:text-blue-400"
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            )}

            {!isLoading && filteredCoins.length > 0 && (
              layout === "table" ? (
                <DataTable data={filteredCoins} />
              ) : (
                <div className="flex-1 overflow-auto p-3 md:p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                    {filteredCoins
                      .slice(rowsPerPage === 0 ? 0 : page * rowsPerPage, rowsPerPage === 0 ? undefined : (page + 1) * rowsPerPage)
                      .map((coin) => (
                        <GridCard key={coin.id} coin={coin} />
                      ))}
                  </div>
                </div>
              )
            )}
          </main>
        </>
      )}
    </>
  );
}
