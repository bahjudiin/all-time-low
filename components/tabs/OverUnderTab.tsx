"use client";

import { useNavStore } from "@/lib/navStore";
import { OvervaluedUndervaluedClient } from "@/components/overvalued/OvervaluedUndervaluedClient";
import { SignalsListView } from "@/components/signals/SignalsListView";
import type { OverUnderSubTab } from "@/types/nav";
import type { OvervaluedUndervaluedResult } from "@/lib/overvaluedUndervalued";
function SubTabBarImpl<T extends string>({ tabs, active, onChange }: { tabs: { id: T; label: string }[]; active: T; onChange: (id: T) => void }) {
  return (
    <div style={{ display: "flex", gap: 4, padding: "0 16px", marginBottom: 8 }}>
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} className="mono" style={{ padding: "4px 12px", fontSize: 11, fontWeight: 600, border: "none", borderRadius: 2, background: active === t.id ? "var(--amber)" : "none", color: active === t.id ? "var(--ink)" : "var(--muted2)", cursor: "pointer" }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

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
      <div className="desk-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16M7 16h8M7 11h12M7 6h3"/></svg>
          <h1 style={{ fontSize: 17, margin: 0, fontWeight: 600 }}>Over / Under</h1>
        </div>
      </div>

      <SubTabBarImpl<OverUnderSubTab>
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

      <div className="flex-1" style={{ minHeight: 0, overflow: "hidden" }}>
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
