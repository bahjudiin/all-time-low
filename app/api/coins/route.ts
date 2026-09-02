import { NextRequest, NextResponse } from "next/server";
import { fetchCoinsMarkets } from "@/lib/coingecko";

export const revalidate = 60;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const currency = searchParams.get("currency") || "usd";

  try {
    const data = await fetchCoinsMarkets(currency, 100, 1);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch coin data", details: message },
      { status: 502 }
    );
  }
}
