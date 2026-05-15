import { create } from 'zustand';

interface QuotaStore {
  isQuotaExceeded: boolean;
  setQuotaExceeded: (value: boolean) => void;
}

export const useQuotaStore = create<QuotaStore>((set) => ({
  isQuotaExceeded: false,
  setQuotaExceeded: (value) => set({ isQuotaExceeded: value }),
}));
