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
  formatDate,
  athColor,
  atlColor,
} from "@/lib/format";
import { Dropdown } from "@/components/ui/Dropdown";
import { Tooltip } from "@/components/ui/Tooltip";
import { useHorizontalScroll } from "@/components/ui/useHorizontalScroll";

const columnHelper = createColumnHelper<CoinWithDerived>();

const COLUMN_CLASSES: Record<string, string> = {
  market_cap_rank: "hidden sm:table-cell",
  ath_date: "hidden md:table-cell",
  atl_date: "hidden md:table-cell",
  ath: "hidden sm:table-cell",
  atl: "hidden sm:table-cell",
  pctToATH: "hidden sm:table-cell",
  atl_change_percentage: "hidden md:table-cell",
  volatilityProxy: "hidden lg:table-cell",
};

function CoinCell({ coin }: { coin: CoinWithDerived }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <img src={coin.image} alt={coin.name} style={{ width: 20, height: 20, borderRadius: "50%" }} loading="lazy" />
      <div style={{ minWidth: 0 }}>
        <div title={coin.name} className="mono" style={{ fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140, color: "var(--ink-primary)" }}>
          {coin.name}
        </div>
        <div className="mono" style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase" }}>{coin.symbol}</div>
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>—</span>;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 100}`)
    .join(" ");
  const color = data[data.length - 1] >= data[0] ? "var(--long)" : "var(--short)";
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: 96, height: 28 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ChevronUp style={{ width: 12, height: 12, display: "inline", marginLeft: 4, color: "var(--amber)" }} />;
  if (sorted === "desc") return <ChevronDown style={{ width: 12, height: 12, display: "inline", marginLeft: 4, color: "var(--amber)" }} />;
  return <ChevronsUpDown style={{ width: 12, height: 12, display: "inline", marginLeft: 4, opacity: 0.4 }} />;
}

const columns = [
  columnHelper.accessor("market_cap_rank", {
    header: "#",
    cell: (info) => (
      <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{info.getValue() ?? "-"}</span>
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
      <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-primary)" }}>{formatUSD(info.getValue())}</span>
    ),
    size: 110,
  }),
  columnHelper.accessor("ath", {
    header: "ATH Price",
    cell: (info) => (
      <span className="mono" style={{ fontSize: 11, color: "var(--long)" }}>{formatUSD(info.getValue())}</span>
    ),
    size: 110,
  }),
  columnHelper.accessor("ath_date", {
    header: "ATH Date",
    cell: (info) => (
      <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{formatDate(info.getValue())}</span>
    ),
    size: 100,
  }),
  columnHelper.accessor("atl", {
    header: "ATL Price",
    cell: (info) => (
      <span className="mono" style={{ fontSize: 11, color: "var(--short)" }}>{formatUSD(info.getValue())}</span>
    ),
    size: 110,
  }),
  columnHelper.accessor("atl_date", {
    header: "ATL Date",
    cell: (info) => (
      <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{formatDate(info.getValue())}</span>
    ),
    size: 100,
  }),
  columnHelper.accessor("ath_change_percentage", {
    header: "% from ATH",
    cell: (info) => {
      const val = info.getValue();
      return (
        <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: athColor(val) }}>{formatPercentValue(val)}</span>
      );
    },
    size: 95,
  }),
  columnHelper.accessor("pctToATH", {
    header: () => (
      <Tooltip label="Percent gain needed to reclaim the all-time high" className="inline-block">
        <span style={{ display: "inline-flex", alignItems: "center" }}>% to ATH</span>
      </Tooltip>
    ),
    cell: (info) => (
      <span className="mono" style={{ fontSize: 11, color: "var(--ink-secondary)" }}>{formatPercentValue(info.getValue())}</span>
    ),
    size: 90,
  }),
  columnHelper.accessor("atl_change_percentage", {
    header: "% from ATL",
    cell: (info) => {
      const val = info.getValue();
      return (
        <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: atlColor(val) }}>{formatPercentValue(val)}</span>
      );
    },
    size: 95,
  }),
  columnHelper.accessor("price_change_percentage_24h", {
    header: "24h %",
    cell: (info) => {
      const val = info.getValue();
      return (
        <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: val >= 0 ? "var(--long)" : "var(--short)" }}>{formatPercentValue(val)}</span>
      );
    },
    size: 80,
  }),
  columnHelper.accessor("volatilityProxy", {
    header: () => (
      <Tooltip label="Approximate implied volatility from |24h price change|" className="inline-block">
        <span style={{ display: "inline-flex", alignItems: "center" }}>Vol 24h</span>
      </Tooltip>
    ),
    cell: (info) => (
      <span className="mono" style={{ fontSize: 11, color: "var(--ink-secondary)" }}>{formatPercentValue(info.getValue())}</span>
    ),
    size: 85,
  }),
  columnHelper.accessor("liquidation24h", {
    header: () => (
      <Tooltip label="Estimated perp-liquidation split over 24h. L/S % of notional." className="inline-block">
        <span style={{ display: "inline-flex", alignItems: "center" }}>Liq 24h</span>
      </Tooltip>
    ),
    cell: (info) => {
      const liq = info.getValue();
      const dirColor = liq.netDirection === "long" ? "var(--short)" : liq.netDirection === "short" ? "var(--long)" : "var(--muted)";
      return (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
          <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: dirColor }}>{liq.totalPct.toFixed(1)}%</span>
          <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>L:{liq.longPct.toFixed(1)} / S:{liq.shortPct.toFixed(1)}</span>
        </div>
      );
    },
    sortingFn: (a, b) => a.original.liquidation24h.totalPct - b.original.liquidation24h.totalPct,
    size: 95,
  }),
  columnHelper.accessor("sparkline_in_7d", {
    header: "7D Trend",
    cell: (info) => <Sparkline data={info.getValue()?.price ?? []} />,
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
  { id: "cap-1b", label: "MCap > $1B", test: (c) => c.market_cap >= 1_000_000_000 },
  { id: "cap-100m", label: "MCap $100M+", test: (c) => c.market_cap >= 100_000_000 },
  { id: "pump-5", label: "+5% 24h", test: (c) => c.price_change_percentage_24h >= 5 },
  { id: "dump-5", label: "−5% 24h", test: (c) => c.price_change_percentage_24h <= -5 },
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

function CapsuleBar({ capsules, active, onChange }: { capsules: FilterCapsule[]; active: string; onChange: (id: string) => void }) {
  const { ref, canScrollLeft, canScrollRight } = useHorizontalScroll<HTMLDivElement>();
  return (
    <div style={{ position: "relative", minWidth: 0, flex: 1 }}>
      <div ref={ref} style={{ display: "flex", alignItems: "center", gap: 4, overflowX: "auto", scrollSnapType: "x mandatory", padding: "2px 0" }}>
        {capsules.map((c) => (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            className="mono"
            style={{
              padding: "3px 10px",
              fontSize: 10,
              borderRadius: 2,
              border: "none",
              background: active === c.id ? "var(--amber)" : "var(--panel-raised)",
              color: active === c.id ? "var(--ink)" : "var(--muted2)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              fontWeight: active === c.id ? 700 : 400,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
      {canScrollLeft && (
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 16, background: "linear-gradient(to right, var(--panel), transparent)", pointerEvents: "none" }} />
      )}
      {canScrollRight && (
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 16, background: "linear-gradient(to left, var(--panel), transparent)", pointerEvents: "none" }} />
      )}
    </div>
  );
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
    if (q) rows = rows.filter((c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
    const activeCapsule = capsules.find((c) => c.id === cap);
    if (activeCapsule && activeCapsule.id !== "all") rows = rows.filter(activeCapsule.test);
    return rows;
  }, [data, search, cap, capsules]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting, pagination: { pageIndex: page, pageSize } },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageCount = Math.max(1, table.getPageCount());
  useEffect(() => { if (page > pageCount - 1) setPage(0); }, [page, pageCount]);

  const { rows } = table.getRowModel();

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "8px 16px", borderBottom: "1px solid var(--hair)", background: "var(--panel)" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <Search style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--muted)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search..."
            className="mono"
            style={{ width: 180, padding: "4px 8px 4px 28px", fontSize: 11, border: "1px solid var(--hair)", borderRadius: 2, background: "var(--panel)", color: "var(--ink-primary)", outline: "none" }}
          />
        </div>
        <CapsuleBar capsules={capsules} active={cap} onChange={setCap} />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span className="mono" style={{ fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap" }}>{tableData.length} rows</span>
          <Dropdown
            label="Rows"
            value={String(pageSize)}
            onChange={(v) => { setPageSize(parseInt(v, 10)); setPage(0); }}
            options={PAGE_SIZES}
            align="right"
          />
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        <table className="mono" style={{ width: "100", borderCollapse: "collapse", fontSize: 11 }}>
          <thead className="sticky top-0" style={{ zIndex: 10, background: "var(--panel-raised)", borderBottom: "1px solid var(--hair)" }}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const canSort = header.column.getCanSort();
                  const hidden = COLUMN_CLASSES[header.id] ?? "";
                  return (
                    <th
                      key={header.id}
                      aria-sort={canSort ? (sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none") : undefined}
                      className={`${hidden}`}
                      style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 500, whiteSpace: "nowrap", width: header.getSize(), color: canSort && sorted ? "var(--amber)" : "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.05em" }}
                    >
                      <button
                        type="button"
                        disabled={!canSort}
                        onClick={header.column.getToggleSortingHandler()}
                        style={{ display: "inline-flex", alignItems: "center", border: "none", background: "none", padding: 0, cursor: canSort ? "pointer" : "default", color: "inherit", fontSize: "inherit", fontFamily: "inherit" }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && <SortIcon sorted={sorted} />}
                      </button>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                tabIndex={0}
                role="button"
                aria-label={`Open ${row.original.name}`}
                onClick={() => onRowClick?.(row.original)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick?.(row.original); } }}
                style={{ borderBottom: "1px solid var(--hair)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--panel-raised)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
              >
                {row.getVisibleCells().map((cell) => {
                  const hidden = COLUMN_CLASSES[cell.column.id] ?? "";
                  return (
                    <td key={cell.id} className={`${hidden}`} style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} style={{ padding: "40px 0", textAlign: "center", fontSize: 11, color: "var(--muted)" }}>No coins match filters</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {tableData.length > pageSize && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--hair)", background: "var(--panel-raised)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              style={{ padding: 4, border: "none", background: "none", color: "var(--muted2)", cursor: "pointer", opacity: page === 0 ? 0.4 : 1 }}
              aria-label="Previous page"
            >
              <ChevronLeft style={{ width: 16, height: 16 }} />
            </button>
            <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>Page {page + 1} of {pageCount}</span>
            <button
              onClick={() => setPage(Math.min(pageCount - 1, page + 1))}
              disabled={page >= pageCount - 1}
              style={{ padding: 4, border: "none", background: "none", color: "var(--muted2)", cursor: "pointer", opacity: page >= pageCount - 1 ? 0.4 : 1 }}
              aria-label="Next page"
            >
              <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
          <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, tableData.length)} of {tableData.length}
          </span>
        </div>
      )}
    </div>
  );
}
