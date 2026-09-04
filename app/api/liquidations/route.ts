import { NextResponse } from "next/server";
import type { LiquidationEvent } from "@/types/liquidation";

export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    events: [] as LiquidationEvent[],
    meta: {
      binanceCount: 0,
      okxCount: 0,
      note: "REST liquidation history endpoints are geo-blocked. Real-time data comes from WebSocket.",
      queriedAt: new Date().toISOString(),
    },
  });
}
