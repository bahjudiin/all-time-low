"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
}

export function Sparkline({ data, width = 120, height = 32 }: SparklineProps) {
  const { chartData, color } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], color: "#6b7280" };
    }

    const first = data[0];
    const last = data[data.length - 1];
    const isPositive = last >= first;

    const chartData = data.map((value, index) => ({
      value,
      index,
    }));

    return {
      chartData,
      color: isPositive ? "#22c55e" : "#ef4444",
    };
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center text-zinc-400 text-xs"
      >
        —
      </div>
    );
  }

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          dot={false}
          strokeWidth={1.5}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
