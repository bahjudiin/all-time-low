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
import type { CoinSignals, SignalDirection } from "@/types/signal";
import {
  formatUSD,
  formatPercentValue,
  formatDate,
  formatCompact,
  athColor,
  atlColor,
} from "@/lib/format";
import { Dropdown } from "@/components/ui/Dropdown";
import { Tooltip } from "@/components/ui/Tooltip";
import { useHorizontalScroll } from "@/components/ui/useHorizontalScroll";

const columnHelper = createColumnHelper<CoinWithDerived & { signals?: CoinSignals }>();

const COLUMN_CLASSES: Record<string, string> = {
  market_cap_rank: "hidden sm:table-cell",
  ath_date: "hidden lg:table-cell",
  atl_date: "hidden lg:table-cell",
  ath: "hidden md:table-cell",
  atl: "hidden md:table-cell",
  pctToATH: "hidden sm:table-cell",
  atl_change_percentage: "hidden lg:table-cell",
  volatilityProxy: "hidden xl:table-cell",
  total_volume: "hidden sm:table-cell",
  market_cap: "hidden md:table-cell",
  circulating_supply: "hidden lg:table-cell",
  signalAgreement: "hidden md:table-cell",
  signalMomentum: "hidden lg:table-cell",
  signalTrend: "hidden lg:table-cell",
  signalVolume: "hidden xl:table-cell",
  signalCrowd: "hidden xl:table-cell",
  signalStructure: "hidden xl:table-cell",
  signalConfirmation: "hidden xl:table-cell",
  predEntry: "hidden xl:table-cell",
  predExit: "hidden xl:table-cell",
  predStop: "hidden xl:table-cell",
  predRR: "hidden xl:table-cell",
  high_24h: "hidden xl:table-cell",
  low_24h: "hidden xl:table-cell",
};

const SIGNAL_DIR_COLORS: Record<string, string> = {
  strong_long: "var(--long)",
  long: "var(--long)",
  lean_long: "var(--long)",
  wait: "var(--muted2)",
  lean_short: "var(--short)",
  short: "var(--short)",
  strong_short: "var(--short)",
};

const SIGNAL_DIR_BG: Record<string, string> = {
  strong_long: "rgba(14, 203, 129, 0.12)",
  long: "rgba(14, 203, 129, 0.08)",
  lean_long: "rgba(14, 203, 129, 0.05)",
  wait: "rgba(112, 122, 138, 0.08)",
  lean_short: "rgba(246, 70, 93, 0.05)",
  short: "rgba(246, 70, 93, 0.08)",
  strong_short: "rgba(246, 70, 93, 0.12)",
};

const SIGNAL_DIR_LABELS: Record<string, string> = {
  strong_long: "S.LONG",
  long: "LONG",
  lean_long: "L.LONG",
  wait: "WAIT",
  lean_short: "L.SHORT",
  short: "SHORT",
  strong_short: "S.SHORT",
};

const SIGNAL_DIR_ICONS: Record<string, string> = {
  strong_long: "▲▲",
  long: "▲",
  lean_long: "△",
  wait: "—",
  lean_short: "▽",
  short: "▼",
  strong_short: "▼▼",
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

function signalGroupDot(signal: -1 | 0 | 1) {
  return signal === 1 ? "var(--long)" : signal === -1 ? "var(--short)" : "var(--muted)";
}

function signalGroupLabel(signal: -1 | 0 | 1) {
  return signal === 1 ? "▲" : signal === -1 ? "▼" : "—";
}

const columns = [
  columnHelper.accessor("market_cap_rank", {
    header: "#",
    cell: (info) => (
      <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{info.getValue() ?? "-"}</span>
    ),
    enableSorting: false,
    size: 40,
  }),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => <CoinCell coin={info.row.original} />,
    sortingFn: (a, b) => a.original.name.localeCompare(b.original.name),
    size: 180,
  }),
  columnHelper.accessor("current_price", {
    header: "Price",
    cell: (info) => (
      <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-primary)" }}>{formatUSD(info.getValue())}</span>
    ),
    size: 100,
  }),
  columnHelper.accessor("price_change_percentage_24h", {
    header: "24h %",
    cell: (info) => {
      const val = info.getValue();
      return (
        <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: val >= 0 ? "var(--long)" : "var(--short)" }}>{formatPercentValue(val)}</span>
      );
    },
    size: 75,
  }),
  columnHelper.accessor("ath", {
    header: "ATH",
    cell: (info) => (
      <span className="mono" style={{ fontSize: 11, color: "var(--long)" }}>{formatUSD(info.getValue())}</span>
    ),
    size: 100,
  }),
  columnHelper.accessor("ath_change_percentage", {
    header: "%ATH",
    cell: (info) => {
      const val = info.getValue();
      return (
        <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: athColor(val) }}>{formatPercentValue(val)}</span>
      );
    },
    size: 80,
  }),
  columnHelper.accessor("pctToATH", {
    header: () => (
      <Tooltip label="% gain needed to reclaim ATH" className="inline-block">
        <span style={{ display: "inline-flex", alignItems: "center" }}>To ATH</span>
      </Tooltip>
    ),
    cell: (info) => (
      <span className="mono" style={{ fontSize: 11, color: "var(--ink-secondary)" }}>{formatPercentValue(info.getValue())}</span>
    ),
    size: 80,
  }),
  columnHelper.accessor("atl", {
    header: "ATL",
    cell: (info) => (
      <span className="mono" style={{ fontSize: 11, color: "var(--short)" }}>{formatUSD(info.getValue())}</span>
    ),
    size: 100,
  }),
  columnHelper.accessor("atl_change_percentage", {
    header: "%ATL",
    cell: (info) => {
      const val = info.getValue();
      return (
        <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: atlColor(val) }}>{formatPercentValue(val)}</span>
      );
    },
    size: 80,
  }),
  columnHelper.accessor("high_24h", {
    header: "High 24h",
    cell: (info) => (
      <span className="mono" style={{ fontSize: 11, color: "var(--muted2)" }}>{formatUSD(info.getValue())}</span>
    ),
    size: 100,
  }),
  columnHelper.accessor("low_24h", {
    header: "Low 24h",
    cell: (info) => (
      <span className="mono" style={{ fontSize: 11, color: "var(--muted2)" }}>{formatUSD(info.getValue())}</span>
    ),
    size: 100,
  }),
  columnHelper.accessor("market_cap", {
    header: "MCap",
    cell: (info) => (
      <span className="mono" style={{ fontSize: 11, color: "var(--ink-secondary)" }}>{formatCompact(info.getValue())}</span>
    ),
    size: 90,
  }),
  columnHelper.accessor("total_volume", {
    header: "Vol 24h",
    cell: (info) => (
      <span className="mono" style={{ fontSize: 11, color: "var(--ink-secondary)" }}>{formatCompact(info.getValue())}</span>
    ),
    size: 90,
  }),
  columnHelper.accessor("circulating_supply", {
    header: "Circ Sup",
    cell: (info) => {
      const val = info.getValue();
      return (
        <span className="mono" style={{ fontSize: 11, color: "var(--muted2)" }}>{val ? formatCompact(val) : "—"}</span>
      );
    },
    size: 90,
  }),
  columnHelper.accessor("volatilityProxy", {
    header: () => (
      <Tooltip label="Approximate implied volatility from |24h price change|" className="inline-block">
        <span style={{ display: "inline-flex", alignItems: "center" }}>Vol</span>
      </Tooltip>
    ),
    cell: (info) => (
      <span className="mono" style={{ fontSize: 11, color: "var(--ink-secondary)" }}>{formatPercentValue(info.getValue())}</span>
    ),
    size: 70,
  }),
  columnHelper.accessor("liquidation24h", {
    header: () => (
      <Tooltip label="Estimated perp-liquidation split over 24h" className="inline-block">
        <span style={{ display: "inline-flex", alignItems: "center" }}>Liq</span>
      </Tooltip>
    ),
    cell: (info) => {
      const liq = info.getValue();
      const dirColor = liq.netDirection === "long" ? "var(--short)" : liq.netDirection === "short" ? "var(--long)" : "var(--muted)";
      return (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
          <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: dirColor }}>{liq.totalPct.toFixed(1)}%</span>
          <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>L:{liq.longPct.toFixed(0)} S:{liq.shortPct.toFixed(0)}</span>
        </div>
      );
    },
    sortingFn: (a, b) => a.original.liquidation24h.totalPct - b.original.liquidation24h.totalPct,
    size: 80,
  }),
  columnHelper.accessor("signals", {
    id: "signalDir",
    header: () => (
      <Tooltip label="Composite signal direction from 7-group analysis" className="inline-block">
        <span style={{ display: "inline-flex", alignItems: "center" }}>SIG</span>
      </Tooltip>
    ),
    cell: (info) => {
      const sig = info.getValue();
      if (!sig) return <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>—</span>;
      const color = SIGNAL_DIR_COLORS[sig.direction] ?? "var(--muted2)";
      const bg = SIGNAL_DIR_BG[sig.direction] ?? "transparent";
      const icon = SIGNAL_DIR_ICONS[sig.direction] ?? "";
      return (
        <span className="mono" style={{ fontSize: 10, fontWeight: 700, color, background: bg, padding: "2px 6px", borderRadius: "var(--radius-sm)", whiteSpace: "nowrap" }}>
          {icon} {SIGNAL_DIR_LABELS[sig.direction] ?? sig.direction.toUpperCase()}
        </span>
      );
    },
    sortingFn: (a, b) => {
      const order: Record<string, number> = { strong_long: 6, long: 5, lean_long: 4, wait: 3, lean_short: 2, short: 1, strong_short: 0 };
      return (order[a.original.signals?.direction ?? "wait"] ?? 3) - (order[b.original.signals?.direction ?? "wait"] ?? 3);
    },
    size: 75,
  }),
  columnHelper.accessor("signals", {
    id: "signalScore",
    header: () => (
      <Tooltip label="Signal score (max depends on groups)" className="inline-block">
        <span style={{ display: "inline-flex", alignItems: "center" }}>Score</span>
      </Tooltip>
    ),
    cell: (info) => {
      const sig = info.getValue();
      if (!sig) return <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>—</span>;
      const color = sig.score > 0 ? "var(--long)" : sig.score < 0 ? "var(--short)" : "var(--muted2)";
      return (
        <span className="mono" style={{ fontSize: 11, fontWeight: 600, color }}>{sig.score > 0 ? "+" : ""}{sig.score}</span>
      );
    },
    sortingFn: (a, b) => (a.original.signals?.score ?? 0) - (b.original.signals?.score ?? 0),
    size: 55,
  }),
  columnHelper.accessor("signals", {
    id: "signalAgreement",
    header: () => (
      <Tooltip label="% of groups agreeing with dominant direction" className="inline-block">
        <span style={{ display: "inline-flex", alignItems: "center" }}>Agr%</span>
      </Tooltip>
    ),
    cell: (info) => {
      const sig = info.getValue();
      if (!sig) return <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>—</span>;
      const color = sig.agreementPct >= 80 ? "var(--long)" : sig.agreementPct >= 60 ? "var(--amber)" : "var(--muted2)";
      return <span className="mono" style={{ fontSize: 11, fontWeight: 600, color }}>{sig.agreementPct}%</span>;
    },
    sortingFn: (a, b) => (a.original.signals?.agreementPct ?? 0) - (b.original.signals?.agreementPct ?? 0),
    size: 55,
  }),
  columnHelper.accessor("signals", {
    id: "signalMomentum",
    header: () => (
      <Tooltip label="Momentum group: RSI, MACD, StochRSI, EMA crossover" className="inline-block">
        <span style={{ display: "inline-flex", alignItems: "center" }}>Mom</span>
      </Tooltip>
    ),
    cell: (info) => {
      const sig = info.getValue();
      if (!sig) return <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>—</span>;
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: signalGroupDot(sig.momentum.signal) }} />
          <span className="mono" style={{ fontSize: 10, color: signalGroupDot(sig.momentum.signal) }}>{signalGroupLabel(sig.momentum.signal)}</span>
        </div>
      );
    },
    sortingFn: (a, b) => (a.original.signals?.momentum.signal ?? 0) - (b.original.signals?.momentum.signal ?? 0),
    size: 50,
  }),
  columnHelper.accessor("signals", {
    id: "signalTrend",
    header: () => (
      <Tooltip label="Trend group: ADX, Bollinger, EMA trend" className="inline-block">
        <span style={{ display: "inline-flex", alignItems: "center" }}>Trend</span>
      </Tooltip>
    ),
    cell: (info) => {
      const sig = info.getValue();
      if (!sig) return <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>—</span>;
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: signalGroupDot(sig.trend.signal) }} />
          <span className="mono" style={{ fontSize: 10, color: signalGroupDot(sig.trend.signal) }}>{signalGroupLabel(sig.trend.signal)}</span>
        </div>
      );
    },
    sortingFn: (a, b) => (a.original.signals?.trend.signal ?? 0) - (b.original.signals?.trend.signal ?? 0),
    size: 50,
  }),
  columnHelper.accessor("signals", {
    id: "signalVolume",
    header: () => (
      <Tooltip label="Volume group: OBV, volume profile" className="inline-block">
        <span style={{ display: "inline-flex", alignItems: "center" }}>Vol</span>
      </Tooltip>
    ),
    cell: (info) => {
      const sig = info.getValue();
      if (!sig) return <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>—</span>;
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: signalGroupDot(sig.volumeFlow.signal) }} />
          <span className="mono" style={{ fontSize: 10, color: signalGroupDot(sig.volumeFlow.signal) }}>{signalGroupLabel(sig.volumeFlow.signal)}</span>
        </div>
      );
    },
    sortingFn: (a, b) => (a.original.signals?.volumeFlow.signal ?? 0) - (b.original.signals?.volumeFlow.signal ?? 0),
    size: 50,
  }),
  columnHelper.accessor("signals", {
    id: "signalCrowd",
    header: () => (
      <Tooltip label="Crowd sentiment group: funding rate, long/short ratio" className="inline-block">
        <span style={{ display: "inline-flex", alignItems: "center" }}>Crowd</span>
      </Tooltip>
    ),
    cell: (info) => {
      const sig = info.getValue();
      if (!sig) return <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>—</span>;
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: signalGroupDot(sig.crowdSentiment.signal) }} />
          <span className="mono" style={{ fontSize: 10, color: signalGroupDot(sig.crowdSentiment.signal) }}>{signalGroupLabel(sig.crowdSentiment.signal)}</span>
        </div>
      );
    },
    sortingFn: (a, b) => (a.original.signals?.crowdSentiment.signal ?? 0) - (b.original.signals?.crowdSentiment.signal ?? 0),
    size: 55,
  }),
  columnHelper.accessor("signals", {
    id: "signalStructure",
    header: () => (
      <Tooltip label="Market structure group: ATH/ATL position" className="inline-block">
        <span style={{ display: "inline-flex", alignItems: "center" }}>Struct</span>
      </Tooltip>
    ),
    cell: (info) => {
      const sig = info.getValue();
      if (!sig) return <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>—</span>;
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: signalGroupDot(sig.marketStructure.signal) }} />
          <span className="mono" style={{ fontSize: 10, color: signalGroupDot(sig.marketStructure.signal) }}>{signalGroupLabel(sig.marketStructure.signal)}</span>
        </div>
      );
    },
    sortingFn: (a, b) => (a.original.signals?.marketStructure.signal ?? 0) - (b.original.signals?.marketStructure.signal ?? 0),
    size: 55,
  }),
  columnHelper.accessor("signals", {
    id: "signalConfirmation",
    header: () => (
      <Tooltip label="Confirmation group: cross-indicator agreement" className="inline-block">
        <span style={{ display: "inline-flex", alignItems: "center" }}>Conf</span>
      </Tooltip>
    ),
    cell: (info) => {
      const sig = info.getValue();
      if (!sig) return <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>—</span>;
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: signalGroupDot(sig.confirmation.signal) }} />
          <span className="mono" style={{ fontSize: 10, color: signalGroupDot(sig.confirmation.signal) }}>{signalGroupLabel(sig.confirmation.signal)}</span>
        </div>
      );
    },
    sortingFn: (a, b) => (a.original.signals?.confirmation.signal ?? 0) - (b.original.signals?.confirmation.signal ?? 0),
    size: 55,
  }),
  columnHelper.accessor("signals", {
    id: "predEntry",
    header: () => (
      <Tooltip label="Predicted entry zone based on ATR pullback + RSI reversion" className="inline-block">
        <span style={{ display: "inline-flex", alignItems: "center" }}>🎯 Entry</span>
      </Tooltip>
    ),
    cell: (info) => {
      const sig = info.getValue();
      if (!sig?.prediction) return <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>—</span>;
      const entry = sig.prediction.entry;
      const isLong = sig.direction.includes("long");
      return (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
          <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: isLong ? "var(--long)" : "var(--short)" }}>{formatUSD(entry)}</span>
          <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>{sig.prediction.method.split(" ")[0]}</span>
        </div>
      );
    },
    sortingFn: (a, b) => (a.original.signals?.prediction?.entry ?? 0) - (b.original.signals?.prediction?.entry ?? 0),
    size: 95,
  }),
  columnHelper.accessor("signals", {
    id: "predExit",
    header: () => (
      <Tooltip label="Predicted exit target based on volatility expansion + resistance" className="inline-block">
        <span style={{ display: "inline-flex", alignItems: "center" }}>🎯 Exit</span>
      </Tooltip>
    ),
    cell: (info) => {
      const sig = info.getValue();
      if (!sig?.prediction) return <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>—</span>;
      const exit = sig.prediction.exit;
      const entry = sig.prediction.entry;
      const profitPct = ((exit - entry) / entry * 100);
      return (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
          <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--long)" }}>{formatUSD(exit)}</span>
          <span className="mono" style={{ fontSize: 9, color: "var(--long)" }}>+{profitPct.toFixed(1)}%</span>
        </div>
      );
    },
    sortingFn: (a, b) => (a.original.signals?.prediction?.exit ?? 0) - (b.original.signals?.prediction?.exit ?? 0),
    size: 95,
  }),
  columnHelper.accessor("signals", {
    id: "predStop",
    header: () => (
      <Tooltip label="Stop loss based on ATR + key support/resistance" className="inline-block">
        <span style={{ display: "inline-flex", alignItems: "center" }}>🎯 Stop</span>
      </Tooltip>
    ),
    cell: (info) => {
      const sig = info.getValue();
      if (!sig?.prediction) return <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>—</span>;
      const stop = sig.prediction.stop;
      const entry = sig.prediction.entry;
      const riskPct = Math.abs((stop - entry) / entry * 100);
      return (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
          <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--short)" }}>{formatUSD(stop)}</span>
          <span className="mono" style={{ fontSize: 9, color: "var(--short)" }}>−{riskPct.toFixed(1)}% risk</span>
        </div>
      );
    },
    sortingFn: (a, b) => (a.original.signals?.prediction?.stop ?? 0) - (b.original.signals?.prediction?.stop ?? 0),
    size: 95,
  }),
  columnHelper.accessor("signals", {
    id: "predRR",
    header: () => (
      <Tooltip label="Risk/Reward ratio — higher is better (min 1.5 to show)" className="inline-block">
        <span style={{ display: "inline-flex", alignItems: "center" }}>R:R</span>
      </Tooltip>
    ),
    cell: (info) => {
      const sig = info.getValue();
      if (!sig?.prediction) return <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>—</span>;
      const rr = sig.prediction.rrRatio;
      const color = rr >= 2 ? "var(--long)" : rr >= 1.5 ? "var(--amber)" : "var(--short)";
      return (
        <span className="mono" style={{ fontSize: 11, fontWeight: 700, color }}>{rr.toFixed(1)}</span>
      );
    },
    sortingFn: (a, b) => (a.original.signals?.prediction?.rrRatio ?? 0) - (b.original.signals?.prediction?.rrRatio ?? 0),
    size: 55,
  }),
  columnHelper.accessor("sparkline_in_7d", {
    header: "7D",
    cell: (info) => <Sparkline data={info.getValue()?.price ?? []} />,
    enableSorting: false,
    size: 100,
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
  { id: "near-ath", label: "Near ATH", test: (c) => c.ath_change_percentage >= -15 && c.ath_change_percentage < 0 },
  { id: "near-atl", label: "Near ATL", test: (c) => c.atl_change_percentage <= 15 && c.atl_change_percentage > 0 },
  { id: "above-ath", label: "Above ATH", test: (c) => c.ath_change_percentage >= 0 },
  { id: "deep-drop", label: "Deep Drop >70%", test: (c) => c.ath_change_percentage <= -70 },
  { id: "has-signal", label: "Has Signal", test: (c) => "signals" in c && !!(c as { signals?: CoinSignals }).signals },
  { id: "has-prediction", label: "Has Prediction", test: (c) => { const s = (c as { signals?: CoinSignals }).signals; return !!s?.prediction; } },
];

const PAGE_SIZES = [
  { value: "50", label: "50" },
  { value: "100", label: "100" },
  { value: "250", label: "250" },
  { value: "100000", label: "All" },
];

interface DataTableProps {
  data: CoinWithDerived[];
  signals?: Record<string, CoinSignals>;
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

export function DataTable({ data, signals, onRowClick, capsules = DEFAULT_CAPSULES }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const [cap, setCap] = useState("all");
  const [pageSize, setPageSize] = useState(100);
  const [page, setPage] = useState(0);

  const enrichedData = useMemo(() => {
    if (!signals) return data;
    return data.map((c) => ({
      ...c,
      signals: signals[c.symbol.toLowerCase()],
    }));
  }, [data, signals]);

  const tableData = useMemo(() => {
    let rows = enrichedData;
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
    const activeCapsule = capsules.find((c) => c.id === cap);
    if (activeCapsule && activeCapsule.id !== "all") rows = rows.filter((c) => activeCapsule.test(c as CoinWithDerived));
    return rows;
  }, [enrichedData, search, cap, capsules]);

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

  const signalCount = useMemo(() => tableData.filter((c) => (c as CoinWithDerived & { signals?: CoinSignals }).signals).length, [tableData]);

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
          {signalCount > 0 && (
            <span className="mono" style={{ fontSize: 10, color: "var(--long)" }}>{signalCount} signals</span>
          )}
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
        <table className="mono" style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead className="sticky top-0" style={{ zIndex: 10, background: "var(--panel-raised)", borderBottom: "1px solid var(--hair)" }}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const canSort = header.column.getCanSort();
                  const hidden = COLUMN_CLASSES[header.column.id] ?? "";
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
