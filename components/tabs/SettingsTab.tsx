"use client";

import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface StatusResponse {
  ok: boolean;
  timestamp: string;
  uptime: number;
  memory: { rss: number; heapUsed: number; heapTotal: number };
  endpoints: { name: string; url: string; status: "ok" | "error" | "slow"; latencyMs: number; statusCode?: number; error?: string }[];
  env: { nodeEnv: string; nextVersion: string; platform: string };
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function StatusDot({ status }: { status: "ok" | "error" | "slow" }) {
  const color = status === "ok" ? "var(--long)" : status === "slow" ? "var(--amber)" : "var(--short)";
  const glow = status === "ok" ? "rgba(14,203,129,.6)" : status === "slow" ? "rgba(252,213,53,.5)" : "rgba(246,70,93,.6)";
  return (
    <span
      style={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 6px ${glow}`,
        flexShrink: 0,
      }}
    />
  );
}

export function SettingsTab() {
  const { data, isLoading, error, mutate } = useSWR<StatusResponse>("/api/status", fetcher, {
    refreshInterval: 15_000,
    revalidateOnFocus: true,
  });

  const [clearingCache, setClearingCache] = useState(false);

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      await mutate();
    } finally {
      setClearingCache(false);
    }
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <h1 style={{ fontSize: 17, margin: 0, fontWeight: 600 }}>Settings</h1>
        </div>
        <button
          onClick={handleClearCache}
          disabled={clearingCache}
          className="mono"
          style={{
            padding: "5px 14px",
            fontSize: 11,
            fontWeight: 600,
            border: "1px solid var(--amber)",
            borderRadius: 2,
            background: clearingCache ? "var(--panel-raised)" : "var(--amber)",
            color: clearingCache ? "var(--muted)" : "var(--ink)",
            cursor: clearingCache ? "wait" : "pointer",
          }}
        >
          {clearingCache ? "Refreshing..." : "Refresh Status"}
        </button>
      </div>

      {isLoading && !data && (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <div style={{ width: 20, height: 20, border: "2px solid var(--amber)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        </div>
      )}

      {error && (
        <div className="panel-box" style={{ padding: 16, borderColor: "rgba(246,70,93,0.3)" }}>
          <div style={{ color: "var(--short)", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Failed to fetch status</div>
          <div style={{ color: "var(--muted2)", fontSize: 11 }}>{error.message || "Network error"}</div>
        </div>
      )}

      {data && (
        <>
          {/* Server Info */}
          <div className="breadth-row">
            <div className="breadth-cell">
              <div className="lbl">STATUS</div>
              <div className="val" style={{ color: data.ok ? "var(--long)" : "var(--short)" }}>
                {data.ok ? "OPERATIONAL" : "ERROR"}
              </div>
            </div>
            <div className="breadth-cell">
              <div className="lbl">UPTIME</div>
              <div className="val">{formatUptime(data.uptime)}</div>
            </div>
            <div className="breadth-cell">
              <div className="lbl">HEAP USED</div>
              <div className="val">{data.memory.heapUsed} MB</div>
            </div>
            <div className="breadth-cell">
              <div className="lbl">RSS</div>
              <div className="val">{data.memory.rss} MB</div>
            </div>
          </div>

          {/* Environment */}
          <div className="panel-box">
            <div className="ph">Environment</div>
            <div className="planline"><span className="k">Node.js</span><span>{data.env.nodeEnv}</span></div>
            <div className="planline"><span className="k">Next.js</span><span>{data.env.nextVersion}</span></div>
            <div className="planline"><span className="k">Platform</span><span>{data.env.platform}</span></div>
            <div className="planline"><span className="k">Timestamp</span><span className="mono">{new Date(data.timestamp).toLocaleString()}</span></div>
          </div>

          {/* API Endpoints */}
          <div className="panel-box">
            <div className="ph">
              API Endpoints
              <span className="n">{data.endpoints.length} checked</span>
            </div>
            {data.endpoints.map((ep) => (
              <div key={ep.url} className="planline" style={{ alignItems: "center", gap: 8 }}>
                <StatusDot status={ep.status} />
                <span className="k" style={{ minWidth: 80 }}>/api/{ep.name}</span>
                <span className="mono" style={{ fontSize: 11, color: ep.status === "ok" ? "var(--long)" : ep.status === "slow" ? "var(--amber)" : "var(--short)" }}>
                  {ep.status === "ok" ? "200" : ep.statusCode ?? "ERR"}
                </span>
                <span className="mono" style={{ fontSize: 11, color: "var(--muted2)", marginLeft: "auto" }}>
                  {ep.latencyMs}ms
                </span>
                {ep.error && (
                  <span style={{ fontSize: 10, color: "var(--short)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ep.error}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="panel-box">
            <div className="ph">Quick Actions</div>
            <div style={{ padding: "10px 14px", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <ActionBtn label="Open CoinGecko" href="https://www.coingecko.com" />
              <ActionBtn label="Open Binance" href="https://www.binance.com/en/futures" />
              <ActionBtn label="Open OKX" href="https://www.okx.com" />
              <ActionBtn label="Vercel Dashboard" href="https://vercel.com/dashboard" />
            </div>
          </div>

          {/* Deploy */}
          <div className="panel-box">
            <div className="ph">Deploy</div>
            <div className="planline"><span className="k">Build</span><span className="mono" style={{ fontSize: 11 }}>npm run build</span></div>
            <div className="planline"><span className="k">Dev</span><span className="mono" style={{ fontSize: 11 }}>npm run dev</span></div>
            <div className="planline"><span className="k">Lint</span><span className="mono" style={{ fontSize: 11 }}>npm run lint</span></div>
            <div className="planline"><span className="k">Start</span><span className="mono" style={{ fontSize: 11 }}>npm run start</span></div>
          </div>
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

function ActionBtn({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mono"
      style={{
        display: "inline-block",
        padding: "5px 12px",
        fontSize: 11,
        fontWeight: 500,
        border: "1px solid var(--hair)",
        borderRadius: 2,
        background: "var(--panel-raised)",
        color: "var(--muted)",
        textDecoration: "none",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--amber)";
        e.currentTarget.style.color = "var(--text)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--hair)";
        e.currentTarget.style.color = "var(--muted)";
      }}
    >
      {label}
    </a>
  );
}
