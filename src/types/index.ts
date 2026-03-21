export type TransactionType = "revenue" | "expense";

export type View = "daily" | "analysis" | "filter" | "settings";

export type Theme = "light" | "dark";

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string | null;
  created_at: string;
}

export interface DailySummary {
  date: string;
  totalRevenue: number;
  totalExpense: number;
  netResult: number;
  profitPercentage: number | null;
}

export interface PeriodAnalysis {
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalExpense: number;
  netResult: number;
  activeDays: number;
  avgDailyRevenue: number;
  avgDailyExpense: number;
  bestDay: { date: string; net: number };
  worstDay: { date: string; net: number };
  revenueByCategory: Map<string, number>;
  expenseByCategory: Map<string, number>;
  dailyBreakdown: Array<{
    date: string;
    revenue: number;
    expense: number;
    net: number;
  }>;
}

export type FilterOperator =
  | "within_last_days"
  | "more_than_days_ago"
  | "between_dates"
  | "in_range"
  | "category_equals"
  | "category_not_equals"
  | "free_text";

export interface FilterCondition {
  id: string;
  operator: FilterOperator;
  value: string | string[] | number;
  secondaryValue?: string;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value: unknown;
}

export type BackupTier =
  | "session"
  | "daily"
  | "weekly"
  | "monthly"
  | "pre-migration";
