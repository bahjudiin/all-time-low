"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLiqStore } from "@/lib/liquidationStore";
import { filterByTimeframe, computeSymbolAggregates } from "@/lib/aggregate";
import { formatCompact } from "@/lib/format";
import { TIMEFRAME_MS, type HistoryTimeframe } from "@/types/liquidation";
import { LiqTable } from "./LiqTable";

const TIMEFRAMES: HistoryTimeframe[] = ["5m", "15m", "1h", "4h", "12h", "1d", "1w"];

interface Bucket {
  label: string;
  longUsd: number;
  shortUsd: number;
}

function formatBucketLabel(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function buildBuckets(
  events: ReturnType<typeof filterByTimeframe>,
  windowMs: number,
): Bucket[] {
  const now = Date.now();
  const start = now - windowMs;
  const bucketCount = 12;
  const bucketSize = windowMs / bucketCount;
  const buckets: Bucket[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const bStart = start + i * bucketSize;
    buckets.push({ label: formatBucketLabel(bStart), longUsd: 0, shortUsd: 0 });
  }

  for (const e of events) {
    let bi = Math.floor((e.ts - start) / bucketSize);
    if (bi >= bucketCount) bi = bucketCount - 1;
    if (bi < 0) continue;
    if (e.side === "long") {
      buckets[bi].longUsd += e.usdValue;
    } else {
      buckets[bi].shortUsd += e.usdValue;
    }
  }

  return buckets;
}

export function HistoryTab() {
  const events = useLiqStore((s) => s.events);
  const historyTimeframe = useLiqStore((s) => s.historyTimeframe);
  const setHistoryTimeframe = useLiqStore((s) => s.setHistoryTimeframe);

  const windowMs = TIMEFRAME_MS[historyTimeframe];

  const filtered = useMemo(
    () => filterByTimeframe(events, windowMs),
    [events, windowMs],
  );

  const buckets = useMemo(
    () => buildBuckets(filtered, windowMs),
    [filtered, windowMs],
  );

  const topEvents = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => b.usdValue - a.usdValue);
    return sorted.slice(0, 50);
  }, [filtered]);

  return (
    <div className="flex-1 flex flex-col gap-4 p-4 overflow-auto">
      <div className="flex gap-1 flex-wrap">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => setHistoryTimeframe(tf)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              historyTimeframe === tf
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      <div className="border border-zinc-800/50 rounded-lg p-2">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={buckets}>
            <XAxis
              dataKey="label"
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCompact}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value, name) => [
                formatCompact(Number(value)),
                name === "longUsd" ? "Long" : "Short",
              ]}
            />
            <Bar dataKey="longUsd" stackId="a" fill="#22c55e" isAnimationActive={false} />
            <Bar dataKey="shortUsd" stackId="a" fill="#ef4444" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-zinc-300">Top Events</h3>
        <LiqTable data={topEvents} showExchange />
      </div>
    </div>
  );
}
