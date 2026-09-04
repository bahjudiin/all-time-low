import { NextResponse } from "next/server";
import { fetchBinanceLiquidationHistory, type BinanceForceOrderItem } from "@/lib/binance";
import { fetchOKXLiquidationHistory, type OKXLiquidationItem } from "@/lib/okx";
import type { LiquidationEvent } from "@/types/liquidation";

export const revalidate = 0;

const TOP_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT",
  "ADAUSDT", "AVAXUSDT", "DOTUSDT", "LINKUSDT", "MATICUSDT",
];

export async function GET() {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  const binanceEvents: LiquidationEvent[] = [];
  const okxEvents: LiquidationEvent[] = [];

  const binanceResults = await Promise.allSettled(
    TOP_SYMBOLS.map((symbol) =>
      fetchBinanceLiquidationHistory({ symbol, startTime: oneHourAgo, limit: 100 })
    )
  );

  for (const result of binanceResults) {
    if (result.status === "fulfilled" && result.value.length > 0) {
      for (const raw of result.value) {
        binanceEvents.push({
          id: `binance-${raw.time}-${raw.symbol}-${Math.random().toString(36).slice(2, 8)}`,
          ts: raw.time,
          symbol: raw.symbol.replace("USDT", ""),
          exchange: "binance",
          side: raw.side === "SELL" ? "long" : "short",
          qty: parseFloat(raw.executedQty),
          price: parseFloat(raw.avgPrice),
          usdValue: parseFloat(raw.avgPrice) * parseFloat(raw.executedQty),
        });
      }
    }
  }

  try {
    const okxRaw = await fetchOKXLiquidationHistory({ state: "filled", limit: 100 });
    for (const raw of okxRaw) {
      const symbol = raw.instId.split("-")[0];
      const price = parseFloat(raw.bkPx);
      const qty = parseFloat(raw.bz);
      okxEvents.push({
        id: `okx-${raw.ts}-${symbol}-${Math.random().toString(36).slice(2, 8)}`,
        ts: parseInt(raw.ts),
        symbol,
        exchange: "okx",
        side: raw.side === "sell" ? "long" : "short",
        qty,
        price,
        usdValue: price * qty,
      });
    }
  } catch {
    // OKX fetch failed, continue with Binance data
  }

  const all = [...binanceEvents, ...okxEvents].sort((a, b) => b.ts - a.ts);

  return NextResponse.json({
    events: all.slice(0, 300),
    meta: {
      binanceCount: binanceEvents.length,
      okxCount: okxEvents.length,
      queriedAt: new Date().toISOString(),
    },
  });
}
