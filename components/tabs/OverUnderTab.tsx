"use client";

import { useNavStore } from "@/lib/navStore";
import { OvervaluedUndervaluedClient } from "@/components/overvalued/OvervaluedUndervaluedClient";
import { SignalsListView } from "@/components/signals/SignalsListView";
import { SubTabBar } from "@/components/layout/SubTabBar";
import type { OverUnderSubTab } from "@/types/nav";
import type { OvervaluedUndervaluedResult } from "@/lib/overvaluedUndervalued";

export function OverUnderTab() {
  const subTab = useNavStore((s) => s.overUnderSubTab);
  const setSubTab = useNavStore((s) => s.setOverUnderSubTab);
  const openModalWithExtra = useNavStore((s) => s.openModalWithExtra);

  const filterMap: Record<Exclude<OverUnderSubTab, "signals">,
    "overvalued" | "undervalued" | "extreme" | "entry-near" | "high-conf"> = {
    overvalued: "overvalued",
    undervalued: "undervalued",
    extreme: "extreme",
    "entry-near": "entry-near",
    "high-conf": "high-conf",
  };

  const handleSelect = (symbol: string, result: OvervaluedUndervaluedResult) => {
    openModalWithExtra(symbol, { overvalued: result });
  };

  return (
    <>
      <SubTabBar
        tabs={[
          { id: "overvalued", label: "Overvalued" },
          { id: "undervalued", label: "Undervalued" },
          { id: "extreme", label: "Extreme" },
          { id: "entry-near", label: "Entry Near" },
          { id: "high-conf", label: "High Conf" },
          { id: "signals", label: "Signals" },
        ]}
        active={subTab}
        onChange={setSubTab}
      />
      <div className="flex-1 min-h-0 overflow-hidden">
        {subTab === "signals" ? (
          <SignalsListView />
        ) : (
          <OvervaluedUndervaluedClient
            controlledFilter={filterMap[subTab]}
            onSelect={handleSelect}
          />
        )}
      </div>
    </>
  );
}