"use client";

import useSWR from "swr";
import { useMemo } from "react";
import type { LiquidationEvent } from "@/types/liquidation";
import { useNavStore } from "@/lib/navStore";
import { computeLiqSignals } from "@/lib/liqSignals";
import { formatUSD, formatCompact } from "@/lib/format";
import { LIQ_TIMEFRAMES, type LiqTimeframe, type LiquidationSubTab } from "@/types/nav";
import { SubTabBar } from "@/components/layout/SubTabBar";

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

  const { data, isLoading, error, mutate } = useSWR<LiquidationHistoryResponse>(
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

  const longSignals = signals.filter((s) => s.side === "long");
  const shortSignals = signals.filter((s) => s.side === "short");
  const mixedSignals = signals.filter((s) => s.side === "mixed");
  const totalLongUsd = longSignals.reduce((s, x) => s + x.totalUsd, 0);
  const totalShortUsd = shortSignals.reduce((s, x) => s + x.totalUsd, 0);
  const topSignal = [...signals].sort((a, b) => b.totalUsd - a.totalUsd)[0];

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
      <div className="desk-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          <h1 style={{ fontSize: 17, margin: 0, fontWeight: 600 }}>Liquidations</h1>
        </div>
      </div>

      <SubTabBar<LiquidationSubTab>
        tabs={[
          { id: "long", label: "Long Dominant" },
          { id: "short", label: "Short Dominant" },
          { id: "mixed", label: "Mixed" },
        ]}
        active={subTab}
        onChange={setSubTab}
      />

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "var(--muted2)", fontSize: 11 }}>TF</span>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as LiqTimeframe)}
            className="mono"
            style={{ padding: "4px 8px", fontSize: 11 }}
          >
            {LIQ_TIMEFRAMES.map((tf) => (
              <option key={tf} value={tf}>{tf}</option>
            ))}
          </select>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span className="mono" style={{ color: "var(--muted2)", fontSize: 11 }}>
            {signals.length} signals · {data?.meta.total ?? 0} events
          </span>
          <span className="mono" style={{ color: "var(--muted2)", fontSize: 11 }}>source: OKX</span>
        </div>
      </div>

      <div className="breadth-row">
        <div className="breadth-cell">
          <div className="lbl">{timeframe} LONG</div>
          <div className="val long">{longSignals.length}</div>
        </div>
        <div className="breadth-cell">
          <div className="lbl">{timeframe} SHORT</div>
          <div className="val short">{shortSignals.length}</div>
        </div>
        <div className="breadth-cell">
          <div className="lbl">MIXED</div>
          <div className="val">{mixedSignals.length}</div>
        </div>
        <div className="breadth-cell">
          <div className="lbl">LONG $</div>
          <div className="val long">{formatCompact(totalLongUsd)}</div>
        </div>
        <div className="breadth-cell">
          <div className="lbl">SHORT $</div>
          <div className="val short">{formatCompact(totalShortUsd)}</div>
        </div>
        <div className="breadth-cell">
          <div className="lbl">TOP</div>
          <div className="val amber">{topSignal ? `${topSignal.symbol.toUpperCase()} ${formatCompact(topSignal.totalUsd)}` : "—"}</div>
        </div>
        <div className="breadth-cell">
          <div className="lbl">EVENTS</div>
          <div className="val">{events.length}</div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1" style={{ minHeight: 0, overflow: "hidden" }}>
        {error && !data ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "40px 24px" }}>
            <p style={{ color: "var(--muted)", fontSize: 12 }}>Failed to load liquidation history</p>
            <p style={{ color: "var(--muted2)", fontSize: 11 }}>{(error as Error).message || "Network error"}</p>
            <button onClick={() => mutate()} className="mono" style={{ padding: "5px 14px", fontSize: 11, fontWeight: 600, border: "1px solid var(--amber)", borderRadius: 2, background: "var(--amber)", color: "var(--ink)", cursor: "pointer" }}>
              Retry
            </button>
          </div>
        ) : isLoading && !data ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "40px 24px" }}>
            <div style={{ width: 20, height: 20, border: "2px solid var(--amber)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <p style={{ color: "var(--muted2)", fontSize: 11 }}>Fetching liquidation history...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "40px 24px" }}>
            <p style={{ color: "var(--muted)", fontSize: 12 }}>No liquidation signals for this window</p>
            <p style={{ color: "var(--muted2)", fontSize: 11, textAlign: "center", maxWidth: 400 }}>
              Signals require {">"}80% one-directional dominance. Try a longer timeframe (e.g. 4h or 24h).
            </p>
          </div>
        ) : (
          <div className="panel-box">
            <div className="ph">
              Liquidation Dominance
              <span className="n">OKX · {timeframe}</span>
            </div>
            <div className="scroll-x" style={{ maxHeight: 500 }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Coin</th>
                    <th>Side</th>
                    <th>Dom</th>
                    <th>Long %</th>
                    <th>Short %</th>
                    <th>Total $</th>
                    <th>Events</th>
                    <th>Agree</th>
                    <th>Forecast</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 100).map((s) => (
                    <tr
                      key={`${s.symbol}-${s.timeframe}-${s.side}`}
                      onClick={() => handleSelect(s.symbol, s)}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={{ textAlign: "left", fontWeight: 600 }}>{s.symbol.toUpperCase()}</td>
                      <td>
                        <span className={`badge ${s.side === "long" ? "long" : s.side === "short" ? "short" : "mute"}`}>
                          {s.side.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ color: "var(--amber)" }}>{((s.side === "long" ? s.longPct : s.shortPct)).toFixed(0)}%</td>
                      <td style={{ color: "var(--long)" }}>{s.longPct.toFixed(1)}%</td>
                      <td style={{ color: "var(--short)" }}>{s.shortPct.toFixed(1)}%</td>
                      <td>{formatUSD(s.totalUsd)}</td>
                      <td style={{ color: "var(--muted)" }}>{s.count}</td>
                      <td style={{ color: s.agreementPct >= 80 ? "var(--long)" : "var(--amber)" }}>
                        {s.agreementPct.toFixed(0)}%
                      </td>
                      <td>
                        <span className={`badge ${s.predictedPump ? "long" : s.predictedDump ? "short" : "mute"}`}>
                          {s.predictedPump ? "PUMP" : s.predictedDump ? "DUMP" : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Cascade Rule */}
      <div className="panel-box" style={{ marginTop: 14 }}>
        <div className="ph">Cascade Rule</div>
        <div className="planline"><span className="k">Trigger</span><span>{">"}80% one-directional dominance</span></div>
        <div className="planline"><span className="k">Confirmation</span><span>Agreement across 5m / 10m / 1h / 4h / 12h / 24h / 7d</span></div>
        <div className="planline"><span className="k">Long liquidations</span><span style={{ color: "var(--short)" }}>→ forced selling → DUMP</span></div>
        <div className="planline"><span className="k">Short liquidations</span><span style={{ color: "var(--long)" }}>→ forced buying → PUMP</span></div>
        <div className="planline"><span className="k">Data source</span><span>OKX</span></div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
