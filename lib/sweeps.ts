import type { LiquidationEvent, SweepRecord } from "@/types/liquidation";
import {
  SWEEP_WINDOW_MS,
  SWEEP_PRICE_BAND_PCT,
  SWEEP_MIN_EVENTS,
} from "@/types/liquidation";

function priceBandOk(aPrice: number, bPrice: number): boolean {
  const base = aPrice > 0 ? aPrice : bPrice;
  if (base <= 0) return false;
  return Math.abs((bPrice - aPrice) / base) * 100 <= SWEEP_PRICE_BAND_PCT;
}

export function detectSweeps(events: LiquidationEvent[]): SweepRecord[] {
  const byKey = new Map<string, LiquidationEvent[]>();
  for (const e of events) {
    const key = `${e.symbol}:${e.side}`;
    const arr = byKey.get(key) ?? [];
    arr.push(e);
    byKey.set(key, arr);
  }

  const sweeps: SweepRecord[] = [];
  let sweepSeq = 0;

  for (const slice of byKey.values()) {
    slice.sort((a, b) => a.ts - b.ts);
    const open: { symbol: string; side: "long" | "short"; members: LiquidationEvent[] }[] = [];
    const closed: { symbol: string; side: "long" | "short"; members: LiquidationEvent[] }[] = [];

    for (const e of slice) {
      let target: (typeof open)[number] | null = null;
      let bestDist = Infinity;
      for (const group of open) {
        const last = group.members[group.members.length - 1];
        if (last.ts + SWEEP_WINDOW_MS < e.ts) continue;
        for (let mi = group.members.length - 1; mi >= 0; mi--) {
          const m = group.members[mi];
          if (m.ts + SWEEP_WINDOW_MS < e.ts) break;
          if (priceBandOk(m.price, e.price)) {
            const dist = e.ts - last.ts;
            if (dist < bestDist) {
              bestDist = dist;
              target = group;
            }
            break;
          }
        }
      }

      if (target) {
        target.members.push(e);
      } else {
        open.push({ symbol: e.symbol, side: e.side, members: [e] });
      }

      for (let s = open.length - 1; s >= 0; s--) {
        const last = open[s].members[open[s].members.length - 1];
        if (last.ts + SWEEP_WINDOW_MS < e.ts) {
          closed.push(open[s]);
          open.splice(s, 1);
        }
      }
    }

    closed.push(...open);

    for (const { symbol, side, members } of closed) {
      if (members.length < SWEEP_MIN_EVENTS) continue;
      const firstEvt = members[0];
      const lastEvt = members[members.length - 1];
      sweepSeq++;
      sweeps.push({
        id: `sweep-${symbol}-${side}-${sweepSeq}`,
        symbol,
        side,
        totalUsd: members.reduce((sum, e) => sum + e.usdValue, 0),
        count: members.length,
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