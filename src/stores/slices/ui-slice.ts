import { format } from "date-fns";
import type { StateCreator } from "zustand";
import type { View, Theme } from "@/types";
import type { AppState } from "../app-store";

export interface UiSlice {
  activeView: View;
  selectedDate: string;
  theme: Theme;
  setView: (view: View) => void;
  setSelectedDate: (date: string) => void;
  goToToday: () => void;
  setTheme: (theme: Theme) => void;
}

export const createUiSlice: StateCreator<AppState, [], [], UiSlice> = (
  set,
) => ({
  activeView: "daily",
  selectedDate: format(new Date(), "yyyy-MM-dd"),
  theme: "light",
  setView: (view) => set({ activeView: view }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  goToToday: () => set({ selectedDate: format(new Date(), "yyyy-MM-dd") }),
  setTheme: (theme) => set({ theme }),
});
