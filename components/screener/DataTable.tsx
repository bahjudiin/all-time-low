"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import type { CoinWithDerived } from "@/types/coin";
import { CoinCell } from "./CoinCell";
import { Sparkline } from "./Sparkline";
import { Pagination } from "./Pagination";
import {
  formatUSD,
  formatPercentValue,
  formatCompact,
  formatDate,
  athColor,
  atlColor,
} from "@/lib/format";

const columnHelper = createColumnHelper<CoinWithDerived>();

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ChevronUp className="w-3 h-3 inline ml-1" />;
  if (sorted === "desc") return <ChevronDown className="w-3 h-3 inline ml-1" />;
  return <ChevronsUpDown className="w-3 h-3 inline ml-1 opacity-40" />;
}

const columns = [
  columnHelper.accessor("market_cap_rank", {
    header: "#",
    cell: (info) => (
      <span className="text-zinc-500 dark:text-zinc-400 text-sm">
        {info.getValue() ?? "-"}
      </span>
    ),
    enableSorting: false,
    size: 50,
  }),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => <CoinCell coin={info.row.original} />,
    sortingFn: (a, b) => a.original.name.localeCompare(b.original.name),
    size: 200,
  }),
  columnHelper.accessor("current_price", {
    header: "Price",
    cell: (info) => (
      <span className="text-sm font-medium">{formatUSD(info.getValue())}</span>
    ),
    size: 120,
  }),
  columnHelper.accessor("ath", {
    header: "ATH Price",
    cell: (info) => (
      <span className="text-sm text-green-600 dark:text-green-400">
        {formatUSD(info.getValue())}
      </span>
    ),
    size: 120,
  }),
  columnHelper.accessor("ath_date", {
    header: "ATH Date",
    cell: (info) => (
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        {formatDate(info.getValue())}
      </span>
    ),
    size: 110,
  }),
  columnHelper.accessor("atl", {
    header: "ATL Price",
    cell: (info) => (
      <span className="text-sm text-red-600 dark:text-red-400">
        {formatUSD(info.getValue())}
      </span>
    ),
    size: 120,
  }),
  columnHelper.accessor("atl_date", {
    header: "ATL Date",
    cell: (info) => (
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        {formatDate(info.getValue())}
      </span>
    ),
    size: 110,
  }),
  columnHelper.accessor("ath_change_percentage", {
    header: "% from ATH",
    cell: (info) => {
      const val = info.getValue();
      return (
        <span className="text-sm font-medium" style={{ color: athColor(val) }}>
          {formatPercentValue(val)}
        </span>
      );
    },
    size: 100,
  }),
  columnHelper.accessor("pctToATH", {
    header: "% to ATH",
    cell: (info) => (
      <span className="text-sm text-zinc-700 dark:text-zinc-300">
        {formatPercentValue(info.getValue())}
      </span>
    ),
    size: 100,
  }),
  columnHelper.accessor("atl_change_percentage", {
    header: "% from ATL",
    cell: (info) => {
      const val = info.getValue();
      return (
        <span className="text-sm font-medium" style={{ color: atlColor(val) }}>
          {formatPercentValue(val)}
        </span>
      );
    },
    size: 100,
  }),
  columnHelper.accessor("volatilityProxy", {
    header: () => (
      <span title="Approximate volatility based on 24h price change">
        Volatility 24h
      </span>
    ),
    cell: (info) => (
      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        {formatPercentValue(info.getValue())}
      </span>
    ),
    size: 110,
  }),
  columnHelper.accessor("liquidation24h", {
    header: () => (
      <span title="Estimated liquidations in the last 24 hours">
        Liq 24h
      </span>
    ),
    cell: (info) => {
      const liq = info.getValue();
      const dirColor =
        liq.netDirection === "long"
          ? "text-red-500"
          : liq.netDirection === "short"
            ? "text-green-500"
            : "text-zinc-500";
      return (
        <div className="flex flex-col text-xs leading-tight">
          <span className={`font-semibold ${dirColor}`}>
            {liq.totalPct.toFixed(1)}%
          </span>
          <span className="text-zinc-400">
            L:{liq.longPct.toFixed(1)} / S:{liq.shortPct.toFixed(1)}
          </span>
        </div>
      );
    },
    sortingFn: (a, b) =>
      a.original.liquidation24h.totalPct - b.original.liquidation24h.totalPct,
    size: 110,
  }),
  columnHelper.accessor("total_volume", {
    header: "Volume (24h)",
    cell: (info) => (
      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        ${formatCompact(info.getValue())}
      </span>
    ),
    size: 110,
  }),
  columnHelper.accessor("sparkline_in_7d", {
    header: "Sparkline 7D",
    cell: (info) => (
      <Sparkline data={info.getValue()?.price ?? []} />
    ),
    enableSorting: false,
    size: 130,
  }),
];

interface DataTableProps {
  data: CoinWithDerived[];
}

export function DataTable({ data }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "market_cap", desc: true },
  ]);

  const tableData = useMemo(() => data, [data]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 100,
        pageIndex: 0,
      },
    },
  });

  const { rows } = table.getRowModel();

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap"
                    style={{ width: header.getSize() }}
                    {...(header.column.getCanSort()
                      ? { onClick: header.column.getToggleSortingHandler() }
                      : {})}
                  >
                    <span
                      className={
                        header.column.getCanSort()
                          ? "cursor-pointer select-none hover:text-zinc-700 dark:hover:text-zinc-200"
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
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
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
      <Pagination totalRows={data.length} />
    </div>
  );
}
