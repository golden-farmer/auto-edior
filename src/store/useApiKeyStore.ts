import { create } from 'zustand';

interface ApiKeyStore {
  isApiKeyMissing: boolean;
  isApiKeyInvalid: boolean;
  setApiKeyMissing: (value: boolean) => void;
  setApiKeyInvalid: (value: boolean) => void;
}

export const useApiKeyStore = create<ApiKeyStore>((set) => ({
  isApiKeyMissing: false,
  isApiKeyInvalid: false,
  setApiKeyMissing: (value) => set({ isApiKeyMissing: value }),
  setApiKeyInvalid: (value) => set({ isApiKeyInvalid: value }),
}));
