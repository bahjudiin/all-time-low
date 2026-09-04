"use client";

import { useMemo } from "react";
import { Pause, Play } from "lucide-react";
import { useLiqStore } from "@/lib/liquidationStore";
import { LiqTable } from "./LiqTable";

function LiveIndicator({ paused }: { paused: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium">
      <span
        className={`w-2 h-2 rounded-full ${
          paused
            ? "bg-orange-500"
            : "bg-green-500 animate-pulse"
        }`}
      />
      <span className={paused ? "text-orange-400" : "text-green-400"}>
        {paused ? "PAUSED" : "LIVE"}
      </span>
    </span>
  );
}

export function RealTimeFeed() {
  const events = useLiqStore((s) => s.events);
  const isPaused = useLiqStore((s) => s.isPaused);
  const filters = useLiqStore((s) => s.filters);
  const queuedEvents = useLiqStore((s) => s.queuedEvents);
  const togglePaused = useLiqStore((s) => s.togglePaused);
  const flushQueued = useLiqStore((s) => s.flushQueued);

  const filteredEvents = useMemo(() => {
    let result = events;

    if (filters.side !== "both") {
      result = result.filter((e) => e.side === filters.side);
    }
    if (filters.exchanges.length > 0) {
      result = result.filter((e) =>
        filters.exchanges.includes(e.exchange)
      );
    }
    if (filters.symbolSearch) {
      const q = filters.symbolSearch.toUpperCase();
      result = result.filter((e) => e.symbol.includes(q));
    }
    if (filters.minUsd > 0) {
      result = result.filter((e) => e.usdValue >= filters.minUsd);
    }

    return result;
  }, [events, filters]);

  const handleResume = () => {
    flushQueued();
    togglePaused();
  };

  if (events.length === 0 && !isPaused) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-zinc-500">
              Waiting for liquidation events...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <LiveIndicator paused={isPaused} />
          <span className="text-sm text-zinc-500">
            {filteredEvents.length} events
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isPaused && (
            <button
              onClick={handleResume}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded-full bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors"
            >
              <Play className="w-3 h-3" />
              Resume
            </button>
          )}
          {!isPaused && (
            <button
              onClick={togglePaused}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded-full text-zinc-500 hover:bg-zinc-800 transition-colors"
            >
              <Pause className="w-3 h-3" />
              Pause
            </button>
          )}
        </div>
      </div>

      {isPaused && queuedEvents.length > 0 && (
        <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20">
          <p className="text-sm text-yellow-400">
            {queuedEvents.length} new event{queuedEvents.length !== 1 && "s"} queued
          </p>
        </div>
      )}

      <LiqTable data={filteredEvents} showExchange />
    </div>
  );
}
