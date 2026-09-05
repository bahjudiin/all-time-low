"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import type { OvervaluedUndervaluedResult } from "@/lib/overvaluedUndervalued";
import { OVCard } from "./OVCard";
import { OVTable } from "./OVTable";
import { OVSummary } from "./OVSummary";
import { Search } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type FilterKey = "all" | "overvalued" | "undervalued" | "extreme" | "entry-near" | "high-conf";

export function OvervaluedUndervaluedClient() {
  const { data: results, isLoading } = useSWR<OvervaluedUndervaluedResult[]>(
    "/api/overvalued-undervalued",
    fetcher,
    { refreshInterval: 60_000, revalidateOnFocus: true }
  );

  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [minValuation, setMinValuation] = useState(0);
  const [minReversal, setMinReversal] = useState(0);

  const filtered = useMemo(() => {
    if (!results) return [];
    let r = [...results];

    const q = search.toLowerCase();
    if (q) {
      r = r.filter((x) => x.name.toLowerCase().includes(q) || x.symbol.toLowerCase().includes(q));
    }

    switch (filter) {
      case "overvalued":
        r = r.filter((x) => x.direction === "overvalued");
        break;
      case "undervalued":
        r = r.filter((x) => x.direction === "undervalued");
        break;
      case "extreme":
        r = r.filter((x) => (x.direction === "overvalued" ? x.overvaluationScore : x.undervaluationScore) >= 85);
        break;
      case "entry-near":
        r = r.filter((x) => x.signalState === "ENTRY_NEAR" || x.signalState === "ENTRY_TOUCHED" || x.signalState === "WAITING_FOR_ENTRY");
        break;
      case "high-conf":
        r = r.filter((x) => x.finalConfidence >= 70);
        break;
    }

    if (minValuation > 0) {
      r = r.filter((x) => (x.direction === "overvalued" ? x.overvaluationScore : x.undervaluationScore) >= minValuation);
    }
    if (minReversal > 0) {
      r = r.filter((x) => x.reversalProbability >= minReversal);
    }

    r.sort((a, b) => b.opportunityScore - a.opportunityScore || b.finalConfidence - a.finalConfidence);
    return r;
  }, [results, filter, search, minValuation, minReversal]);

  const filterBtn = (key: FilterKey, label: string) => (
    <button
      key={key}
      onClick={() => setFilter(key)}
      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
        filter === key
          ? "bg-blue-600 text-white"
          : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <OVSummary results={results || []} />

      {/* Filter bar */}
      <div className="flex items-center gap-3 px-6 py-2 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <div className="flex items-center gap-1">
          {filterBtn("all", "All")}
          {filterBtn("overvalued", "Overvalued")}
          {filterBtn("undervalued", "Undervalued")}
          {filterBtn("extreme", "Extreme")}
          {filterBtn("entry-near", "Entry Near")}
          {filterBtn("high-conf", "High Conf")}
        </div>

        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800" />

        {/* Min valuation */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-zinc-500">Valuation</span>
          {[0, 60, 70, 80, 90].map((v) => (
            <button
              key={v}
              onClick={() => setMinValuation(v)}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                minValuation === v ? "bg-blue-600 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {v === 0 ? "Any" : `${v}+`}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800" />

        {/* Min reversal */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-zinc-500">Reversal</span>
          {[0, 60, 70, 80].map((v) => (
            <button
              key={v}
              onClick={() => setMinReversal(v)}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                minReversal === v ? "bg-blue-600 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {v === 0 ? "Any" : `${v}+`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search coins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-md p-0.5">
          <button
            onClick={() => setViewMode("table")}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === "table" ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm" : "text-zinc-500 hover:text-foreground"
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === "cards" ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm" : "text-zinc-500 hover:text-foreground"
            }`}
          >
            Cards
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-zinc-500">Scanning futures for stretched coins...</p>
              <p className="text-xs text-zinc-600">Computing fair value, crowding, exhaustion</p>
            </div>
          </div>
        )}

        {!isLoading && !results?.length && (
          <div className="flex items-center justify-center h-64">
            <p className="text-zinc-500">No futures data available</p>
          </div>
        )}

        {!isLoading && filtered.length === 0 && results?.length && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-zinc-500 mb-2">No coins match your filters</p>
              <button
                onClick={() => {
                  setFilter("all");
                  setSearch("");
                  setMinValuation(0);
                  setMinReversal(0);
                }}
                className="text-sm text-blue-500 hover:text-blue-400"
              >
                Clear filters
              </button>
            </div>
          </div>
        )}

        {!isLoading && filtered.length > 0 && viewMode === "table" && (
          <OVTable results={filtered} />
        )}

        {!isLoading && filtered.length > 0 && viewMode === "cards" && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((r) => (
              <OVCard key={r.symbol} result={r} />
            ))}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="px-6 py-1.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <p className="text-[10px] text-zinc-500 text-center">
          Statistical fair-value analysis only — predicted entries and reversion targets are estimates, not guarantees. Not financial advice.
        </p>
      </div>
    </div>
  );
}