"use client";

import { useLiqStore } from "@/lib/liquidationStore";
import { Search } from "lucide-react";
import type { Exchange } from "@/types/liquidation";

const SIDE_OPTIONS = ["both", "long", "short"] as const;
const EXCHANGES: { label: string; value: Exchange }[] = [
  { label: "Binance", value: "binance" },
  { label: "OKX", value: "okx" },
];
const MIN_USD_PRESETS = [0, 100, 1_000, 10_000, 50_000, 100_000];
const MIN_USD_LABELS = ["$0", "$100", "$1k", "$10k", "$50k", "$100k"];

export function LiqFiltersBar() {
  const filters = useLiqStore((s) => s.filters);
  const setFilters = useLiqStore((s) => s.setFilters);

  const activeIdx = MIN_USD_PRESETS.indexOf(filters.minUsd);

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2">
      <div className="flex items-center rounded-lg overflow-hidden border border-zinc-800">
        {SIDE_OPTIONS.map((side) => {
          const active = filters.side === side;
          return (
            <button
              key={side}
              onClick={() => setFilters({ side })}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-zinc-500 hover:bg-zinc-800"
              }`}
            >
              {side}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1">
        {EXCHANGES.map(({ label, value }) => {
          const active = filters.exchanges.includes(value);
          return (
            <button
              key={value}
              onClick={() => {
                const next = active
                  ? filters.exchanges.filter((e) => e !== value)
                  : [...filters.exchanges, value];
                setFilters({ exchanges: next });
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                active
                  ? "border-blue-600 bg-blue-600/20 text-blue-400"
                  : "border-zinc-800 text-zinc-500 hover:bg-zinc-800"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
        <input
          type="text"
          placeholder="Symbol"
          value={filters.symbolSearch}
          onChange={(e) => setFilters({ symbolSearch: e.target.value })}
          className="max-w-[160px] pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        />
      </div>

      <div className="flex items-center gap-1">
        {MIN_USD_PRESETS.map((val, i) => {
          const active = activeIdx === i;
          return (
            <button
              key={val}
              onClick={() => setFilters({ minUsd: val })}
              className={`px-2.5 py-1.5 text-xs font-medium rounded border transition-colors ${
                active
                  ? "border-blue-600 bg-blue-600/20 text-blue-400"
                  : "border-zinc-800 text-zinc-500 hover:bg-zinc-800"
              }`}
            >
              {MIN_USD_LABELS[i]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
