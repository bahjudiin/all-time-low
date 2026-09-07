import type { LiquidationEvent } from "@/types/liquidation";
import type { LiqSignal } from "@/types/nav";
import { DOMINANCE_THRESHOLD } from "@/types/liquidation";

const WINDOW_MS: Record<LiqSignal["timeframe"], number> = {
  "1m": 60 * 1000,
  "5m": 5 * 60 * 1000,
  "10m": 10 * 60 * 1000,
  "15m": 15 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "4h": 4 * 60 * 60 * 1000,
  "12h": 12 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "14d": 14 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

// Windows used to test cross-timeframe direction agreement (subset of the above)
const AGREEMENT_WINDOWS: LiqSignal["timeframe"][] = ["5m", "10m", "1h", "4h", "12h", "24h", "7d"];

function dominantFor(symbolEvents: LiquidationEvent[], windowMs: number): "long" | "short" | "mixed" | "none" {
  const cutoff = Date.now() - windowMs;
  const inWindow = symbolEvents.filter((e) => e.ts >= cutoff);
  if (inWindow.length === 0) return "none";
  const longUsd = inWindow.filter((e) => e.side === "long").reduce((s, e) => s + e.usdValue, 0);
  const shortUsd = inWindow.filter((e) => e.side === "short").reduce((s, e) => s + e.usdValue, 0);
  const total = longUsd + shortUsd;
  if (total <= 0) return "none";
  const longPct = longUsd / total;
  if (longPct >= DOMINANCE_THRESHOLD) return "long";
  if (shortUsd / total >= DOMINANCE_THRESHOLD) return "short";
  return "mixed";
}

function indexBySymbol(events: LiquidationEvent[]): Map<string, LiquidationEvent[]> {
  const bySymbol = new Map<string, LiquidationEvent[]>();
  for (const e of events) {
    const arr = bySymbol.get(e.symbol) ?? [];
    arr.push(e);
    bySymbol.set(e.symbol, arr);
  }
  return bySymbol;
}

export function computeLiqSignals(
  events: LiquidationEvent[],
  timeframe: LiqSignal["timeframe"]
): LiqSignal[] {
  if (events.length === 0) return [];

  const windowMs = WINDOW_MS[timeframe] ?? 60 * 60 * 1000;
  const cutoff = Date.now() - windowMs;
  const inWindow = events.filter((e) => e.ts >= cutoff);
  if (inWindow.length === 0) return [];

  const bySymbol = indexBySymbol(events);

  const map = new Map<string, { longUsd: number; shortUsd: number; count: number }>();
  for (const e of inWindow) {
    let agg = map.get(e.symbol);
    if (!agg) {
      agg = { longUsd: 0, shortUsd: 0, count: 0 };
      map.set(e.symbol, agg);
    }
    if (e.side === "long") agg.longUsd += e.usdValue;
    else agg.shortUsd += e.usdValue;
    agg.count++;
  }

  const signals: LiqSignal[] = [];
  for (const [symbol, agg] of map) {
    const total = agg.longUsd + agg.shortUsd;
    if (total <= 0) continue;
    const longPct = agg.longUsd / total;
    const shortPct = agg.shortUsd / total;

    const dominantSide: LiqSignal["side"] | "mixed" =
      longPct >= DOMINANCE_THRESHOLD ? "long"
      : shortPct >= DOMINANCE_THRESHOLD ? "short"
      : "mixed";

    // How many agreement windows agree on the same direction (>= 80% dominance in that window)
    const symbolEvents = bySymbol.get(symbol) ?? [];
    let agreed = 0;
    let tested = 0;
    for (const w of AGREEMENT_WINDOWS) {
      const d = dominantFor(symbolEvents, WINDOW_MS[w]);
      if (d === "none") continue;
      tested++;
      if (d === dominantSide) agreed++;
    }

    signals.push({
      symbol,
      side: dominantSide,
      totalUsd: total,
      longPct: longPct * 100,
      shortPct: shortPct * 100,
      count: agg.count,
      timeframe,
      agreementPct: tested > 0 ? (agreed / tested) * 100 : 100,
      agreementSamples: tested,
      // Long liquidations = forced selling = downward pressure; short
      // liquidations = covering/buying = upward pressure.
      predictedPump: dominantSide === "short",
      predictedDump: dominantSide === "long",
    });
  }

  signals.sort((a, b) => b.totalUsd - a.totalUsd);
  return signals;
}