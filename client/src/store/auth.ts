import { create } from "zustand";
import type { User } from "../types";

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  updateUser: (user: Partial<User>) => void;
  clearAuth: () => void;
  isAuthenticated: boolean;
}

const savedToken = localStorage.getItem("earn_token");
const savedUser = localStorage.getItem("earn_user");

export const useAuthStore = create<AuthState>((set, get) => ({
  token: savedToken,
  user: savedUser ? JSON.parse(savedUser) : null,
  isAuthenticated: !!savedToken,

  setAuth: (token, user) => {
    localStorage.setItem("earn_token", token);
    localStorage.setItem("earn_user", JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  updateUser: (partial) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...partial };
    localStorage.setItem("earn_user", JSON.stringify(updated));
    set({ user: updated });
  },

  clearAuth: () => {
    localStorage.removeItem("earn_token");
    localStorage.removeItem("earn_user");
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
