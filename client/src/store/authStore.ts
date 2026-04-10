import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  _id: string;
  walletAddress: string;
  username: string;
  bio?: string;
  role: string;
  skills: string[];
  reputation: number;
  completedContracts: number;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  updateUser: (u: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
      updateUser: (updates) =>
        set((s) => ({ user: s.user ? { ...s.user, ...updates } : null })),
    }),
    { name: "trustpay-auth" }
  )
);