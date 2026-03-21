import { create } from "zustand";
import { createUiSlice, type UiSlice } from "./slices/ui-slice";
import {
  createTransactionSlice,
  type TransactionSlice,
} from "./slices/transaction-slice";

export type AppState = UiSlice & TransactionSlice;

export const useAppStore = create<AppState>()((...a) => ({
  ...createUiSlice(...a),
  ...createTransactionSlice(...a),
}));
