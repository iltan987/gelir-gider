import type { StateCreator } from "zustand";
import type { Transaction, TransactionType } from "@/types";
import { execute, select } from "@/services/db";
import { isRefundCategory } from "@/lib/categories";
import type { AppState } from "../app-store";

export interface TransactionSlice {
  transactions: Transaction[];
  isLoading: boolean;
  loadTransactionsByDate: (date: string) => Promise<void>;
  addTransaction: (data: {
    date: string;
    type: TransactionType;
    amount: number;
    category: string;
    note: string | null;
  }) => Promise<void>;
  updateTransaction: (
    id: string,
    data: {
      date: string;
      type: TransactionType;
      amount: number;
      category: string;
      note: string | null;
    },
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteAllForDate: (date: string) => Promise<void>;
  deleteAllForDateByType: (
    date: string,
    type: TransactionType,
  ) => Promise<void>;
}

export const createTransactionSlice: StateCreator<
  AppState,
  [],
  [],
  TransactionSlice
> = (set, get) => ({
  transactions: [],
  isLoading: false,

  loadTransactionsByDate: async (date) => {
    set({ isLoading: true });
    const rows = await select<Transaction[]>(
      "SELECT id, date, type, amount, category, note, created_at FROM transactions WHERE date = $1 ORDER BY created_at ASC",
      [date],
    );
    set({ transactions: rows, isLoading: false });
  },

  addTransaction: async (data) => {
    const id = crypto.randomUUID();
    let amount = data.amount;
    if (isRefundCategory(data.category)) {
      amount = -Math.abs(amount);
    }
    await execute(
      "INSERT INTO transactions (id, date, type, amount, category, note, created_at) VALUES ($1, $2, $3, $4, $5, $6, datetime('now'))",
      [id, data.date, data.type, amount, data.category, data.note],
    );
    await get().loadTransactionsByDate(data.date);
  },

  updateTransaction: async (id, data) => {
    let amount = data.amount;
    if (isRefundCategory(data.category)) {
      amount = -Math.abs(amount);
    }
    await execute(
      "UPDATE transactions SET date = $1, type = $2, amount = $3, category = $4, note = $5 WHERE id = $6",
      [data.date, data.type, amount, data.category, data.note, id],
    );
    await get().loadTransactionsByDate(get().selectedDate);
  },

  deleteTransaction: async (id) => {
    await execute("DELETE FROM transactions WHERE id = $1", [id]);
    await get().loadTransactionsByDate(get().selectedDate);
  },

  deleteAllForDate: async (date) => {
    await execute("DELETE FROM transactions WHERE date = $1", [date]);
    await get().loadTransactionsByDate(date);
  },

  deleteAllForDateByType: async (date, type) => {
    await execute("DELETE FROM transactions WHERE date = $1 AND type = $2", [
      date,
      type,
    ]);
    await get().loadTransactionsByDate(date);
  },
});
