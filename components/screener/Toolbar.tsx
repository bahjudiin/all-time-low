"use client";

import { useState, useCallback } from "react";
import { Search, SlidersHorizontal, Table, LayoutGrid } from "lucide-react";
import { useScreenerStore, setSearch, setLayout } from "@/lib/store";
import { FilterPanel } from "./FilterPanel";
import type { CoinWithDerived } from "@/types/coin";

interface ToolbarProps {
  data: CoinWithDerived[];
  activeFilterCount: number;
}

export function Toolbar({ data, activeFilterCount }: ToolbarProps) {
  const { search, layout } = useScreenerStore();
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(search);

  const handleSearch = useCallback(
    (value: string) => {
      setSearchInput(value);
      const timeout = setTimeout(() => setSearch(value), 300);
      return () => clearTimeout(timeout);
    },
    []
  );

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search coins..."
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className="relative flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className="flex items-center rounded-lg border border-zinc-300 dark:border-zinc-700 overflow-hidden">
          <button
            onClick={() => setLayout("table")}
            className={`p-2 transition-colors ${
              layout === "table"
                ? "bg-blue-600 text-white"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            aria-label="Table view"
          >
            <Table className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLayout("grid")}
            className={`p-2 transition-colors ${
              layout === "grid"
                ? "bg-blue-600 text-white"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            aria-label="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {filterOpen && (
        <FilterPanel onClose={() => setFilterOpen(false)} />
      )}
    </>
  );
}
