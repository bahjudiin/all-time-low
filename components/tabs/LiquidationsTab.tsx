"use client";

import useSWR from "swr";
import { useMemo } from "react";
import type { LiquidationEvent } from "@/types/liquidation";
import { useNavStore } from "@/lib/navStore";
import { computeLiqSignals } from "@/lib/liqSignals";
import { MarketGlanceStrip, type GlanceMetric } from "@/components/layout/MarketGlanceStrip";
import { SubTabBar } from "@/components/layout/SubTabBar";
import { Tooltip } from "@/components/ui/Tooltip";
import { Dropdown } from "@/components/ui/Dropdown";
import { LIQ_TIMEFRAMES, type LiqTimeframe } from "@/types/nav";
import { formatUSD, formatCompact } from "@/lib/format";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface LiquidationHistoryResponse {
  events: LiquidationEvent[];
  meta: {
    count: number;
    total: number;
    symbol: string | null;
    provider: string;
    queriedAt: string;
  };
}

export function LiquidationsTab() {
  const subTab = useNavStore((s) => s.liquidationSubTab);
  const setSubTab = useNavStore((s) => s.setLiquidationSubTab);
  const timeframe = useNavStore((s) => s.liqTimeframe);
  const setTimeframe = useNavStore((s) => s.setLiqTimeframe);
  const openModalWithExtra = useNavStore((s) => s.openModalWithExtra);

  const { data, isLoading } = useSWR<LiquidationHistoryResponse>(
    "/api/liquidations/history",
    fetcher,
    { refreshInterval: 30_000, revalidateOnFocus: true, dedupingInterval: 15_000 }
  );

  const events = useMemo(() => data?.events ?? [], [data]);

  const signals = useMemo(() => computeLiqSignals(events, timeframe), [events, timeframe]);

  const filtered = useMemo(() => {
    if (!signals) return [];
    if (subTab === "mixed") return signals.filter((s) => s.side === "mixed");
    return signals.filter((s) => s.side === subTab);
  }, [signals, subTab]);

  const metrics: GlanceMetric[] = useMemo(() => {
    const longSignals = signals.filter((s) => s.side === "long");
    const shortSignals = signals.filter((s) => s.side === "short");
    const mixedSignals = signals.filter((s) => s.side === "mixed");
    const totalLongUsd = longSignals.reduce((s, x) => s + x.totalUsd, 0);
    const totalShortUsd = shortSignals.reduce((s, x) => s + x.totalUsd, 0);
    const top = [...signals].sort((a, b) => b.totalUsd - a.totalUsd)[0];
    return [
      { label: `${timeframe} Long`, value: String(longSignals.length), color: "text-emerald-400" },
      { label: `${timeframe} Short`, value: String(shortSignals.length), color: "text-red-400" },
      { label: "Mixed", value: String(mixedSignals.length), color: "text-zinc-300" },
      { label: "Long $", value: formatCompact(totalLongUsd), color: "text-emerald-400" },
      { label: "Short $", value: formatCompact(totalShortUsd), color: "text-red-400" },
      {
        label: "Top",
        value: top ? `${top.symbol.toUpperCase()} ${formatCompact(top.totalUsd)}` : "—",
        color: "text-amber-400",
      },
      { label: "Events", value: String(events.length), color: "text-zinc-300" },
    ];
  }, [signals, timeframe, events.length]);

  const handleSelect = (symbol: string, signal: (typeof signals)[number]) => {
    openModalWithExtra(symbol, {
      liq: {
        symbol,
        side: signal.side,
        totalUsd: signal.totalUsd,
        longPct: signal.longPct,
        shortPct: signal.shortPct,
        count: signal.count,
        timeframe: signal.timeframe,
        agreementPct: signal.agreementPct,
        agreementSamples: signal.agreementSamples,
        predictedPump: signal.predictedPump,
        predictedDump: signal.predictedDump,
      },
    });
  };

  return (
    <>
      <SubTabBar
        tabs={[
          { id: "long", label: "Long Dominant" },
          { id: "short", label: "Short Dominant" },
          { id: "mixed", label: "Mixed" },
        ]}
        active={subTab}
        onChange={setSubTab}
      />

      {/* Filters row */}
      <div className="flex items-center gap-2 px-4 md:px-6 py-2 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <Dropdown
          label="TF"
          value={timeframe}
          onChange={(v) => setTimeframe(v as LiqTimeframe)}
          options={LIQ_TIMEFRAMES.map((tf) => ({ value: tf, label: tf }))}
        />
        <Tooltip label="Signals require >80% one-directional liquidation dominance across the selected window, with cross-timeframe agreement scored against 5m/10m/1h/4h/12h/24h/7d.">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800 text-[10px] text-zinc-500 cursor-help">
            i
          </span>
        </Tooltip>
        <div className="ml-auto flex items-center gap-3 whitespace-nowrap">
          <span className="text-[11px] text-zinc-500">
            {signals.length} signals · {data?.meta.total ?? 0} events
          </span>
          <span className="text-[11px] text-zinc-500">source: OKX</span>
        </div>
      </div>

      <MarketGlanceStrip metrics={metrics} />

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {isLoading && !data ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-zinc-500">Fetching liquidation history...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 px-6">
            <p className="text-sm text-zinc-500">No liquidation signals for this window</p>
            <p className="text-xs text-zinc-600 text-center max-w-md">
              Signals require {">"}80% one-directional liquidation dominance. Try a longer
              timeframe (e.g. 4h or 24h) to see per-coin history signals.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-900 z-10">
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500">
                  <th className="px-3 py-2 font-medium">Coin</th>
                  <th className="px-3 py-2 font-medium">Side</th>
                  <th className="px-3 py-2 font-medium">Long %</th>
                  <th className="px-3 py-2 font-medium">Short %</th>
                  <th className="px-3 py-2 font-medium">Total $</th>
                  <th className="px-3 py-2 font-medium">Events</th>
                  <th className="px-3 py-2 font-medium">Agreement</th>
                  <th className="px-3 py-2 font-medium">Forecast</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((s) => (
                  <tr
                    key={`${s.symbol}-${s.timeframe}-${s.side}`}
                    onClick={() => handleSelect(s.symbol, s)}
                    className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2 font-medium uppercase">{s.symbol}</td>
                    <td className={`px-3 py-2 font-medium ${s.side === "long" ? "text-emerald-400" : s.side === "short" ? "text-red-400" : "text-zinc-400"}`}>
                      {s.side.toUpperCase()}
                    </td>
                    <td className="px-3 py-2 font-mono text-emerald-400">{s.longPct.toFixed(1)}%</td>
                    <td className="px-3 py-2 font-mono text-red-400">{s.shortPct.toFixed(1)}%</td>
                    <td className="px-3 py-2 font-mono">{formatUSD(s.totalUsd)}</td>
                    <td className="px-3 py-2 font-mono text-zinc-400">{s.count}</td>
                    <td className={`px-3 py-2 font-mono ${s.agreementPct >= 80 ? "text-emerald-400" : "text-amber-400"}`}>
                      {s.agreementPct.toFixed(0)}%
                    </td>
                    <td className={`px-3 py-2 font-mono font-medium ${s.predictedPump ? "text-emerald-400" : s.predictedDump ? "text-red-400" : "text-zinc-400"}`}>
                      {s.predictedPump ? "PUMP" : s.predictedDump ? "DUMP" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}