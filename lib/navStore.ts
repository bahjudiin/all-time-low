import { create } from "zustand";
import type {
  NavTabId,
  AthAtlSubTab,
  OverUnderSubTab,
  CoinDetailExtra,
} from "@/types/nav";

interface NavState {
  activeNavTab: NavTabId;
  athAtlSubTab: AthAtlSubTab;
  overUnderSubTab: OverUnderSubTab;
  modalSymbol: string | null;
  modalExtra: CoinDetailExtra | null;
}

interface NavActions {
  setActiveNavTab: (tab: NavTabId) => void;
  setAthAtlSubTab: (tab: AthAtlSubTab) => void;
  setOverUnderSubTab: (tab: OverUnderSubTab) => void;
  openModal: (symbol: string) => void;
  openModalWithExtra: (symbol: string, extra: CoinDetailExtra) => void;
  closeModal: () => void;
}

export const useNavStore = create<NavState & NavActions>()((set) => ({
  activeNavTab: "ath-atl",
  athAtlSubTab: "near-ath",
  overUnderSubTab: "overvalued",
  modalSymbol: null,
  modalExtra: null,

  setActiveNavTab: (tab) => set({ activeNavTab: tab, modalSymbol: null }),
  setAthAtlSubTab: (tab) => set({ athAtlSubTab: tab }),
  setOverUnderSubTab: (tab) => set({ overUnderSubTab: tab }),
  openModal: (symbol) => set({ modalSymbol: symbol, modalExtra: null }),
  openModalWithExtra: (symbol, extra) => set({ modalSymbol: symbol, modalExtra: extra }),
  closeModal: () => set({ modalSymbol: null, modalExtra: null }),
}));
