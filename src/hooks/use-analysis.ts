import { useState, useEffect, useMemo, useCallback } from "react";
import { format, startOfMonth } from "date-fns";
import { select } from "@/services/db";
import { calculatePeriodAnalysis } from "@/lib/calculations";
import type { Transaction, PeriodAnalysis } from "@/types";

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}

function currentMonthRange(): DateRange {
  const now = new Date();
  return {
    start: format(startOfMonth(now), "yyyy-MM-dd"),
    end: format(now, "yyyy-MM-dd"),
  };
}

export function useAnalysis() {
  const [dateRange, setDateRange] = useState<DateRange>(currentMonthRange);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [noteFilter, setNoteFilter] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    select<Transaction[]>(
      "SELECT id, date, type, amount, category, note, created_at FROM transactions WHERE date >= $1 AND date <= $2 ORDER BY date ASC, created_at ASC",
      [dateRange.start, dateRange.end],
    ).then((rows) => {
      if (!cancelled) {
        setTransactions(rows);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dateRange.start, dateRange.end]);

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (categoryFilter) {
      result = result.filter((t) => t.category === categoryFilter);
    }
    if (noteFilter) {
      const lower = noteFilter.toLowerCase();
      result = result.filter(
        (t) => t.note && t.note.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [transactions, categoryFilter, noteFilter]);

  const analysis: PeriodAnalysis = useMemo(
    () =>
      calculatePeriodAnalysis(
        dateRange.start,
        dateRange.end,
        filteredTransactions,
      ),
    [dateRange.start, dateRange.end, filteredTransactions],
  );

  const updateDateRange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  const updateCategoryFilter = useCallback((filter: string | null) => {
    setCategoryFilter(filter);
  }, []);

  const updateNoteFilter = useCallback((filter: string) => {
    setNoteFilter(filter);
  }, []);

  return {
    isLoading,
    transactions: filteredTransactions,
    analysis,
    dateRange,
    categoryFilter,
    noteFilter,
    setDateRange: updateDateRange,
    setCategoryFilter: updateCategoryFilter,
    setNoteFilter: updateNoteFilter,
  };
}
