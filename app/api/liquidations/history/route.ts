import { NextRequest, NextResponse } from "next/server";
import { fetchLiquidationEvents } from "@/lib/liquidationHistory";
import type { LiquidationEvent } from "@/types/liquidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const SYMBOL_RE = /^[A-Za-z0-9-]{0,16}$/;

export async function OPTIONS() {
  return NextResponse.json(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const rawSymbol = request.nextUrl.searchParams.get("symbol") ?? "";

  if (rawSymbol && !SYMBOL_RE.test(rawSymbol)) {
    return NextResponse.json(
      { error: "Invalid symbol parameter. Allowed: alphanumeric and hyphens, max 16 chars." },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const symbol = rawSymbol.toUpperCase();

  let events: LiquidationEvent[] = [];
  let fetchFailed = false;
  try {
    events = await fetchLiquidationEvents();
  } catch (error) {
    fetchFailed = true;
    console.error("[liquidations/history] Failed to fetch events:", error);
  }

  const filtered = symbol ? events.filter((e) => e.symbol === symbol) : events;

  return NextResponse.json(
    {
      events: filtered,
      meta: {
        count: filtered.length,
        total: events.length,
        symbol: symbol || null,
        provider: "okx",
        lookupWindowHours: 24,
        queriedAt: new Date().toISOString(),
        ...(fetchFailed ? { partial: true, note: "OKX fetch failed; returning empty results." } : {}),
      },
    },
    {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, s-maxage=20, stale-while-revalidate=100",
      },
    }
  );
}
