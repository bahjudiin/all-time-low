import type { LiquidationEvent } from "@/types/liquidation";

type Status = "connecting" | "open" | "closed" | "reconnecting";
type EventCb = (event: LiquidationEvent) => void;
type StatusCb = (status: Status) => void;

const URL = "wss://fstream.binance.com/ws/!forceOrder@arr";
const INITIAL_DELAY = 1000;
const MAX_DELAY = 30000;
const BACKOFF_FACTOR = 2;

export class LiquidationWS {
  private ws: WebSocket | null = null;
  private status: Status = "closed";
  private eventCbs: EventCb[] = [];
  private statusCbs: StatusCb[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private delay = INITIAL_DELAY;
  private shouldReconnect = true;
  private idCounter = 0;

  connect(): void {
    if (this.ws) return;
    this.setStatus("connecting");
    this.ws = new WebSocket(URL);

    this.ws.onopen = () => {
      this.delay = INITIAL_DELAY;
      this.setStatus("open");
    };

    this.ws.onclose = () => {
      this.ws = null;
      if (this.shouldReconnect) {
        this.setStatus("reconnecting");
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null;
          this.connect();
        }, this.delay);
        this.delay = Math.min(this.delay * BACKOFF_FACTOR, MAX_DELAY);
      } else {
        this.setStatus("closed");
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };

    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(String(ev.data));
        if (msg.e === "forceOrder") {
          this.handleForceOrder(msg);
        }
      } catch {
        // malformed frame, ignore
      }
    };
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus("closed");
  }

  onEvent(cb: EventCb): () => void {
    this.eventCbs.push(cb);
    return () => {
      this.eventCbs = this.eventCbs.filter((f) => f !== cb);
    };
  }

  onStatus(cb: StatusCb): () => void {
    this.statusCbs.push(cb);
    return () => {
      this.statusCbs = this.statusCbs.filter((f) => f !== cb);
    };
  }

  getStatus(): Status {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === "open";
  }

  private setStatus(s: Status): void {
    this.status = s;
    for (const cb of this.statusCbs) cb(s);
  }

  private handleForceOrder(raw: {
    E: number;
    o: { s: string; S: string; q: string; p: string };
  }): void {
    const { E, o } = raw;
    const side: "long" | "short" = o.S === "SELL" ? "long" : "short";
    const symbol = o.s.replace(/USDT$|BUSD$/i, "");
    const price = parseFloat(o.p);
    const qty = parseFloat(o.q);
    const usdValue = price * qty;

    const event: LiquidationEvent = {
      id: `binance-${E}-${symbol}-${++this.idCounter}`,
      ts: E,
      symbol,
      exchange: "binance",
      side,
      qty,
      price,
      usdValue,
    };

    for (const cb of this.eventCbs) cb(event);
  }
}

let defaultInstance: LiquidationWS | null = null;

export function getLiquidationWS(): LiquidationWS {
  if (!defaultInstance) defaultInstance = new LiquidationWS();
  return defaultInstance;
}
