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
import { useEffect, useMemo, useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import type { CoinWithDerived } from "@/types/coin";
import {
  formatUSD,
  formatPercentValue,
  formatCompact,
  formatDate,
  athColor,
  atlColor,
} from "@/lib/format";
import { Dropdown } from "@/components/ui/Dropdown";
import { Tooltip } from "@/components/ui/Tooltip";

const columnHelper = createColumnHelper<CoinWithDerived>();

function CoinCell({ coin }: { coin: CoinWithDerived }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" loading="lazy" />
      <div className="min-w-0">
        <div className="text-sm font-medium truncate max-w-[140px]">{coin.name}</div>
        <div className="text-[11px] text-zinc-500 uppercase">{coin.symbol}</div>
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return <span className="text-xs text-zinc-500">—</span>;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 100}`)
    .join(" ");
  const color = data[data.length - 1] >= data[0] ? "#10b981" : "#ef4444";
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-24 h-8">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ChevronUp className="w-3 h-3 inline ml-1 text-blue-500" />;
  if (sorted === "desc") return <ChevronDown className="w-3 h-3 inline ml-1 text-blue-500" />;
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
    size: 48,
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
    size: 110,
  }),
  columnHelper.accessor("ath", {
    header: "ATH Price",
    cell: (info) => (
      <span className="text-sm text-green-600 dark:text-green-400">
        {formatUSD(info.getValue())}
      </span>
    ),
    size: 110,
  }),
  columnHelper.accessor("ath_date", {
    header: "ATH Date",
    cell: (info) => (
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        {formatDate(info.getValue())}
      </span>
    ),
    size: 100,
  }),
  columnHelper.accessor("atl", {
    header: "ATL Price",
    cell: (info) => (
      <span className="text-sm text-red-600 dark:text-red-400">
        {formatUSD(info.getValue())}
      </span>
    ),
    size: 110,
  }),
  columnHelper.accessor("atl_date", {
    header: "ATL Date",
    cell: (info) => (
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        {formatDate(info.getValue())}
      </span>
    ),
    size: 100,
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
    size: 95,
  }),
  columnHelper.accessor("pctToATH", {
    header: () => (
      <Tooltip label="Percent gain needed to reclaim the all-time high" className="inline-block">
        <span className="inline-flex items-center">% to ATH</span>
      </Tooltip>
    ),
    cell: (info) => (
      <span className="text-sm text-zinc-700 dark:text-zinc-300">
        {formatPercentValue(info.getValue())}
      </span>
    ),
    size: 90,
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
    size: 95,
  }),
  columnHelper.accessor("price_change_percentage_24h", {
    header: "24h %",
    cell: (info) => {
      const val = info.getValue();
      return (
        <span className={`text-sm font-medium ${val >= 0 ? "text-emerald-500" : "text-red-500"}`}>
          {formatPercentValue(val)}
        </span>
      );
    },
    size: 80,
  }),
  columnHelper.accessor("volatilityProxy", {
    header: () => (
      <Tooltip label="Approximate implied volatility from |24h price change|" className="inline-block">
        <span className="inline-flex items-center">Vol 24h</span>
      </Tooltip>
    ),
    cell: (info) => (
      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        {formatPercentValue(info.getValue())}
      </span>
    ),
    size: 85,
  }),
  columnHelper.accessor("liquidation24h", {
    header: () => (
      <Tooltip label="Estimated perp-liquidation split over 24h. L/S % of notional." className="inline-block">
        <span className="inline-flex items-center">Liq 24h</span>
      </Tooltip>
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
    size: 95,
  }),
  columnHelper.accessor("total_volume", {
    header: "Volume (24h)",
    cell: (info) => (
      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        ${formatCompact(info.getValue())}
      </span>
    ),
    size: 100,
  }),
  columnHelper.accessor("sparkline_in_7d", {
    header: "7D Trend",
    cell: (info) => (
      <Sparkline data={info.getValue()?.price ?? []} />
    ),
    enableSorting: false,
    size: 110,
  }),
];

export interface FilterCapsule {
  id: string;
  label: string;
  test: (coin: CoinWithDerived) => boolean;
}

const DEFAULT_CAPSULES: FilterCapsule[] = [
  { id: "all", label: "All", test: () => true },
  {
    id: "cap-1b",
    label: "MCap > $1B",
    test: (c) => c.market_cap >= 1_000_000_000,
  },
  {
    id: "cap-100m",
    label: "MCap $100M+",
    test: (c) => c.market_cap >= 100_000_000,
  },
  {
    id: "pump-5",
    label: "+5% 24h",
    test: (c) => c.price_change_percentage_24h >= 5,
  },
  {
    id: "dump-5",
    label: "−5% 24h",
    test: (c) => c.price_change_percentage_24h <= -5,
  },
];

const PAGE_SIZES = [
  { value: "50", label: "50" },
  { value: "100", label: "100" },
  { value: "250", label: "250" },
  { value: "100000", label: "All" },
];

interface DataTableProps {
  data: CoinWithDerived[];
  onRowClick?: (coin: CoinWithDerived) => void;
  capsules?: FilterCapsule[];
}

export function DataTable({ data, onRowClick, capsules = DEFAULT_CAPSULES }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const [cap, setCap] = useState("all");
  const [pageSize, setPageSize] = useState(100);
  const [page, setPage] = useState(0);

  const tableData = useMemo(() => {
    let rows = data;
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
      );
    }
    const activeCapsule = capsules.find((c) => c.id === cap);
    if (activeCapsule && activeCapsule.id !== "all") {
      rows = rows.filter(activeCapsule.test);
    }
    return rows;
  }, [data, search, cap, capsules]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      pagination: { pageIndex: page, pageSize },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageCount = Math.max(1, table.getPageCount());
  useEffect(() => {
    if (page > pageCount - 1) setPage(0);
  }, [page, pageCount]);

  const { rows } = table.getRowModel();

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-4 md:px-6 py-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search..."
            className="w-36 md:w-48 pl-8 pr-2 py-1 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          {capsules.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCap(c.id);
                setPage(0);
              }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors whitespace-nowrap ${
                cap === c.id
                  ? "bg-blue-600 text-white"
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[11px] text-zinc-500 whitespace-nowrap">
            {tableData.length} rows
          </span>
          <Dropdown
            label="Rows"
            value={String(pageSize)}
            onChange={(v) => {
              setPageSize(parseInt(v, 10));
              setPage(0);
            }}
            options={PAGE_SIZES}
            align="right"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${
                        sorted ? "text-blue-600 dark:text-blue-400" : "text-zinc-500 dark:text-zinc-400"
                      }`}
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
                        {header.column.getCanSort() && <SortIcon sorted={sorted} />}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30 cursor-pointer"
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
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center text-xs text-zinc-500">
                  No rows match filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {tableData.length > pageSize && (
        <div className="flex items-center justify-between px-4 md:px-6 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] text-zinc-500">
              Page {page + 1} of {pageCount}
            </span>
            <button
              onClick={() => setPage(Math.min(pageCount - 1, page + 1))}
              disabled={page >= pageCount - 1}
              className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-[11px] text-zinc-500">
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, tableData.length)} of {tableData.length}
          </span>
        </div>
      )}
    </div>
  );
}