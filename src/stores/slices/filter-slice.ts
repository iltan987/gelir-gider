import type { StateCreator } from "zustand";
import type { Transaction, FilterCondition } from "@/types";
import { select } from "@/services/db";
import type { AppState } from "../app-store";

export interface FilterSlice {
  filterConditions: FilterCondition[];
  searchText: string;
  filteredResults: Transaction[];
  addCondition: (condition: FilterCondition) => void;
  removeCondition: (id: string) => void;
  clearFilters: () => void;
  setSearchText: (text: string) => void;
  executeFilter: () => Promise<void>;
}

export const createFilterSlice: StateCreator<AppState, [], [], FilterSlice> = (
  set,
  get,
) => ({
  filterConditions: [],
  searchText: "",
  filteredResults: [],

  addCondition: (condition) =>
    set((state) => ({
      filterConditions: [...state.filterConditions, condition],
    })),

  removeCondition: (id) =>
    set((state) => ({
      filterConditions: state.filterConditions.filter((c) => c.id !== id),
    })),

  clearFilters: () =>
    set({ filterConditions: [], searchText: "", filteredResults: [] }),

  setSearchText: (text) => set({ searchText: text }),

  executeFilter: async () => {
    const { filterConditions, searchText } = get();
    let query = `SELECT id, date, type, amount, category, note, created_at FROM transactions WHERE 1=1`;
    const params: unknown[] = [];
    let paramIdx = 1;

    for (const condition of filterConditions) {
      switch (condition.operator) {
        case "within_last_days": {
          query += ` AND date >= date('now', '-' || $${paramIdx} || ' days')`;
          params.push(condition.value);
          paramIdx++;
          break;
        }
        case "more_than_days_ago": {
          query += ` AND date < date('now', '-' || $${paramIdx} || ' days')`;
          params.push(condition.value);
          paramIdx++;
          break;
        }
        case "between_dates": {
          query += ` AND date BETWEEN $${paramIdx} AND $${paramIdx + 1}`;
          params.push(condition.value, condition.secondaryValue);
          paramIdx += 2;
          break;
        }
        case "in_range": {
          query += ` AND date BETWEEN $${paramIdx} AND $${paramIdx + 1}`;
          params.push(condition.value, condition.secondaryValue);
          paramIdx += 2;
          break;
        }
        case "category_equals": {
          const cats = condition.value as string[];
          const placeholders = cats.map(() => `$${paramIdx++}`).join(", ");
          query += ` AND category IN (${placeholders})`;
          params.push(...cats);
          break;
        }
        case "category_not_equals": {
          const cats = condition.value as string[];
          const placeholders = cats.map(() => `$${paramIdx++}`).join(", ");
          query += ` AND category NOT IN (${placeholders})`;
          params.push(...cats);
          break;
        }
      }
    }

    if (searchText.trim()) {
      query += ` AND (note LIKE '%' || $${paramIdx} || '%' OR category LIKE '%' || $${paramIdx} || '%')`;
      params.push(searchText.trim());
      paramIdx++;
    }

    query += " ORDER BY date DESC, created_at DESC";

    const rows = await select<Transaction[]>(query, params);
    set({ filteredResults: rows });
  },
});
