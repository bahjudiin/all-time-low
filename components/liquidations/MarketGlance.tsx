"use client";

import { useLiqStore } from "@/lib/liquidationStore";
import { filterByTimeframe, computeDominance } from "@/lib/aggregate";
import { formatUSD } from "@/lib/format";
import { GLANCE_WINDOWS } from "@/types/liquidation";
import type { LiquidationAgg } from "@/types/liquidation";

function DominanceItem({ agg }: { agg: LiquidationAgg }) {
  const dominantPct =
    agg.shortPct >= agg.longPct ? agg.shortPct : agg.longPct;
  const dominantSide = agg.shortPct >= agg.longPct ? "short" : "long";
  const pctColor =
    dominantSide === "short" ? "text-red-400" : "text-green-400";

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm font-medium">{agg.symbol}</span>
      <div className="flex items-center gap-3">
        <span className={`text-sm tabular-nums ${pctColor}`}>
          {(dominantPct * 100).toFixed(1)}%
        </span>
        <span className="text-sm text-zinc-500 tabular-nums">
          {formatUSD(agg.total)}
        </span>
      </div>
    </div>
  );
}

function MixedItem({ agg }: { agg: LiquidationAgg }) {
  const longPct = (agg.longPct * 100).toFixed(0);
  const shortPct = (agg.shortPct * 100).toFixed(0);

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm font-medium">{agg.symbol}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-400 tabular-nums">
          {longPct}/{shortPct}
        </span>
        <span className="text-sm text-zinc-500 tabular-nums">
          {formatUSD(agg.total)}
        </span>
      </div>
    </div>
  );
}

function Section<T>({
  title,
  titleColor,
  items,
  emptyText,
  renderItem,
}: {
  title: string;
  titleColor: string;
  items: T[];
  emptyText: string;
  renderItem: (item: T) => React.ReactNode;
}) {
  return (
    <div>
      <h3
        className={`text-xs uppercase tracking-wider mb-3 ${titleColor}`}
      >
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm italic text-zinc-600">{emptyText}</p>
      ) : (
        <div className="space-y-0.5">
          {items.slice(0, 8).map((item) => renderItem(item))}
        </div>
      )}
    </div>
  );
}

export function MarketGlance() {
  const events = useLiqStore((s) => s.events);
  const glanceWindow = useLiqStore((s) => s.glanceWindow);
  const setGlanceWindow = useLiqStore((s) => s.setGlanceWindow);

  const filtered = filterByTimeframe(events, glanceWindow);
  const { shortDominant, longDominant, mixed } = computeDominance(filtered);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-center gap-2 mb-4">
        {GLANCE_WINDOWS.map((w) => (
          <button
            key={w.ms}
            onClick={() => setGlanceWindow(w.ms)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              glanceWindow === w.ms
                ? "bg-blue-600 text-white"
                : "text-zinc-500 hover:bg-zinc-800"
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Section
          title="Short-Dominant"
          titleColor="text-red-400"
          items={shortDominant}
          emptyText="No coins ≥80% short"
          renderItem={(a) => <DominanceItem key={a.symbol} agg={a} />}
        />
        <Section
          title="Long-Dominant"
          titleColor="text-green-400"
          items={longDominant}
          emptyText="No coins ≥80% long"
          renderItem={(a) => <DominanceItem key={a.symbol} agg={a} />}
        />
        <Section
          title="Mixed"
          titleColor="text-zinc-400"
          items={mixed}
          emptyText="No coin crossed 80% threshold"
          renderItem={(a) => <MixedItem key={a.symbol} agg={a} />}
        />
      </div>
    </div>
  );
}
