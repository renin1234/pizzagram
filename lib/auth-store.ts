"use client";

import { create } from "zustand";

export type AuthUser = {
  id: string;
  phone: string;
  name?: string | null;
  address?: string | null;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
};

type AuthActions = {
  setUser: (user: AuthUser | null) => void;
  setLoading: (v: boolean) => void;
  logout: () => Promise<void>;
};

export const useAuth = create<AuthState & AuthActions>()((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    set({ user: null });
  },
}));
