import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  showCurl: boolean;
  showLatencyHud: boolean;
  reducedMotion: boolean;
  setShowCurl: (v: boolean) => void;
  setShowLatencyHud: (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      showCurl: false,
      showLatencyHud: false,
      reducedMotion: false,
      setShowCurl: (v) => set({ showCurl: v }),
      setShowLatencyHud: (v) => set({ showLatencyHud: v }),
      setReducedMotion: (v) => set({ reducedMotion: v })
    }),
    { name: 'app-store' }
  )
);


