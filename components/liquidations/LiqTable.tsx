"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import type { LiquidationEvent } from "@/types/liquidation";
import { formatCompact } from "@/lib/format";
import { getPriceDecimals } from "@/lib/aggregate";

interface LiqTableProps {
  data: LiquidationEvent[];
  showExchange?: boolean;
  maxHeight?: string;
}

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ChevronUp className="w-3 h-3 inline ml-1" />;
  if (sorted === "desc")
    return <ChevronDown className="w-3 h-3 inline ml-1" />;
  return <ChevronsUpDown className="w-3 h-3 inline ml-1 opacity-40" />;
}

function buildColumns(showExchange: boolean): ColumnDef<LiquidationEvent>[] {
  const cols: ColumnDef<LiquidationEvent>[] = [
    {
      accessorKey: "ts",
      header: "Time",
      cell: (info) => (
        <span className="text-xs text-zinc-400">{relativeTime(info.getValue() as number)}</span>
      ),
      sortingFn: "basic",
      size: 90,
    },
    {
      accessorKey: "symbol",
      header: "Symbol",
      cell: (info) => (
        <span className="text-sm font-medium">{info.getValue() as string}</span>
      ),
      size: 100,
    },
  ];

  if (showExchange) {
    cols.push({
      accessorKey: "exchange",
      header: "Exchange",
      cell: (info) => (
        <span className="text-xs text-zinc-500 uppercase">
          {info.getValue() as string}
        </span>
      ),
      size: 100,
    });
  }

  cols.push(
    {
      accessorKey: "side",
      header: "Side",
      cell: (info) => {
        const side = info.getValue() as string;
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
    },
    {
      accessorKey: "usdValue",
      header: "Size USD",
      cell: (info) => (
        <span className="text-sm text-zinc-300">
          ${formatCompact(info.getValue() as number)}
        </span>
      ),
      sortingFn: "basic",
      size: 110,
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: (info) => {
        const val = info.getValue() as number;
        return (
          <span className="text-sm text-zinc-300">
            ${val.toFixed(getPriceDecimals(val))}
          </span>
        );
      },
      size: 120,
    }
  );

  return cols;
}

export function LiqTable({
  data,
  showExchange = false,
  maxHeight,
}: LiqTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "ts", desc: true },
  ]);

  const columns = useMemo(() => buildColumns(showExchange), [showExchange]);

  const tableData = useMemo(() => data, [data]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const { rows } = table.getRowModel();
  const hClass = `sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800`;
  const bodyMaxH = `max-h-[${maxHeight || "600px"}]`;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className={`flex-1 overflow-auto ${bodyMaxH}`}>
        <table className="w-full border-collapse">
          <thead className={hClass}>
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
  );
}
