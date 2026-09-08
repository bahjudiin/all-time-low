import { NextResponse } from "next/server";

export const revalidate = 0;

interface EndpointStatus {
  name: string;
  url: string;
  status: "ok" | "error" | "slow";
  latencyMs: number;
  statusCode?: number;
  error?: string;
}

async function probe(url: string, timeoutMs = 8000): Promise<EndpointStatus> {
  const start = Date.now();
  const name = url.split("/api/")[1]?.split("?")[0] || url;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    const latencyMs = Date.now() - start;
    return {
      name,
      url,
      status: res.ok ? (latencyMs > 5000 ? "slow" : "ok") : "error",
      latencyMs,
      statusCode: res.status,
    };
  } catch (err) {
    return {
      name,
      url,
      status: "error",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function GET() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";

  const endpoints = [
    `${base}/api/coins?currency=usd`,
    `${base}/api/overvalued-undervalued?currency=usd`,
    `${base}/api/liquidations`,
  ];

  const probes = await Promise.all(endpoints.map(probe));

  const uptime = process.uptime();
  const mem = process.memoryUsage();

  return NextResponse.json(
    {
      ok: true,
      timestamp: new Date().toISOString(),
      uptime,
      memory: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      },
      endpoints: probes,
      env: {
        nodeEnv: process.env.NODE_ENV || "unknown",
        nextVersion: process.env.__NEXT_VERSION || "unknown",
        platform: process.platform,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
