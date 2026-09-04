import { create } from "zustand";
import type {
  LiquidationEvent,
  LiqTab,
  HistoryTimeframe,
  LiqFilters,
} from "@/types/liquidation";
import { EVENT_BUFFER_CAP } from "@/types/liquidation";

const defaultFilters: LiqFilters = {
  side: "both",
  exchanges: [],
  symbolSearch: "",
  minUsd: 0,
};

interface LiquidationState {
  events: LiquidationEvent[];
  glanceWindow: number;
  activeTab: LiqTab;
  historyTimeframe: HistoryTimeframe;
  isPaused: boolean;
  filters: LiqFilters;
  queuedEvents: LiquidationEvent[];
}

interface LiquidationActions {
  addEvent: (event: LiquidationEvent) => void;
  addEvents: (events: LiquidationEvent[]) => void;
  setGlanceWindow: (ms: number) => void;
  setActiveTab: (tab: LiqTab) => void;
  setHistoryTimeframe: (tf: HistoryTimeframe) => void;
  togglePaused: () => void;
  setFilters: (filters: Partial<LiqFilters>) => void;
  flushQueued: () => void;
}

export const useLiqStore = create<LiquidationState & LiquidationActions>()(
  (set) => ({
    events: [],
    glanceWindow: 60 * 60 * 1000,
    activeTab: "realtime",
    historyTimeframe: "1h",
    isPaused: false,
    filters: defaultFilters,
    queuedEvents: [],

    addEvent: (event) =>
      set((s) => {
        if (s.isPaused) {
          const q = s.queuedEvents.length < 200 ? [...s.queuedEvents, event] : s.queuedEvents;
          return { queuedEvents: q };
        }
        const next = [event, ...s.events];
        if (next.length > EVENT_BUFFER_CAP) next.length = EVENT_BUFFER_CAP;
        return { events: next };
      }),

    addEvents: (events) =>
      set((s) => {
        if (s.isPaused) {
          const combined = [...s.queuedEvents, ...events];
          return { queuedEvents: combined.slice(-200) };
        }
        const next = [...events, ...s.events];
        if (next.length > EVENT_BUFFER_CAP) next.length = EVENT_BUFFER_CAP;
        return { events: next };
      }),

    setGlanceWindow: (ms) => set({ glanceWindow: ms }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setHistoryTimeframe: (tf) => set({ historyTimeframe: tf }),

    togglePaused: () =>
      set((s) => {
        if (s.isPaused) {
          const merged = [...s.queuedEvents, ...s.events];
          if (merged.length > EVENT_BUFFER_CAP) merged.length = EVENT_BUFFER_CAP;
          return { isPaused: false, events: merged, queuedEvents: [] };
        }
        return { isPaused: true, queuedEvents: [] };
      }),

    setFilters: (filters) =>
      set((s) => ({ filters: { ...s.filters, ...filters } })),

    flushQueued: () =>
      set((s) => {
        if (s.queuedEvents.length === 0) return s;
        const merged = [...s.queuedEvents, ...s.events];
        if (merged.length > EVENT_BUFFER_CAP) merged.length = EVENT_BUFFER_CAP;
        return { events: merged, queuedEvents: [] };
      }),
  })
);
