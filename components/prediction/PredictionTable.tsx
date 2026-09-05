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

function ScoreBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min((Math.abs(value) / max) * 100, 100);
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-zinc-400 w-7 text-right">{Math.abs(value)}%</span>
    </div>
  );
}

function DirectionBadge({ dir }: { dir: string }) {
  return (
    <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-bold rounded ${
      dir === "SHORT" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
    }`}>
      {dir}
    </span>
  );
}

function QualityBadge({ quality }: { quality: string }) {
  const colors: Record<string, string> = {
    "A+": "bg-amber-500/20 text-amber-400",
    A: "bg-green-500/20 text-green-400",
    B: "bg-blue-500/20 text-blue-400",
    C: "bg-zinc-500/20 text-zinc-400",
    WATCH: "bg-zinc-500/10 text-zinc-500",
  };
  return (
    <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-bold rounded ${colors[quality] || colors.WATCH}`}>
      {quality}
    </span>
  );
}

function StateBadge({ state }: { state: string }) {
  const colors: Record<string, string> = {
    extreme: "text-red-400",
    exhaustion_building: "text-red-400",
    target_forming: "text-amber-400",
    limit_zone: "text-amber-400",
    touched: "text-purple-400",
    reversing: "text-purple-400",
    extended: "text-orange-400",
    accelerating: "text-yellow-400",
    move_detected: "text-blue-400",
    invalidated: "text-zinc-500",
  };
  return (
    <span className={`text-[10px] font-medium uppercase ${colors[state] || "text-zinc-500"}`}>
      {state.replace(/_/g, " ")}
    </span>
  );
}

function ApproachBadge({ state }: { state: string }) {
  const colors: Record<string, string> = {
    TOUCHING: "bg-purple-500/20 text-purple-400",
    TOUCHED: "bg-purple-500/20 text-purple-400",
    NEAR: "bg-amber-500/20 text-amber-400",
    APPROACHING: "bg-blue-500/20 text-blue-400",
    REVERSING: "bg-green-500/20 text-green-400",
    FAR: "bg-zinc-500/10 text-zinc-500",
  };
  return (
    <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded ${colors[state] || colors.FAR}`}>
      {state}
    </span>
  );
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
        header: "Coin",
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex items-center gap-2">
              <img src={p.image} alt={p.name} className="w-5 h-5 rounded-full" loading="lazy" />
              <div>
                <div className="font-medium text-xs">{p.symbol}</div>
                <div className="text-[10px] text-zinc-500 truncate max-w-[80px]">{p.name}</div>
              </div>
            </div>
          );
        },
        size: 120,
      },
      {
        accessorKey: "direction",
        header: "Dir",
        cell: ({ getValue }) => <DirectionBadge dir={getValue() as string} />,
        size: 60,
      },
      {
        accessorKey: "quality",
        header: "Quality",
        cell: ({ getValue }) => <QualityBadge quality={getValue() as string} />,
        size: 60,
      },
      {
        accessorKey: "state",
        header: "State",
        cell: ({ getValue }) => <StateBadge state={getValue() as string} />,
        size: 110,
      },
      {
        accessorKey: "currentPrice",
        header: "Price",
        cell: ({ getValue }) => (
          <span className="text-xs font-mono text-foreground">{formatPrice(getValue() as number)}</span>
        ),
        size: 90,
      },
      {
        accessorKey: "movePercent",
        header: "Move",
        cell: ({ getValue }) => {
          const val = getValue() as number;
          return (
            <span className={`text-xs font-mono ${val > 0 ? "text-green-400" : val < 0 ? "text-red-400" : "text-zinc-500"}`}>
              {val > 0 ? "+" : ""}{val.toFixed(1)}%
            </span>
          );
        },
        size: 65,
      },
      {
        accessorKey: "predictedZone",
        header: "Zone",
        cell: ({ getValue, row }) => {
          const zone = getValue() as CoinPrediction["predictedZone"];
          const dir = row.original.direction;
          return (
            <div className="text-[10px] font-mono">
              <div className={dir === "SHORT" ? "text-red-400" : "text-green-400"}>
                {formatPrice(zone.upper)}
              </div>
              <div className="text-zinc-600">↓</div>
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
        header: "Dist",
        cell: ({ getValue }) => {
          const val = getValue() as number;
          return (
            <span className={`text-xs font-mono ${val < 0.5 ? "text-purple-400" : val < 1.5 ? "text-amber-400" : "text-zinc-500"}`}>
              {val.toFixed(1)}%
            </span>
          );
        },
        size: 55,
      },
      {
        accessorKey: "approachState",
        header: "Approach",
        cell: ({ getValue }) => <ApproachBadge state={getValue() as string} />,
        size: 85,
      },
      {
        accessorKey: "exhaustionProbability",
        header: "Exhaust",
        cell: ({ getValue }) => {
          const val = getValue() as number;
          return (
            <ScoreBar
              value={val}
              color={val >= 70 ? "bg-red-500" : val >= 50 ? "bg-amber-500" : "bg-zinc-600"}
            />
          );
        },
        size: 90,
      },
      {
        accessorKey: "continuationProbability",
        header: "Cont",
        cell: ({ getValue }) => {
          const val = getValue() as number;
          return <ScoreBar value={val} color={val < 30 ? "bg-green-500" : "bg-zinc-600"} />;
        },
        size: 90,
      },
      {
        accessorKey: "zoneReachProbability",
        header: "Reach",
        cell: ({ getValue }) => {
          const val = getValue() as number;
          return <ScoreBar value={val} color="bg-blue-500" />;
        },
        size: 90,
      },
      {
        accessorKey: "agreeingClusters",
        header: "Clust",
        cell: ({ getValue, row }) => {
          const agree = getValue() as number;
          const conflict = row.original.conflictingClusters;
          return (
            <div className="flex items-center gap-1">
              <span className={`text-[10px] font-mono ${agree >= 4 ? "text-green-400" : agree >= 2 ? "text-amber-400" : "text-zinc-500"}`}>
                {agree}
              </span>
              <span className="text-[10px] text-zinc-600">/</span>
              <span className={`text-[10px] font-mono ${conflict > 0 ? "text-red-400" : "text-zinc-500"}`}>
                {conflict}
              </span>
            </div>
          );
        },
        size: 50,
      },
      {
        accessorKey: "factors",
        header: "RSI",
        cell: ({ getValue }) => {
          const f = (getValue() as CoinPrediction["factors"]).momentum;
          return (
            <span className={`text-[10px] font-mono ${f.rsi > 70 ? "text-red-400" : f.rsi < 30 ? "text-green-400" : "text-zinc-400"}`}>
              {f.rsi.toFixed(0)}
            </span>
          );
        },
        size: 45,
      },
      {
        accessorKey: "invalidation",
        header: "Inval",
        cell: ({ getValue }) => (
          <span className="text-[10px] font-mono text-zinc-500">{formatPrice(getValue() as number)}</span>
        ),
        size: 80,
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
                    className="px-2 py-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none"
                    style={{ width: header.getSize() }}
                    onClick={() =>
                      onSort(sortKey, isSorted && sortDirection === "desc" ? "asc" : "desc")
                    }
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {isSorted && (
                        <span className="text-blue-500">{sortDirection === "asc" ? "↑" : "↓"}</span>
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
                    className="px-2 py-2 whitespace-nowrap"
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
