import { NextResponse } from "next/server";
import { fetchLiquidationEvents } from "@/lib/liquidationHistory";
import type { LiquidationEvent } from "@/types/liquidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  let events: LiquidationEvent[] = [];
  try {
    events = await fetchLiquidationEvents();
  } catch (error) {
    console.error("[liquidations] Failed to fetch events:", error);
    return NextResponse.json(
      { error: "Failed to fetch liquidation events", details: "upstream fetch failed" },
      { status: 502, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(
    {
      events,
      meta: {
        count: events.length,
        provider: "okx",
        note: "Filled liquidation history from OKX (public REST).",
        queriedAt: new Date().toISOString(),
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
