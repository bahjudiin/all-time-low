import { NextRequest, NextResponse } from "next/server";
import { fetchLiquidationEvents } from "@/lib/liquidationHistory";
import type { LiquidationEvent } from "@/types/liquidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rawSymbol = request.nextUrl.searchParams.get("symbol") ?? "";
  const symbol = rawSymbol.toUpperCase();

  let events: LiquidationEvent[] = [];
  try {
    events = await fetchLiquidationEvents();
  } catch {
    // Serve whatever we have (possibly empty) rather than failing the whole tab.
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
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=20, stale-while-revalidate=120",
      },
    }
  );
}