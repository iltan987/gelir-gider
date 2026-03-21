import { useEffect } from "react";
import { useAppStore } from "@/stores/app-store";
import { isRefundCategory } from "@/lib/categories";
import type { TransactionType } from "@/types";

export function useTransactions() {
  const selectedDate = useAppStore((s) => s.selectedDate);
  const transactions = useAppStore((s) => s.transactions);
  const isLoading = useAppStore((s) => s.isLoading);
  const loadTransactionsByDate = useAppStore((s) => s.loadTransactionsByDate);
  const addTransaction = useAppStore((s) => s.addTransaction);
  const updateTransaction = useAppStore((s) => s.updateTransaction);
  const deleteTransaction = useAppStore((s) => s.deleteTransaction);
  const deleteAllForDate = useAppStore((s) => s.deleteAllForDate);
  const deleteAllForDateByType = useAppStore((s) => s.deleteAllForDateByType);

  useEffect(() => {
    loadTransactionsByDate(selectedDate);
  }, [selectedDate, loadTransactionsByDate]);

  async function add(data: {
    type: TransactionType;
    amount: number;
    category: string;
    note: string | null;
  }) {
    let amount = data.amount;
    if (isRefundCategory(data.category)) {
      amount = -Math.abs(amount);
    }
    await addTransaction({
      date: selectedDate,
      type: data.type,
      amount,
      category: data.category,
      note: data.note,
    });
  }

  async function update(
    id: string,
    data: {
      type: TransactionType;
      amount: number;
      category: string;
      note: string | null;
    },
  ) {
    let amount = data.amount;
    if (isRefundCategory(data.category)) {
      amount = -Math.abs(amount);
    }
    await updateTransaction(id, {
      date: selectedDate,
      type: data.type,
      amount,
      category: data.category,
      note: data.note,
    });
  }

  async function remove(id: string) {
    await deleteTransaction(id);
  }

  async function removeAll() {
    await deleteAllForDate(selectedDate);
  }

  async function removeAllByType(type: TransactionType) {
    await deleteAllForDateByType(selectedDate, type);
  }

  return {
    transactions,
    isLoading,
    selectedDate,
    add,
    update,
    remove,
    removeAll,
    removeAllByType,
  };
}
