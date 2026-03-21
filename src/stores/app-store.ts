import { create } from "zustand";
import { createUiSlice, type UiSlice } from "./slices/ui-slice";
import {
  createTransactionSlice,
  type TransactionSlice,
} from "./slices/transaction-slice";
import { createFilterSlice, type FilterSlice } from "./slices/filter-slice";

export type AppState = UiSlice & TransactionSlice & FilterSlice;

export const useAppStore = create<AppState>()((...a) => ({
  ...createUiSlice(...a),
  ...createTransactionSlice(...a),
  ...createFilterSlice(...a),
}));
