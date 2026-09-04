import type {
  LiquidationEvent,
  LiquidationAgg,
  MarketGlanceGroup,
  MatrixCell,
} from "@/types/liquidation";
import { DOMINANCE_THRESHOLD } from "@/types/liquidation";

export function filterByTimeframe(
  events: LiquidationEvent[],
  windowMs: number,
): LiquidationEvent[] {
  const now = Date.now();
  const cutoff = now - windowMs;
  return events.filter((e) => e.ts >= cutoff);
}

export function computeSymbolAggregates(
  events: LiquidationEvent[],
): LiquidationAgg[] {
  const map = new Map<string, { longUsd: number; shortUsd: number }>();

  for (const e of events) {
    let agg = map.get(e.symbol);
    if (!agg) {
      agg = { longUsd: 0, shortUsd: 0 };
      map.set(e.symbol, agg);
    }
    if (e.side === "long") {
      agg.longUsd += e.usdValue;
    } else {
      agg.shortUsd += e.usdValue;
    }
  }

  const result: LiquidationAgg[] = [];
  for (const [symbol, { longUsd, shortUsd }] of map) {
    const total = longUsd + shortUsd;
    result.push({
      symbol,
      longUsd,
      shortUsd,
      total,
      longPct: total > 0 ? longUsd / total : 0.5,
      shortPct: total > 0 ? shortUsd / total : 0.5,
    });
  }

  result.sort((a, b) => b.total - a.total);
  return result;
}

export function computeDominance(events: LiquidationEvent[]): MarketGlanceGroup {
  const aggs = computeSymbolAggregates(events);

  const shortDominant: LiquidationAgg[] = [];
  const longDominant: LiquidationAgg[] = [];
  const mixed: LiquidationAgg[] = [];

  for (const agg of aggs) {
    if (agg.shortPct >= DOMINANCE_THRESHOLD) {
      shortDominant.push(agg);
    } else if (agg.longPct >= DOMINANCE_THRESHOLD) {
      longDominant.push(agg);
    } else {
      mixed.push(agg);
    }
  }

  shortDominant.sort((a, b) => b.shortPct - a.shortPct);
  longDominant.sort((a, b) => b.longPct - a.longPct);

  return { shortDominant, longDominant, mixed };
}

export function computeMatrix(
  events: LiquidationEvent[],
  bucketCount: number = 8,
): MatrixCell[][] {
  if (events.length === 0) return [];

  const minTs = Math.min(...events.map((e) => e.ts));
  const maxTs = Math.max(...events.map((e) => e.ts));

  if (minTs === maxTs) {
    const symbols = [...new Set(events.map((e) => e.symbol))];
    return symbols.map((symbol) => [
      {
        symbol,
        bucketIndex: 0,
        bucketStart: minTs,
        bucketEnd: maxTs,
        dominantSide: "neutral" as const,
        longUsd: 0,
        shortUsd: 0,
        totalUsd: 0,
        intensity: 0,
      },
    ]);
  }

  const range = maxTs - minTs;
  const bucketSize = range / bucketCount;

  const symbolGroups = new Map<string, LiquidationEvent[]>();
  for (const e of events) {
    const arr = symbolGroups.get(e.symbol) ?? [];
    arr.push(e);
    symbolGroups.set(e.symbol, arr);
  }

  const cellMap = new Map<string, { longUsd: number; shortUsd: number }>();

  for (const [, evts] of symbolGroups) {
    for (const e of evts) {
      let bi = Math.floor((e.ts - minTs) / bucketSize);
      if (bi >= bucketCount) bi = bucketCount - 1;

      const key = `${e.symbol}-${bi}`;
      let cell = cellMap.get(key);
      if (!cell) {
        cell = { longUsd: 0, shortUsd: 0 };
        cellMap.set(key, cell);
      }

      if (e.side === "long") {
        cell.longUsd += e.usdValue;
      } else {
        cell.shortUsd += e.usdValue;
      }
    }
  }

  let maxUsd = 0;
  for (const { longUsd, shortUsd } of cellMap.values()) {
    const total = longUsd + shortUsd;
    if (total > maxUsd) maxUsd = total;
  }

  const symbols = [...symbolGroups.keys()].sort((a, b) => {
    const aVol = [...(symbolGroups.get(a) ?? [])].reduce(
      (s, e) => s + e.usdValue,
      0,
    );
    const bVol = [...(symbolGroups.get(b) ?? [])].reduce(
      (s, e) => s + e.usdValue,
      0,
    );
    return bVol - aVol;
  });

  return symbols.map((symbol) => {
    return Array.from({ length: bucketCount }, (_, bi) => {
      const key = `${symbol}-${bi}`;
      const cell = cellMap.get(key) ?? { longUsd: 0, shortUsd: 0 };
      const totalUsd = cell.longUsd + cell.shortUsd;
      const dominantSide:
        | "long"
        | "short"
        | "neutral" =
        cell.longUsd > cell.shortUsd
          ? "long"
          : cell.shortUsd > cell.longUsd
            ? "short"
            : "neutral";

      return {
        symbol,
        bucketIndex: bi,
        bucketStart: minTs + bi * bucketSize,
        bucketEnd: minTs + (bi + 1) * bucketSize,
        dominantSide,
        longUsd: cell.longUsd,
        shortUsd: cell.shortUsd,
        totalUsd,
        intensity: maxUsd > 0 ? totalUsd / maxUsd : 0,
      };
    });
  });
}

export function getPriceDecimals(price: number): number {
  if (price >= 1000) return 2;
  if (price >= 1) return 2;
  if (price >= 0.01) return 4;
  return 8;
}
