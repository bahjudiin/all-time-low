"use client";

import useSWR from "swr";
import { useMemo } from "react";
import { usePredictionStore } from "@/lib/predictionStore";
import type { CoinPrediction } from "@/types/prediction";
import { PredictionTable } from "./PredictionTable";
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
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
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
              {q === "all" ? "All Quality" : q}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800" />

        <div className="flex items-center gap-1">
          <span className="text-xs text-zinc-500">Min Exhaustion:</span>
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
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Table */}
        <div className={`flex-1 min-h-0 overflow-auto ${selectedPrediction ? "border-r border-zinc-200 dark:border-zinc-800" : ""}`}>
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-zinc-500">Loading predictions...</p>
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

          {!isLoading && filteredPredictions.length > 0 && (
            <PredictionTable
              predictions={filteredPredictions}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={setSort}
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
          Probabilistic prediction only — not financial advice. Zones are estimated exhaustion areas, not guaranteed reversal points.
        </p>
      </div>
    </div>
  );
}
