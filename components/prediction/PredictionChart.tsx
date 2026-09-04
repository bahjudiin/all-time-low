"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { CoinPrediction } from "@/types/prediction";

interface PredictionChartProps {
  prediction: CoinPrediction;
}

function formatPrice(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(6)}`;
}

export function PredictionChart({ prediction }: PredictionChartProps) {
  const p = prediction;

  const chartData = useMemo(() => {
    const currentPrice = p.currentPrice;
    const zoneUpper = p.predictedZone.upper;
    const zoneLower = p.predictedZone.lower;

    const allPrices = [currentPrice, zoneUpper, zoneLower, p.invalidation];
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const range = maxPrice - minPrice || currentPrice * 0.01;

    const points = [];
    const numPoints = 30;

    const startPrice = p.direction === "SHORT"
      ? currentPrice * (1 - Math.abs(p.movePercent) / 200)
      : currentPrice * (1 + Math.abs(p.movePercent) / 200);

    for (let i = 0; i < numPoints; i++) {
      const progress = i / (numPoints - 1);
      let price: number;

      if (i < numPoints - 1) {
        const trend = startPrice + (currentPrice - startPrice) * progress;
        const noise = Math.sin(i * 0.8) * range * 0.02;
        price = trend + noise;
      } else {
        price = currentPrice;
      }

      points.push({
        time: i,
        price: Math.round(price * 10000) / 10000,
        zoneUpper: Math.round(zoneUpper * 10000) / 10000,
        zoneLower: Math.round(zoneLower * 10000) / 10000,
      });
    }

    return points;
  }, [p]);

  const priceRange = useMemo(() => {
    const allPrices = [
      p.currentPrice,
      p.predictedZone.upper,
      p.predictedZone.lower,
      p.invalidation,
      p.limitLevels.l1,
      p.limitLevels.l3,
    ];
    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    const padding = (max - min) * 0.15;
    return {
      min: min - padding,
      max: max + padding,
    };
  }, [p]);

  const zoneColor = p.direction === "SHORT" ? "#ef4444" : "#22c55e";
  const zoneColorLight = p.direction === "SHORT" ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)";

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-[10px]">
        <div className="text-zinc-300 font-mono">{formatPrice(payload[0].value)}</div>
      </div>
    );
  };

  return (
    <div className="bg-zinc-950 p-2">
      <div className="flex items-center justify-between mb-1 px-1">
        <span className="text-[10px] text-zinc-500">Price Chart</span>
        <span className={`text-[10px] font-bold ${p.direction === "SHORT" ? "text-red-400" : "text-green-400"}`}>
          {p.direction} ZONE
        </span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
          <defs>
            <linearGradient id={`zoneFill-${p.symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={zoneColor} stopOpacity={0.25} />
              <stop offset="100%" stopColor={zoneColor} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" hide />
          <YAxis
            domain={[priceRange.min, priceRange.max]}
            tickFormatter={(v) => formatPrice(v)}
            tick={{ fontSize: 9, fill: "#71717a" }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Zone area fill using stacked areas */}
          <Area
            type="monotone"
            dataKey="zoneUpper"
            stroke={zoneColor}
            strokeWidth={1}
            strokeOpacity={0.5}
            fill={`url(#zoneFill-${p.symbol})`}
            dot={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="zoneLower"
            stroke={zoneColor}
            strokeWidth={1}
            strokeOpacity={0.5}
            fill="#0a0a0a"
            dot={false}
            isAnimationActive={false}
          />

          {/* L1 Level */}
          <ReferenceLine
            y={p.limitLevels.l1}
            stroke="#3b82f6"
            strokeDasharray="3 3"
            strokeOpacity={0.6}
            label={{
              value: "L1",
              position: "right",
              fill: "#3b82f6",
              fontSize: 9,
            }}
          />

          {/* L2 Level */}
          <ReferenceLine
            y={p.limitLevels.l2}
            stroke="#3b82f6"
            strokeDasharray="3 3"
            strokeOpacity={0.8}
            label={{
              value: "L2",
              position: "right",
              fill: "#3b82f6",
              fontSize: 9,
            }}
          />

          {/* L3 Level */}
          <ReferenceLine
            y={p.limitLevels.l3}
            stroke="#3b82f6"
            strokeDasharray="3 3"
            strokeOpacity={0.6}
            label={{
              value: "L3",
              position: "right",
              fill: "#3b82f6",
              fontSize: 9,
            }}
          />

          {/* Invalidation */}
          <ReferenceLine
            y={p.invalidation}
            stroke="#ef4444"
            strokeDasharray="6 3"
            strokeOpacity={0.5}
            label={{
              value: "INVALID",
              position: "right",
              fill: "#ef4444",
              fontSize: 8,
            }}
          />

          {/* Current Price */}
          <ReferenceLine
            y={p.currentPrice}
            stroke="#a1a1aa"
            strokeWidth={1}
            strokeDasharray="2 2"
            label={{
              value: "CURRENT",
              position: "left",
              fill: "#a1a1aa",
              fontSize: 8,
            }}
          />

          {/* VWAP */}
          {Math.abs(p.factors.vwap.vwap - p.currentPrice) > p.currentPrice * 0.001 && (
            <ReferenceLine
              y={p.factors.vwap.vwap}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeOpacity={0.4}
              label={{
                value: "VWAP",
                position: "right",
                fill: "#f59e0b",
                fontSize: 8,
              }}
            />
          )}

          {/* Price line */}
          <Area
            type="monotone"
            dataKey="price"
            stroke="#e4e4e7"
            strokeWidth={1.5}
            fill="none"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
