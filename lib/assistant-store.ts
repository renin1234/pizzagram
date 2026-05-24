"use client";

import { create } from "zustand";

// Состояние ИИ-помощника: открыта ли панель чата. Вынесено в стор, чтобы
// открывать панель из других мест страницы (строка-вход в секции меню).

type State = {
  open: boolean;
};

type Actions = {
  setOpen: (open: boolean) => void;
};

export const useAssistant = create<State & Actions>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
