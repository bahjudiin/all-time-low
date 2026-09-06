"use client";

import useSWR from "swr";
import { useEffect, useMemo, useState } from "react";
import type { LiquidationEvent } from "@/types/liquidation";
import { useLiqStore } from "@/lib/liquidationStore";
import { getLiquidationWS } from "@/lib/wsClient";
import { useNavStore } from "@/lib/navStore";
import { computeLiqSignals } from "@/lib/liqSignals";
import { MarketGlanceStrip, type GlanceMetric } from "@/components/layout/MarketGlanceStrip";
import { SubTabBar } from "@/components/layout/SubTabBar";
import { LIQ_TIMEFRAMES, type LiqTimeframe } from "@/types/nav";
import { formatUSD, formatCompact } from "@/lib/format";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface LiquidationApiResponse {
  events: LiquidationEvent[];
}

function WsStatus({ status }: { status: string }) {
  const color =
    status === "open"
      ? "bg-green-500"
      : status === "reconnecting"
        ? "bg-yellow-500 animate-pulse"
        : "bg-zinc-600";
  const label =
    status === "open"
      ? "Live"
      : status === "reconnecting"
        ? "Reconnecting"
        : status === "connecting"
          ? "Connecting"
          : "Offline";
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400">
      <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

export function LiquidationsTab() {
  const subTab = useNavStore((s) => s.liquidationSubTab);
  const setSubTab = useNavStore((s) => s.setLiquidationSubTab);
  const timeframe = useNavStore((s) => s.liqTimeframe);
  const setTimeframe = useNavStore((s) => s.setLiqTimeframe);
  const openModalWithExtra = useNavStore((s) => s.openModalWithExtra);

  const events = useLiqStore((s) => s.events);
  const [wsStatus, setWsStatus] = useState("closed");

  const { data: bootstrap } = useSWR<LiquidationApiResponse>(
    "/api/liquidations",
    fetcher,
    { refreshInterval: 300_000, revalidateOnFocus: true }
  );

  useEffect(() => {
    const ws = getLiquidationWS();
    const unsubEvent = ws.onEvent((event) => {
      useLiqStore.getState().addEvent(event);
    });
    const unsubStatus = ws.onStatus((s) => setWsStatus(s));
    ws.connect();
    return () => {
      unsubEvent();
      unsubStatus();
      ws.disconnect();
    };
  }, []);

  useEffect(() => {
    if (bootstrap?.events && bootstrap.events.length > 0) {
      useLiqStore.getState().addEvents(bootstrap.events);
    }
  }, [bootstrap]);

  const signals = useMemo(
    () => computeLiqSignals(events, timeframe),
    [events, timeframe]
  );

  const filtered = useMemo(() => {
    if (subTab === "mixed") return signals.filter((s) => s.side === "mixed");
    return signals.filter((s) => s.side === subTab);
  }, [signals, subTab]);

  const metrics: GlanceMetric[] = useMemo(() => {
    const windowLabel = timeframe;
    const longSignals = signals.filter((s) => s.side === "long");
    const shortSignals = signals.filter((s) => s.side === "short");
    const totalLongUsd = longSignals.reduce((s, x) => s + x.totalUsd, 0);
    const totalShortUsd = shortSignals.reduce((s, x) => s + x.totalUsd, 0);
    return [
      { label: `${windowLabel} Long`, value: `${longSignals.length}`, color: "text-green-400" },
      { label: `${windowLabel} Short`, value: `${shortSignals.length}`, color: "text-red-400" },
      { label: "Long $", value: formatCompact(totalLongUsd), color: "text-green-400" },
      { label: "Short $", value: formatCompact(totalShortUsd), color: "text-red-400" },
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

      {/* Timeframe selector */}
      <div className="flex items-center gap-1 px-4 md:px-6 py-2 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <span className="text-[11px] text-zinc-500 mr-1 whitespace-nowrap">TF:</span>
        {LIQ_TIMEFRAMES.map((tf: LiqTimeframe) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap ${
              timeframe === tf
                ? "bg-blue-600 text-white"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            {tf}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <WsStatus status={wsStatus} />
          <span className="text-[11px] text-zinc-500">{events.length} events</span>
        </div>
      </div>

      <MarketGlanceStrip metrics={metrics} />

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 px-6">
            <p className="text-sm text-zinc-500">No liquidation signals yet</p>
            <p className="text-xs text-zinc-600 text-center max-w-md">
              Wait for the live liquidation feed to populate, or switch to a shorter timeframe.
              Signals require {">"}80% one-directional liquidation dominance.
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