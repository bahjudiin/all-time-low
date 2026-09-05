"use client";

import useSWR from "swr";
import { useMemo } from "react";
import { usePredictionStore } from "@/lib/predictionStore";
import type { CoinPrediction } from "@/types/prediction";
import { PredictionTable } from "./PredictionTable";
import { PredictionCards } from "./PredictionCards";
import { PredictionDetail } from "./PredictionDetail";
import { PredictionSummary } from "./PredictionSummary";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function PredictionClient() {
  const { data: predictions, isLoading } = useSWR<CoinPrediction[]>(
    "/api/prediction",
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
    }
  );

  const {
    selectedSymbol,
    setSelectedSymbol,
    filters,
    setFilters,
    sortColumn,
    sortDirection,
    setSort,
    viewMode,
    setViewMode,
  } = usePredictionStore();

  const filteredPredictions = useMemo(() => {
    if (!predictions) return [];
    let result = [...predictions];

    if (filters.direction !== "all") {
      result = result.filter((p) => p.direction === filters.direction);
    }
    if (filters.quality !== "all") {
      result = result.filter((p) => p.quality === filters.quality);
    }
    if (filters.state !== "all") {
      result = result.filter((p) => p.state === filters.state);
    }
    if (filters.minExhaustion > 0) {
      result = result.filter((p) => p.exhaustionProbability >= filters.minExhaustion);
    }

    result.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortColumn) {
        case "rsi":
          aVal = a.factors.momentum.rsi;
          bVal = b.factors.momentum.rsi;
          break;
        case "volatility":
          aVal = a.factors.volatility.atrExpansion;
          bVal = b.factors.volatility.atrExpansion;
          break;
        case "volumeZScore":
          aVal = Math.abs(a.factors.volume.volumeZScore);
          bVal = Math.abs(b.factors.volume.volumeZScore);
          break;
        case "approachState":
          const order = { TOUCHING: 0, TOUCHED: 0, NEAR: 1, APPROACHING: 2, REVERSING: 3, FAR: 4, INVALIDATED: 5 };
          aVal = order[a.approachState as keyof typeof order] ?? 5;
          bVal = order[b.approachState as keyof typeof order] ?? 5;
          break;
        default:
          aVal = a[sortColumn] as string | number;
          bVal = b[sortColumn] as string | number;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    return result;
  }, [predictions, filters, sortColumn, sortDirection]);

  const selectedPrediction = useMemo(() => {
    if (!selectedSymbol || !predictions) return null;
    return predictions.find((p) => p.symbol === selectedSymbol) || null;
  }, [selectedSymbol, predictions]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <PredictionSummary predictions={predictions || []} />

      {/* Filter bar */}
      <div className="flex items-center gap-3 px-6 py-2 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        {/* Direction */}
        <div className="flex items-center gap-1">
          {(["all", "SHORT", "LONG"] as const).map((dir) => (
            <button
              key={dir}
              onClick={() => setFilters({ direction: dir })}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filters.direction === dir
                  ? dir === "SHORT"
                    ? "bg-red-500/20 text-red-400"
                    : dir === "LONG"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-blue-600 text-white"
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {dir === "all" ? "All" : dir}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800" />

        {/* Quality */}
        <div className="flex items-center gap-1">
          {(["all", "A+", "A", "B", "C", "WATCH"] as const).map((q) => (
            <button
              key={q}
              onClick={() => setFilters({ quality: q })}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filters.quality === q
                  ? "bg-blue-600 text-white"
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {q === "all" ? "All Q" : q}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800" />

        {/* Min Exhaustion */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-zinc-500">Exhaust:</span>
          {[0, 50, 60, 70, 80].map((val) => (
            <button
              key={val}
              onClick={() => setFilters({ minExhaustion: val })}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                filters.minExhaustion === val
                  ? "bg-blue-600 text-white"
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {val === 0 ? "Any" : `${val}%+`}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800" />

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-md p-0.5">
          <button
            onClick={() => setViewMode("table")}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === "table"
                ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm"
                : "text-zinc-500 hover:text-foreground"
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === "cards"
                ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm"
                : "text-zinc-500 hover:text-foreground"
            }`}
          >
            Cards
          </button>
        </div>

        {/* Sort dropdown */}
        <select
          value={sortColumn}
          onChange={(e) => setSort(e.target.value as typeof sortColumn, sortDirection)}
          className="px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 rounded-md border-0 text-foreground cursor-pointer"
        >
          <option value="exhaustionProbability">Exhaustion %</option>
          <option value="agreeingClusters">Clusters</option>
          <option value="movePercent">Move %</option>
          <option value="distanceToZonePct">Distance</option>
          <option value="zoneReachProbability">Reach %</option>
          <option value="rsi">RSI</option>
          <option value="volatility">ATR Expansion</option>
          <option value="volumeZScore">Volume Z</option>
          <option value="currentPrice">Price</option>
          <option value="approachState">Approach</option>
        </select>

        <button
          onClick={() => setSort(sortColumn, sortDirection === "desc" ? "asc" : "desc")}
          className="px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          {sortDirection === "desc" ? "↓" : "↑"}
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Data view */}
        <div className={`flex-1 min-h-0 overflow-auto ${selectedPrediction ? "border-r border-zinc-200 dark:border-zinc-800" : ""}`}>
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-zinc-500">Scanning low-cap coins...</p>
                <p className="text-xs text-zinc-600">This may take a moment</p>
              </div>
            </div>
          )}

          {!isLoading && filteredPredictions.length === 0 && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-zinc-500 mb-2">No predictions match your filters</p>
                <button
                  onClick={() =>
                    setFilters({
                      direction: "all",
                      quality: "all",
                      state: "all",
                      minExhaustion: 0,
                    })
                  }
                  className="text-sm text-blue-500 hover:text-blue-400"
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}

          {!isLoading && filteredPredictions.length > 0 && viewMode === "table" && (
            <PredictionTable
              predictions={filteredPredictions}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={setSort}
              onSelect={setSelectedSymbol}
              selectedSymbol={selectedSymbol}
            />
          )}

          {!isLoading && filteredPredictions.length > 0 && viewMode === "cards" && (
            <PredictionCards
              predictions={filteredPredictions}
              onSelect={setSelectedSymbol}
              selectedSymbol={selectedSymbol}
            />
          )}
        </div>

        {/* Detail panel */}
        {selectedPrediction && (
          <div className="w-[420px] min-h-0 overflow-auto flex-shrink-0">
            <PredictionDetail
              prediction={selectedPrediction}
              onClose={() => setSelectedSymbol(null)}
            />
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="px-6 py-1.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <p className="text-[10px] text-zinc-500 text-center">
          Low-cap coins only — high volatility, high risk. Probabilistic prediction only — not financial advice.
        </p>
      </div>
    </div>
  );
}
