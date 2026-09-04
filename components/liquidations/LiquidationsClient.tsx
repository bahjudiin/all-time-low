"use client";

import useSWR from "swr";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { LiquidationEvent, LiqTab } from "@/types/liquidation";
import { useLiqStore } from "@/lib/liquidationStore";
import { getLiquidationWS } from "@/lib/wsClient";
import { MarketGlance } from "./MarketGlance";
import { LiqFiltersBar } from "./Filters";
import { RealTimeFeed } from "./RealTimeFeed";
import { HistoryTab } from "./HistoryTab";
import { MatrixView } from "./MatrixView";
import { SweepsTab } from "./SweepsTab";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface LiquidationApiResponse {
  events: LiquidationEvent[];
  meta: { binanceCount: number; okxCount: number; queriedAt: string };
}

const TABS: { id: LiqTab; label: string }[] = [
  { id: "realtime", label: "Real-Time" },
  { id: "history", label: "History" },
  { id: "matrix", label: "Matrix" },
  { id: "sweeps", label: "Sweeps" },
];

function WsStatus({ status }: { status: string }) {
  const color =
    status === "open"
      ? "bg-green-500"
      : status === "reconnecting"
        ? "bg-yellow-500 animate-pulse"
        : "bg-zinc-600";
  const label =
    status === "open"
      ? "WS Connected"
      : status === "reconnecting"
        ? "Reconnecting..."
        : status === "connecting"
          ? "Connecting..."
          : "Disconnected";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
      <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

export function LiquidationsClient() {
  const activeTab = useLiqStore((s) => s.activeTab);
  const setActiveTab = useLiqStore((s) => s.setActiveTab);
  const eventCount = useLiqStore((s) => s.events.length);
  const [wsStatus, setWsStatus] = useState("closed");

  const { data: bootstrap } = useSWR<LiquidationApiResponse>(
    "/api/liquidations",
    fetcher,
    {
      refreshInterval: 300_000,
      revalidateOnFocus: true,
    }
  );

  useEffect(() => {
    const ws = getLiquidationWS();
    const unsubEvent = ws.onEvent((event) => {
      useLiqStore.getState().addEvent(event);
    });
    const unsubStatus = ws.onStatus((s) => setWsStatus(s));
    ws.connect();
    return () => {
      unsubEvent();
      unsubStatus();
      ws.disconnect();
    };
  }, []);

  useEffect(() => {
    if (bootstrap?.events && bootstrap.events.length > 0) {
      useLiqStore.getState().addEvents(bootstrap.events);
    }
  }, [bootstrap]);

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <h1 className="text-lg font-semibold">ATH/ATL Tracker</h1>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className="px-3 py-1.5 text-sm font-medium rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Screener
            </Link>
            <Link
              href="/prediction"
              className="px-3 py-1.5 text-sm font-medium rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Pre-Reversal
            </Link>
            <Link
              href="/liquidations"
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white"
            >
              Liquidations
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <WsStatus status={wsStatus} />
          <span className="text-xs text-zinc-500">{eventCount} events</span>
        </div>
      </header>

      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <MarketGlance />
      </div>

      <div className="flex items-center gap-1 px-6 py-2 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <LiqFiltersBar />

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {activeTab === "realtime" && <RealTimeFeed />}
        {activeTab === "history" && <HistoryTab />}
        {activeTab === "matrix" && <MatrixView />}
        {activeTab === "sweeps" && <SweepsTab />}
      </main>
    </div>
  );
}
