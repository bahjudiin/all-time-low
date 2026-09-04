import { NextResponse } from "next/server";
import { fetchBinanceLiquidationHistory } from "@/lib/binance";
import { fetchOKXLiquidationHistory } from "@/lib/okx";
import { normalizeBinanceLiq } from "@/lib/normalize";
import type { BinanceForceOrder } from "@/lib/normalize";
import type { LiquidationEvent } from "@/types/liquidation";

export const revalidate = 0;

const TOP_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT",
  "ADAUSDT", "AVAXUSDT", "DOTUSDT", "LINKUSDT", "MATICUSDT",
  "UNIUSDT", "SUIUSDT", "ARBUSDT", "OPUSDT", "NEARUSDT",
];

export async function GET() {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  const [binanceRaw, okxRaw] = await Promise.all([
    fetchBinanceLiquidationHistory({ startTime: oneHourAgo, limit: 200 }).catch(() => []),
    fetchOKXLiquidationHistory({ state: "filled", limit: 100 }).catch(() => []),
  ]);

  const binanceEvents: LiquidationEvent[] = binanceRaw
    .map((raw) => {
      const mapped: BinanceForceOrder = {
        e: "forceOrder",
        E: raw.time,
        s: raw.symbol,
        o: {
          s: raw.symbol,
          S: raw.side as "BUY" | "SELL",
          o: "LIMIT",
          f: "IOC",
          q: raw.origQty,
          p: raw.price,
          ap: raw.avgPrice,
          X: "FILLED",
          l: raw.executedQty,
          m: false,
          T: raw.time,
        },
      };
      return normalizeBinanceLiq(mapped);
    });

  const okxEvents: LiquidationEvent[] = okxRaw.map((raw) => ({
    id: `okx-${raw.ts}-${raw.instId.split("-")[0]}-${Math.random().toString(36).slice(2, 8)}`,
    ts: parseInt(raw.ts),
    symbol: raw.instId.split("-")[0],
    exchange: "okx" as const,
    side: raw.side === "sell" ? ("long" as const) : ("short" as const),
    qty: parseFloat(raw.bz),
    price: parseFloat(raw.bkPx),
    usdValue: parseFloat(raw.bkPx) * parseFloat(raw.bz),
  }));

  const all = [...binanceEvents, ...okxEvents].sort((a, b) => b.ts - a.ts);

  return NextResponse.json(all.slice(0, 300));
}
