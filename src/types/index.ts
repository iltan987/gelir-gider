export type TransactionType = "revenue" | "expense";

export type View = "daily" | "analysis" | "settings";

export type Theme = "light" | "dark" | "system";

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

export type UpdateStatus =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "upToDate" }
  | {
      status: "available";
      version: string;
      body: string | null;
      date: string | null;
    }
  | { status: "downloading"; version: string; progress: number }
  | { status: "error"; error: string };
