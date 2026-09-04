"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { useLiqStore } from "@/lib/liquidationStore";
import { detectSweeps } from "@/lib/sweeps";
import {
  SWEEP_WINDOW_MS,
  SWEEP_PRICE_BAND_PCT,
  SWEEP_MIN_EVENTS,
  type SweepRecord,
} from "@/types/liquidation";
import { formatCompact } from "@/lib/format";

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDuration(ms: number): string {
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ChevronUp className="w-3 h-3 inline ml-1" />;
  if (sorted === "desc")
    return <ChevronDown className="w-3 h-3 inline ml-1" />;
  return <ChevronsUpDown className="w-3 h-3 inline ml-1 opacity-40" />;
}

const h = createColumnHelper<SweepRecord>();

const columns = [
  h.accessor("symbol", {
    header: "Symbol",
    cell: (info) => (
      <span className="text-sm font-medium">{info.getValue()}</span>
    ),
    size: 100,
  }),
  h.accessor("side", {
    header: "Side",
    cell: (info) => {
      const side = info.getValue();
      const cls =
        side === "long"
          ? "bg-green-500/20 text-green-400"
          : "bg-red-500/20 text-red-400";
      return (
        <span
          className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${cls}`}
        >
          {side}
        </span>
      );
    },
    size: 80,
  }),
  h.accessor("totalUsd", {
    header: "Total $",
    cell: (info) => (
      <span className="text-sm text-zinc-300">
        ${formatCompact(info.getValue())}
      </span>
    ),
    sortingFn: "basic",
    size: 110,
  }),
  h.accessor("count", {
    header: "Count",
    cell: (info) => (
      <span className="text-sm text-zinc-300">{info.getValue()}</span>
    ),
    sortingFn: "basic",
    size: 70,
  }),
  h.accessor("priceMove", {
    header: "Price Δ",
    cell: (info) => {
      const val = info.getValue();
      const color = val < 0 ? "text-red-400" : "text-green-400";
      return (
        <span className={`text-sm ${color}`}>
          {val >= 0 ? "+" : ""}{val.toFixed(1)}%
        </span>
      );
    },
    sortingFn: "basic",
    size: 90,
  }),
  h.accessor("duration", {
    header: "Duration",
    cell: (info) => (
      <span className="text-sm text-zinc-400">
        {formatDuration(info.getValue())}
      </span>
    ),
    sortingFn: "basic",
    size: 90,
  }),
  h.accessor("endTime", {
    header: "Time",
    cell: (info) => (
      <span className="text-xs text-zinc-400">{relativeTime(info.getValue())}</span>
    ),
    sortingFn: "basic",
    size: 90,
  }),
];

export function SweepsTab() {
  const events = useLiqStore((s) => s.events);
  const filters = useLiqStore((s) => s.filters);

  const [sorting, setSorting] = useState<SortingState>([
    { id: "totalUsd", desc: true },
  ]);

  const sweeps = useMemo(() => {
    const detected = detectSweeps(events);
    return detected.filter((s) => {
      if (filters.side !== "both" && s.side !== filters.side) return false;
      if (
        filters.symbolSearch &&
        !s.symbol.toLowerCase().includes(filters.symbolSearch.toLowerCase())
      )
        return false;
      return true;
    });
  }, [events, filters]);

  const table = useReactTable({
    data: sweeps,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-auto">
      <div className="text-xs text-zinc-600">
        Window: {SWEEP_WINDOW_MS / 1000}s | Band: {SWEEP_PRICE_BAND_PCT}% | Min events: {SWEEP_MIN_EVENTS}
      </div>

      {sweeps.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-zinc-500 mb-2">No liquidation cascades detected</p>
            <p className="text-xs text-zinc-600 max-w-md">
              Sweeps appear when 3+ same-side liquidations occur within a 60-second
              window and 0.5% price band.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-3 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider whitespace-nowrap"
                        style={{ width: header.getSize() }}
                        {...(header.column.getCanSort()
                          ? { onClick: header.column.getToggleSortingHandler() }
                          : {})}
                      >
                        <span
                          className={
                            header.column.getCanSort()
                              ? "cursor-pointer select-none hover:text-zinc-200"
                              : ""
                          }
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <SortIcon sorted={header.column.getIsSorted()} />
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-zinc-800/30 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-3 py-2.5 whitespace-nowrap"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
