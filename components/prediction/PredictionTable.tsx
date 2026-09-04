"use client";

import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import type {
  CoinPrediction,
  PredictionSortColumn,
} from "@/types/prediction";

interface PredictionTableProps {
  predictions: CoinPrediction[];
  sortColumn: PredictionSortColumn;
  sortDirection: "asc" | "desc";
  onSort: (column: PredictionSortColumn, direction: "asc" | "desc") => void;
  onSelect: (symbol: string | null) => void;
  selectedSymbol: string | null;
}

function formatPrice(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(6)}`;
}

function getStateColor(state: string): string {
  switch (state) {
    case "extreme":
    case "exhaustion_building":
      return "text-red-400";
    case "target_forming":
    case "limit_zone":
      return "text-amber-400";
    case "touched":
    case "reversing":
      return "text-purple-400";
    case "extended":
      return "text-orange-400";
    case "accelerating":
      return "text-yellow-400";
    case "move_detected":
      return "text-blue-400";
    case "invalidated":
      return "text-zinc-500";
    default:
      return "text-zinc-500";
  }
}

function getQualityBadge(quality: string): { bg: string; text: string } {
  switch (quality) {
    case "A+":
      return { bg: "bg-amber-500/20", text: "text-amber-400" };
    case "A":
      return { bg: "bg-green-500/20", text: "text-green-400" };
    case "B":
      return { bg: "bg-blue-500/20", text: "text-blue-400" };
    case "C":
      return { bg: "bg-zinc-500/20", text: "text-zinc-400" };
    case "WATCH":
      return { bg: "bg-zinc-500/10", text: "text-zinc-500" };
    default:
      return { bg: "bg-zinc-500/10", text: "text-zinc-500" };
  }
}

function getApproachBadge(state: string): { bg: string; text: string } {
  switch (state) {
    case "TOUCHING":
    case "TOUCHED":
      return { bg: "bg-purple-500/20", text: "text-purple-400" };
    case "NEAR":
      return { bg: "bg-amber-500/20", text: "text-amber-400" };
    case "APPROACHING":
      return { bg: "bg-blue-500/20", text: "text-blue-400" };
    case "REVERSING":
      return { bg: "bg-green-500/20", text: "text-green-400" };
    default:
      return { bg: "bg-zinc-500/10", text: "text-zinc-500" };
  }
}

export function PredictionTable({
  predictions,
  sortColumn,
  sortDirection,
  onSort,
  onSelect,
  selectedSymbol,
}: PredictionTableProps) {
  const columns: ColumnDef<CoinPrediction>[] = useMemo(
    () => [
      {
        accessorKey: "symbol",
        header: "Symbol",
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex items-center gap-2">
              <img
                src={p.image}
                alt={p.name}
                className="w-5 h-5 rounded-full"
                loading="lazy"
              />
              <div>
                <div className="font-medium text-xs">{p.symbol}</div>
                <div className="text-[10px] text-zinc-500 truncate max-w-[80px]">
                  {p.name}
                </div>
              </div>
            </div>
          );
        },
        size: 120,
      },
      {
        accessorKey: "movePercent",
        header: "Move",
        cell: ({ getValue }) => {
          const val = getValue() as number;
          return (
            <span
              className={`text-xs font-mono ${
                val > 0 ? "text-green-400" : val < 0 ? "text-red-400" : "text-zinc-500"
              }`}
            >
              {val > 0 ? "+" : ""}
              {val.toFixed(1)}%
            </span>
          );
        },
        size: 70,
      },
      {
        accessorKey: "state",
        header: "State",
        cell: ({ getValue }) => {
          const val = getValue() as string;
          return (
            <span className={`text-[10px] font-medium uppercase ${getStateColor(val)}`}>
              {val.replace(/_/g, " ")}
            </span>
          );
        },
        size: 110,
      },
      {
        accessorKey: "currentPrice",
        header: "Current",
        cell: ({ getValue }) => (
          <span className="text-xs font-mono text-foreground">
            {formatPrice(getValue() as number)}
          </span>
        ),
        size: 90,
      },
      {
        accessorKey: "predictedZone",
        header: "Predicted Zone",
        cell: ({ getValue, row }) => {
          const zone = getValue() as CoinPrediction["predictedZone"];
          const dir = row.original.direction;
          return (
            <div className="text-[10px] font-mono">
              <div className={dir === "SHORT" ? "text-red-400" : "text-green-400"}>
                {formatPrice(zone.upper)}
              </div>
              <div className="text-zinc-500">—</div>
              <div className={dir === "SHORT" ? "text-red-400" : "text-green-400"}>
                {formatPrice(zone.lower)}
              </div>
            </div>
          );
        },
        size: 100,
      },
      {
        accessorKey: "distanceToZonePct",
        header: "Distance",
        cell: ({ getValue }) => {
          const val = getValue() as number;
          return (
            <span className={`text-xs font-mono ${val < 0.5 ? "text-purple-400" : val < 1.5 ? "text-amber-400" : "text-zinc-500"}`}>
              {val.toFixed(1)}%
            </span>
          );
        },
        size: 65,
      },
      {
        accessorKey: "approachState",
        header: "Approach",
        cell: ({ getValue }) => {
          const val = getValue() as string;
          const badge = getApproachBadge(val);
          return (
            <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded ${badge.bg} ${badge.text}`}>
              {val}
            </span>
          );
        },
        size: 85,
      },
      {
        accessorKey: "zoneReachProbability",
        header: "Reach %",
        cell: ({ getValue }) => {
          const val = getValue() as number;
          return (
            <div className="flex items-center gap-1.5">
              <div className="w-10 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${val}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-zinc-400">{val}%</span>
            </div>
          );
        },
        size: 80,
      },
      {
        accessorKey: "exhaustionProbability",
        header: "Exhaust %",
        cell: ({ getValue }) => {
          const val = getValue() as number;
          return (
            <div className="flex items-center gap-1.5">
              <div className="w-10 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${val >= 70 ? "bg-red-500" : val >= 50 ? "bg-amber-500" : "bg-zinc-600"}`}
                  style={{ width: `${val}%` }}
                />
              </div>
              <span className={`text-[10px] font-mono ${val >= 70 ? "text-red-400" : val >= 50 ? "text-amber-400" : "text-zinc-400"}`}>
                {val}%
              </span>
            </div>
          );
        },
        size: 90,
      },
      {
        accessorKey: "continuationProbability",
        header: "Cont %",
        cell: ({ getValue }) => {
          const val = getValue() as number;
          return (
            <span className={`text-[10px] font-mono ${val < 30 ? "text-green-400" : "text-zinc-400"}`}>
              {val}%
            </span>
          );
        },
        size: 55,
      },
      {
        accessorKey: "quality",
        header: "Quality",
        cell: ({ getValue }) => {
          const val = getValue() as string;
          const badge = getQualityBadge(val);
          return (
            <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-bold rounded ${badge.bg} ${badge.text}`}>
              {val}
            </span>
          );
        },
        size: 55,
      },
      {
        accessorKey: "direction",
        header: "Dir",
        cell: ({ getValue }) => {
          const val = getValue() as string;
          return (
            <span
              className={`text-[10px] font-bold ${
                val === "SHORT" ? "text-red-400" : "text-green-400"
              }`}
            >
              {val}
            </span>
          );
        },
        size: 50,
      },
      {
        accessorKey: "invalidation",
        header: "Invalidation",
        cell: ({ getValue }) => (
          <span className="text-[10px] font-mono text-zinc-500">
            {formatPrice(getValue() as number)}
          </span>
        ),
        size: 90,
      },
    ],
    []
  );

  const table = useReactTable({
    data: predictions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col h-full">
      <table className="w-full text-left">
        <thead className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const col = header.column;
                const sortKey = col.id as PredictionSortColumn;
                const isSorted = sortColumn === sortKey;
                return (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none"
                    style={{ width: header.getSize() }}
                    onClick={() =>
                      onSort(
                        sortKey,
                        isSorted && sortDirection === "desc" ? "asc" : "desc"
                      )
                    }
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {isSorted && (
                        <span className="text-blue-500">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {table.getRowModel().rows.map((row) => {
            const p = row.original;
            const isSelected = selectedSymbol === p.symbol;
            return (
              <tr
                key={row.id}
                onClick={() => onSelect(isSelected ? null : p.symbol)}
                className={`cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-blue-500/10 border-l-2 border-l-blue-500"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50 border-l-2 border-l-transparent"
                }`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-3 py-2 whitespace-nowrap"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
