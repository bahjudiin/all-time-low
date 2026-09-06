import { COINGECKO_TO_OKX } from "@/lib/okx";
import { cachedGet } from "@/lib/cache";
import type { LiquidationEvent } from "@/types/liquidation";

const BASE_URL = "https://www.okx.com";
const TIMEOUT_MS = 12_000;
const CONCURRENCY = 12;

// How long the server-side history snapshot stays cached.
export const LIQ_HISTORY_TTL_MS = 20_000;

interface OKXLiqDetail {
  bkPx: string;
  sz: string;
  posSide?: string;
  side?: string;
  ts: string;
}

interface OKXLiqBatch {
  instId: string;
  instFamily?: string;
  details?: OKXLiqDetail[];
}

/** BTC-USDT-SWAP -> BTC-USDT */
export function toFamily(instId: string): string {
  const m = instId.match(/^([A-Z0-9-]+)-SWAP$/);
  return m ? m[1] : instId;
}

/** BTC-USDT-SWAP -> BTC */
export function symbolFromInstId(instId: string): string {
  return instId.split("-")[0];
}

function sideFromDetail(d: OKXLiqDetail): "long" | "short" | null {
  if (d.posSide === "long" || d.posSide === "short") return d.posSide;
  // Fallback: taker side "buy" covers a liquidated short, "sell" a liquidated long.
  if (d.side === "buy") return "short";
  if (d.side === "sell") return "long";
  return null;
}

async function fetchFamily(instId: string, signal?: AbortSignal): Promise<LiquidationEvent[]> {
  const family = toFamily(instId);
  const url = `${BASE_URL}/api/v5/public/liquidation-orders?instType=SWAP&uly=${encodeURIComponent(family)}&state=filled&limit=100`;
  const response = await fetch(url, { signal });
  if (!response.ok) return [];
  const json = (await response.json()) as { code?: string; data?: OKXLiqBatch[] };
  if (json.code !== "0" || !Array.isArray(json.data)) return [];

  const events: LiquidationEvent[] = [];
  for (const batch of json.data) {
    const symbol = symbolFromInstId(batch.instId);
    for (const d of batch.details ?? []) {
      const side = sideFromDetail(d);
      if (!side) continue;
      const ts = parseInt(d.ts, 10);
      const qty = parseFloat(d.sz);
      const price = parseFloat(d.bkPx);
      if (!isFinite(ts) || !isFinite(qty) || !isFinite(price) || qty <= 0) continue;
      events.push({
        id: `${batch.instId}-${ts}-${price}-${qty}`,
        ts,
        symbol,
        exchange: "okx",
        side,
        qty,
        price,
        usdValue: Math.round(price * qty * 100) / 100,
      });
    }
  }
  return events;
}

async function runPool<T>(items: string[], concurrency: number, worker: (item: string, signal: AbortSignal) => Promise<T[]>): Promise<T[]> {
  const out: T[] = [];
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency);
      const results = await Promise.allSettled(batch.map((item) => worker(item, controller.signal)));
      for (const r of results) if (r.status === "fulfilled") out.push(...r.value);
    }
    return out;
  } finally {
    clearTimeout(timeoutId);
    controller.abort();
  }
}

/** Latest filled liquidation orders for every mapped OKX perpetual, cached with TTL. */
export async function fetchLiquidationEvents(): Promise<LiquidationEvent[]> {
  return cachedGet("okx-liquidation-history", LIQ_HISTORY_TTL_MS, async () => {
    const instIds = Object.values(COINGECKO_TO_OKX);
    const events = await runPool(instIds, CONCURRENCY, fetchFamily);
    events.sort((a, b) => b.ts - a.ts);
    return events;
  });
}