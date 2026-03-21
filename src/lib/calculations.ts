import type { Transaction, DailySummary, PeriodAnalysis } from "@/types";

export function calculateDailySummary(
  date: string,
  transactions: Transaction[],
): DailySummary {
  let totalRevenue = 0;
  let totalExpense = 0;

  for (const t of transactions) {
    if (t.type === "revenue") {
      totalRevenue += t.amount;
    } else {
      totalExpense += t.amount;
    }
  }

  const netResult = totalRevenue - totalExpense;
  const profitPercentage =
    totalRevenue > 0 ? (netResult / totalRevenue) * 100 : null;

  return { date, totalRevenue, totalExpense, netResult, profitPercentage };
}

export function calculatePeriodAnalysis(
  startDate: string,
  endDate: string,
  transactions: Transaction[],
): PeriodAnalysis {
  const dailyMap = new Map<string, { revenue: number; expense: number }>();
  const revenueByCategory = new Map<string, number>();
  const expenseByCategory = new Map<string, number>();

  for (const t of transactions) {
    const day = dailyMap.get(t.date) ?? { revenue: 0, expense: 0 };
    if (t.type === "revenue") {
      day.revenue += t.amount;
      revenueByCategory.set(
        t.category,
        (revenueByCategory.get(t.category) ?? 0) + t.amount,
      );
    } else {
      day.expense += t.amount;
      expenseByCategory.set(
        t.category,
        (expenseByCategory.get(t.category) ?? 0) + t.amount,
      );
    }
    dailyMap.set(t.date, day);
  }

  let totalRevenue = 0;
  let totalExpense = 0;
  let bestDay = { date: startDate, net: -Infinity };
  let worstDay = { date: startDate, net: Infinity };

  const dailyBreakdown: PeriodAnalysis["dailyBreakdown"] = [];

  const sortedDays = [...dailyMap.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  );

  for (const [date, { revenue, expense }] of sortedDays) {
    const net = revenue - expense;
    totalRevenue += revenue;
    totalExpense += expense;
    dailyBreakdown.push({ date, revenue, expense, net });

    if (net > bestDay.net) bestDay = { date, net };
    if (net < worstDay.net) worstDay = { date, net };
  }

  const activeDays = dailyMap.size;
  const netResult = totalRevenue - totalExpense;

  // Handle edge case: no active days
  if (activeDays === 0) {
    bestDay = { date: startDate, net: 0 };
    worstDay = { date: startDate, net: 0 };
  }

  return {
    startDate,
    endDate,
    totalRevenue,
    totalExpense,
    netResult,
    activeDays,
    avgDailyRevenue: activeDays > 0 ? totalRevenue / activeDays : 0,
    avgDailyExpense: activeDays > 0 ? totalExpense / activeDays : 0,
    bestDay,
    worstDay,
    revenueByCategory,
    expenseByCategory,
    dailyBreakdown,
  };
}

export function calculateCategoryBreakdown(transactions: Transaction[]): {
  revenue: Array<{ category: string; total: number; percentage: number }>;
  expense: Array<{ category: string; total: number; percentage: number }>;
} {
  const revMap = new Map<string, number>();
  const expMap = new Map<string, number>();
  let revTotal = 0;
  let expTotal = 0;

  for (const t of transactions) {
    if (t.type === "revenue") {
      revMap.set(t.category, (revMap.get(t.category) ?? 0) + t.amount);
      revTotal += t.amount;
    } else {
      expMap.set(t.category, (expMap.get(t.category) ?? 0) + t.amount);
      expTotal += t.amount;
    }
  }

  const toArray = (map: Map<string, number>, total: number) =>
    [...map.entries()]
      .map(([category, amount]) => ({
        category,
        total: amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

  return {
    revenue: toArray(revMap, revTotal),
    expense: toArray(expMap, expTotal),
  };
}
