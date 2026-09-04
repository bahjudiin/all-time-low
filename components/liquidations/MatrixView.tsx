"use client";

import { useMemo, useState } from "react";
import { useLiqStore } from "@/lib/liquidationStore";
import { computeMatrix } from "@/lib/aggregate";
import { formatCompact } from "@/lib/format";
import type { MatrixCell } from "@/types/liquidation";

type SortMode = "volume" | "alpha";

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function CellTooltip({ cell }: { cell: MatrixCell }) {
  const range = `${formatTime(cell.bucketStart)} - ${formatTime(cell.bucketEnd)}`;
  return `${cell.symbol} | ${range} | $${formatCompact(cell.totalUsd)} | ${cell.dominantSide}`;
}

export function MatrixView() {
  const events = useLiqStore((s) => s.events);
  const [sortBy, setSortBy] = useState<SortMode>("volume");

  const matrix = useMemo(() => computeMatrix(events, 8), [events]);

  const sorted = useMemo(() => {
    if (sortBy === "alpha") {
      return [...matrix].sort((a, b) => a[0].symbol.localeCompare(b[0].symbol));
    }
    return matrix;
  }, [matrix, sortBy]);

  const bucketLabels = useMemo(() => {
    if (matrix.length === 0 || matrix[0].length === 0) return [];
    return matrix[0].map((cell) => formatTime(cell.bucketStart));
  }, [matrix]);

  if (sorted.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
        No data
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-4 p-4 overflow-auto">
      <div className="flex gap-2">
        <button
          onClick={() => setSortBy("volume")}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
            sortBy === "volume"
              ? "bg-blue-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          Volume ▾
        </button>
        <button
          onClick={() => setSortBy("alpha")}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
            sortBy === "alpha"
              ? "bg-blue-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          A-Z
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider sticky left-0 bg-zinc-900 z-10 min-w-[90px]">
                Symbol
              </th>
              {bucketLabels.map((label, i) => (
                <th
                  key={i}
                  className="px-2 py-2 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider min-w-[60px]"
                >
                  {label}
                </th>
              ))}
              <th className="px-3 py-2 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider min-w-[80px]">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {sorted.map((row) => {
              const symbol = row[0].symbol;
              const totalUsd = row.reduce((s, c) => s + c.totalUsd, 0);
              return (
                <tr key={symbol} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="px-3 py-2 whitespace-nowrap sticky left-0 bg-zinc-900 z-10">
                    <span className="text-sm font-medium text-zinc-200">
                      {symbol}
                    </span>
                  </td>
                  {row.map((cell) => {
                    const bgColor =
                      cell.dominantSide === "long"
                        ? "bg-green-500"
                        : cell.dominantSide === "short"
                          ? "bg-red-500"
                          : "bg-zinc-700";
                    const opacity = cell.intensity * 0.8 + 0.1;
                    return (
                      <td
                        key={cell.bucketIndex}
                        className="px-1 py-1 border border-zinc-800/50"
                      >
                        <div
                          className={`${bgColor} min-w-[60px] h-[40px] rounded-sm flex items-center justify-center transition-opacity`}
                          style={{ opacity }}
                          title={CellTooltip({ cell })}
                        />
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <span className="text-sm text-zinc-300">
                      ${formatCompact(totalUsd)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
