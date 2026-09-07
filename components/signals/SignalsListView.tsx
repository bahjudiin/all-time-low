"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import type { CoinMarket, CoinWithDerived } from "@/types/coin";
import type { CoinSignals, SignalDirection } from "@/types/signal";
import { computeDerived } from "@/lib/coingecko";
import { useNavStore } from "@/lib/navStore";
import { SignalCardDetailed } from "@/components/signals/SignalCardDetailed";
import { isStable, isLowVolatility, hasNoMovement } from "@/lib/filters";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function SignalsListView() {
  const openModal = useNavStore((s) => s.openModal);
  const [dir, setDir] = useState<"all" | SignalDirection>("all");

  const { data: signalCoins, isLoading, error, mutate } = useSWR<(CoinMarket & { signals?: CoinSignals })[]>(
    "/api/signals?currency=usd",
    fetcher,
    { refreshInterval: 300_000, revalidateOnFocus: false, dedupingInterval: 120_000 }
  );

  const filtered = useMemo(() => {
    if (!signalCoins) return [];
    let result = signalCoins
      .map((c) => ({ ...c, ...computeDerived(c) }))
      .filter((c) => c.signals && !isStable(c as never) && !isLowVolatility(c as never) && !hasNoMovement(c as never));
    if (dir !== "all") result = result.filter((c) => c.signals?.direction === dir);
    return result.sort((a, b) => Math.abs(b.signals?.score ?? 0) - Math.abs(a.signals?.score ?? 0));
  }, [signalCoins, dir]);

  const summary = useMemo(() => {
    if (!signalCoins) return { strongLong: 0, long: 0, wait: 0, short: 0, strongShort: 0 };
    const withSignals = signalCoins.filter((c) => c.signals);
    return {
      strongLong: withSignals.filter((c) => c.signals?.direction === "strong_long").length,
      long: withSignals.filter((c) => c.signals?.direction === "long" || c.signals?.direction === "lean_long").length,
      wait: withSignals.filter((c) => c.signals?.direction === "wait").length,
      short: withSignals.filter((c) => c.signals?.direction === "short" || c.signals?.direction === "lean_short").length,
      strongShort: withSignals.filter((c) => c.signals?.direction === "strong_short").length,
    };
  }, [signalCoins]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="mono" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid var(--hair)", fontSize: 11 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "var(--long)", fontWeight: 600 }}>{summary.strongLong} SL</span>
          <span style={{ color: "var(--long)" }}>{summary.long} L</span>
          <span style={{ color: "var(--muted2)" }}>{summary.wait} W</span>
          <span style={{ color: "var(--short)" }}>{summary.short} S</span>
          <span style={{ color: "var(--short)", fontWeight: 600 }}>{summary.strongShort} SS</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {(["all", "strong_long", "long", "short", "strong_short"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDir(d)}
              className="mono"
              style={{
                padding: "3px 8px",
                fontSize: 10,
                border: "none",
                borderRadius: 2,
                background: dir === d ? "var(--amber)" : "none",
                color: dir === d ? "var(--ink)" : "var(--muted2)",
                cursor: "pointer",
                fontWeight: dir === d ? 700 : 400,
              }}
            >
              {d === "all" ? "ALL" : d === "strong_long" ? "SL" : d === "long" ? "L" : d === "short" ? "S" : "SS"}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "60px 0" }}>
            <div style={{ width: 20, height: 20, border: "2px solid var(--amber)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <p className="mono" style={{ fontSize: 11, color: "var(--muted2)" }}>Computing signals...</p>
          </div>
        )}
        {error && !signalCoins && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "60px 0", textAlign: "center" }}>
            <p className="mono" style={{ fontSize: 11, color: "var(--muted2)" }}>Failed to load signals</p>
            <p style={{ fontSize: 10, color: "var(--muted)" }}>{(error as Error).message || "Network error"}</p>
            <button onClick={() => mutate()} style={{ padding: "6px 12px", fontSize: 11, border: "1px solid var(--amber)", background: "none", color: "var(--amber)", borderRadius: 2, cursor: "pointer" }}>Retry</button>
          </div>
        )}
        {!isLoading && !error && filtered.length === 0 && (
          <p className="mono" style={{ fontSize: 11, color: "var(--muted2)", textAlign: "center", padding: "60px 0" }}>No signals available</p>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 8 }}>
          {filtered.map((coin) => (
            <div
              key={coin.id}
              role="button"
              tabIndex={0}
              aria-label={`Open ${coin.name} chart`}
              onClick={() => openModal(coin.symbol)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(coin.symbol); } }}
              style={{ cursor: "pointer" }}
            >
              <SignalCardDetailed coin={coin as CoinWithDerived} signals={coin.signals!} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
