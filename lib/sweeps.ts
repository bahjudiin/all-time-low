import type { LiquidationEvent, SweepRecord } from "@/types/liquidation";
import {
  SWEEP_WINDOW_MS,
  SWEEP_PRICE_BAND_PCT,
  SWEEP_MIN_EVENTS,
} from "@/types/liquidation";

export function detectSweeps(events: LiquidationEvent[]): SweepRecord[] {
  const sorted = [...events].sort((a, b) =>
    a.symbol.localeCompare(b.symbol) || a.ts - b.ts,
  );

  const sweeps: SweepRecord[] = [];

  let i = 0;
  while (i < sorted.length) {
    const group: LiquidationEvent[] = [sorted[i]];
    const first = sorted[i];
    i++;

    while (i < sorted.length) {
      const next = sorted[i];
      if (
        next.symbol !== first.symbol ||
        next.side !== first.side ||
        next.ts - first.ts > SWEEP_WINDOW_MS ||
        Math.abs((next.price - first.price) / first.price) * 100 >
          SWEEP_PRICE_BAND_PCT
      ) {
        break;
      }
      group.push(next);
      i++;
    }

    if (group.length >= SWEEP_MIN_EVENTS) {
      const firstEvt = group[0];
      const lastEvt = group[group.length - 1];
      sweeps.push({
        id: `sweep-${firstEvt.symbol}-${firstEvt.side}-${firstEvt.ts}`,
        symbol: firstEvt.symbol,
        side: firstEvt.side,
        totalUsd: group.reduce((sum, e) => sum + e.usdValue, 0),
        count: group.length,
        priceStart: firstEvt.price,
        priceEnd: lastEvt.price,
        priceMove:
          firstEvt.price > 0
            ? ((lastEvt.price - firstEvt.price) / firstEvt.price) * 100
            : 0,
        duration: lastEvt.ts - firstEvt.ts,
        startTime: firstEvt.ts,
        endTime: lastEvt.ts,
      });
    }
  }

  return sweeps.sort((a, b) => b.totalUsd - a.totalUsd);
}
