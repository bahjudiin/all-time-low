"use client";

import { useScreenerStore, setFilters, clearFilters } from "@/lib/store";
import { X } from "lucide-react";

interface FilterPanelProps {
  onClose: () => void;
}

export function FilterPanel({ onClose }: FilterPanelProps) {
  const { filters } = useScreenerStore();

  const update = (key: string, value: [number, number] | null) => {
    setFilters({ [key]: value });
  };

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Filters
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={clearFilters}
            className="text-xs text-blue-500 hover:text-blue-400"
          >
            Clear all
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FilterRange
          label="Market Cap"
          value={filters.marketCap}
          onChange={(v) => update("marketCap", v)}
          min={0}
          max={3_000_000_000_000}
          step={1_000_000_000}
          formatFn={(n) => `$${(n / 1e9).toFixed(0)}B`}
        />
        <FilterRange
          label="Volume (24h)"
          value={filters.volume}
          onChange={(v) => update("volume", v)}
          min={0}
          max={100_000_000_000}
          step={1_000_000_000}
          formatFn={(n) => `$${(n / 1e9).toFixed(1)}B`}
        />
        <FilterRange
          label="% from ATH"
          value={filters.pctFromATH}
          onChange={(v) => update("pctFromATH", v)}
          min={-100}
          max={0}
          step={1}
          formatFn={(n) => `${n}%`}
        />
        <FilterRange
          label="% from ATL"
          value={filters.pctFromATL}
          onChange={(v) => update("pctFromATL", v)}
          min={0}
          max={10000}
          step={100}
          formatFn={(n) => `+${n}%`}
        />
      </div>
    </div>
  );
}

interface FilterRangeProps {
  label: string;
  value: [number, number] | null;
  onChange: (v: [number, number] | null) => void;
  min: number;
  max: number;
  step: number;
  formatFn: (n: number) => string;
}

function FilterRange({
  label,
  value,
  onChange,
  min,
  max,
  step,
  formatFn,
}: FilterRangeProps) {
  const minVal = value?.[0] ?? min;
  const maxVal = value?.[1] ?? max;
  const hasValue = value !== null;

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
        {hasValue && (
          <button
            onClick={() => onChange(null)}
            className="ml-2 text-blue-500 hover:text-blue-400"
          >
            clear
          </button>
        )}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange([v, maxVal]);
          }}
          className="flex-1 accent-blue-600"
        />
        <span className="text-xs text-zinc-500 dark:text-zinc-400 w-16 text-right">
          {formatFn(minVal)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange([minVal, v]);
          }}
          className="flex-1 accent-blue-600"
        />
        <span className="text-xs text-zinc-500 dark:text-zinc-400 w-16 text-right">
          {formatFn(maxVal)}
        </span>
      </div>
    </div>
  );
}
