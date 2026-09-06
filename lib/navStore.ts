import { create } from "zustand";
import type {
  NavTabId,
  AthAtlSubTab,
  PumpDumpSubTab,
  OverUnderSubTab,
  LiquidationSubTab,
  LiqTimeframe,
  CoinDetailExtra,
} from "@/types/nav";

interface NavState {
  activeNavTab: NavTabId;
  athAtlSubTab: AthAtlSubTab;
  pumpDumpSubTab: PumpDumpSubTab;
  overUnderSubTab: OverUnderSubTab;
  liquidationSubTab: LiquidationSubTab;
  liqTimeframe: LiqTimeframe;
  liqMinPct: number;
  // symbol of the coin for the more-info modal
  modalSymbol: string | null;
  modalExtra: CoinDetailExtra | null;
}

interface NavActions {
  setActiveNavTab: (tab: NavTabId) => void;
  setAthAtlSubTab: (tab: AthAtlSubTab) => void;
  setPumpDumpSubTab: (tab: PumpDumpSubTab) => void;
  setOverUnderSubTab: (tab: OverUnderSubTab) => void;
  setLiquidationSubTab: (tab: LiquidationSubTab) => void;
  setLiqTimeframe: (tf: LiqTimeframe) => void;
  setLiqMinPct: (pct: number) => void;
  openModal: (symbol: string) => void;
  openModalWithExtra: (symbol: string, extra: CoinDetailExtra) => void;
  closeModal: () => void;
}

export const useNavStore = create<NavState & NavActions>()((set) => ({
  activeNavTab: "ath-atl",
  athAtlSubTab: "near-ath",
  pumpDumpSubTab: "pump",
  overUnderSubTab: "overvalued",
  liquidationSubTab: "short",
  liqTimeframe: "1h",
  liqMinPct: 80,
modalSymbol: null,
  modalExtra: null,

  setActiveNavTab: (tab) => set({ activeNavTab: tab, modalSymbol: null }),
  setAthAtlSubTab: (tab) => set({ athAtlSubTab: tab }),
  setPumpDumpSubTab: (tab) => set({ pumpDumpSubTab: tab }),
  setOverUnderSubTab: (tab) => set({ overUnderSubTab: tab }),
  setLiquidationSubTab: (tab) => set({ liquidationSubTab: tab }),
  setLiqTimeframe: (tf) => set({ liqTimeframe: tf }),
  setLiqMinPct: (pct) => set({ liqMinPct: pct }),
  openModal: (symbol) => set({ modalSymbol: symbol, modalExtra: null }),
  openModalWithExtra: (symbol, extra) => set({ modalSymbol: symbol, modalExtra: extra }),
  closeModal: () => set({ modalSymbol: null, modalExtra: null }),
}));