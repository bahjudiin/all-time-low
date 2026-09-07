import type { IndicatorGroup } from "@/types/signal";

export function GroupStatus({ group }: { group: IndicatorGroup }) {
  const dotColor = group.signal === 1 ? "var(--long)" : group.signal === -1 ? "var(--short)" : "var(--muted)";
  const signalIcon = (s: -1 | 0 | 1) => s === 1 ? "▲" : s === -1 ? "▼" : "—";

  return (
    <div style={{ padding: "6px 0", borderBottom: "1px solid var(--hair)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
        <span className="mono" style={{ fontSize: 9, fontWeight: 600, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.05em", flex: 1 }}>
          {group.name}
        </span>
        {group.agreed && (
          <span className="mono" style={{ fontSize: 8, color: "var(--long)", fontWeight: 500 }}>AGREE</span>
        )}
      </div>
      <div style={{ marginLeft: 14 }}>
        {group.indicators.map((ind) => {
          const indColor = ind.signal === 1 ? "var(--long)" : ind.signal === -1 ? "var(--short)" : "var(--muted2)";
          return (
            <div key={ind.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, padding: "1px 0" }}>
              <span style={{ fontSize: 9, color: "var(--muted2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ind.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <span className="mono" style={{ fontSize: 9, color: indColor }}>{ind.value}</span>
                <span style={{ fontSize: 8, color: indColor }}>{signalIcon(ind.signal)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
