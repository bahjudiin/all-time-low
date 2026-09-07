"use client";

import { useNavStore } from "@/lib/navStore";
import { NAV_ITEMS } from "@/types/nav";

const ICONS: Record<string, string> = {
  trophy: "M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z",
  zap: "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",
  bar: "M3 3v16a2 2 0 0 0 2 2h16M7 16h8M7 11h12M7 6h3",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  radio: "M4.9 19.1C1 15.2 1 8.8 4.9 4.9M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5M19.1 4.9c3.9 3.9 3.9 10.3 0 14.2",
  settings: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
};

function NavIcon({ d, size = 15 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export function LeftRail() {
  const activeNavTab = useNavStore((s) => s.activeNavTab);
  const setActiveNavTab = useNavStore((s) => s.setActiveNavTab);

  return (
    <aside
      className="rail-panel flex flex-col flex-shrink-0"
      style={{
        width: 200,
        background: "var(--panel)",
        borderRight: "1px solid var(--hair)",
      }}
    >
      {/* Brand */}
      <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid var(--hair)" }}>
        <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: "0.01em" }}>SIGNAL TERMINAL</div>
        <div className="mono" style={{ color: "var(--muted2)", fontSize: 10, marginTop: 2 }}>LIVE · CROSS-DESK</div>
      </div>

      {/* Nav items */}
      <div style={{ padding: 8, flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = activeNavTab === item.id;
          const iconD = ICONS[item.icon] ?? ICONS.settings;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNavTab(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                textAlign: "left",
                background: active ? "var(--panel-raised)" : "none",
                border: "none",
                color: active ? "var(--text)" : "var(--muted)",
                padding: "9px 10px",
                borderRadius: 3,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontSize: 12.5,
                marginBottom: 2,
                boxShadow: active ? "inset 2px 0 0 var(--amber)" : "none",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "var(--panel-raised)";
                  e.currentTarget.style.color = "var(--text)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = "var(--muted)";
                }
              }}
            >
              <span style={{ color: active ? "var(--amber)" : "inherit" }}>
                <NavIcon d={iconD} />
              </span>
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 14px", borderTop: "1px solid var(--hair)", color: "var(--muted2)", fontSize: 10.5, fontFamily: "var(--font-mono)", lineHeight: 1.6 }}>
        SOURCES: BINANCE · BYBIT · OKX<br />
        COINALYZE · ALTERNATIVE.ME<br />
        STATUS: <span style={{ color: "var(--long)" }}>● CONNECTED</span>
      </div>
    </aside>
  );
}
