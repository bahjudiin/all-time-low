"use client";

import useSWR from "swr";
import { useEffect } from "react";
import type { LiquidationEvent, LiqTab } from "@/types/liquidation";
import { useLiqStore } from "@/lib/liquidationStore";
import { getLiquidationWS } from "@/lib/wsClient";
import { LiqTable } from "./LiqTable";
import { LiqFiltersBar } from "./Filters";
import { MarketGlance } from "@/components/screener/MarketGlance";
import { HistoryTab } from "./HistoryTab";
import { MatrixView } from "./MatrixView";
import { SweepsTab } from "./SweepsTab";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const TABS: { id: LiqTab; label: string }[] = [
  { id: "realtime", label: "Real-Time" },
  { id: "history", label: "History" },
  { id: "matrix", label: "Matrix" },
  { id: "sweeps", label: "Sweeps" },
];

export function LiquidationsClient() {
  const activeTab = useLiqStore((s) => s.activeTab);
  const setActiveTab = useLiqStore((s) => s.setActiveTab);
  const events = useLiqStore((s) => s.events);

  const { data: bootstrap } = useSWR<LiquidationEvent[]>(
    "/api/liquidations",
    fetcher,
    {
      refreshInterval: 300_000,
      revalidateOnFocus: true,
    }
  );

  useEffect(() => {
    const ws = getLiquidationWS();
    const unsub = ws.onEvent((event) => {
      useLiqStore.getState().addEvent(event);
    });
    ws.connect();
    return () => {
      unsub();
      ws.disconnect();
    };
  }, []);

  useEffect(() => {
    if (bootstrap && bootstrap.length > 0) {
      useLiqStore.getState().addEvents(bootstrap);
    }
  }, [bootstrap]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-lg font-semibold">Liquidation Intelligence</h1>
      </div>

      <MarketGlance />

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
        {activeTab === "realtime" && <LiqTable data={events} />}
        {activeTab === "history" && <HistoryTab />}
        {activeTab === "matrix" && <MatrixView />}
        {activeTab === "sweeps" && <SweepsTab />}
      </main>
    </div>
  );
}
