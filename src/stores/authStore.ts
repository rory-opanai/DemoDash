import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  byokToken: string;
  model: string;
  setByokToken: (token: string) => void;
  setModel: (model: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      byokToken: '',
      model: 'gpt-5',
      setByokToken: (token) => set({ byokToken: token }),
      setModel: (model) => set({ model })
    }),
    { name: 'auth-store' }
  )
);


