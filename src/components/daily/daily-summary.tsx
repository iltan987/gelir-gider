import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { DailySummary as DailySummaryType } from "@/types";

interface DailySummaryProps {
  summary: DailySummaryType;
  transactionCount: number;
}

export function DailySummary({ summary, transactionCount }: DailySummaryProps) {
  if (transactionCount === 0) {
    return (
      <Card size="sm">
        <CardContent>
          <p className="text-muted-foreground text-center text-sm">
            Bu tarihte kayit yok.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isProfit = summary.netResult >= 0;

  return (
    <Card size="sm">
      <CardContent>
        <div className="grid grid-cols-3 items-center gap-4 text-center">
          <div>
            <p className="text-muted-foreground text-xs">Toplam Gelir</p>
            <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(summary.totalRevenue)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Toplam Gider</p>
            <p className="text-lg font-semibold text-rose-600 dark:text-rose-400">
              {formatCurrency(summary.totalExpense)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Net Sonuc</p>
            <p
              className={`text-lg font-semibold ${isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
            >
              {isProfit ? "+" : "-"}
              {formatCurrency(Math.abs(summary.netResult))}
            </p>
            {summary.profitPercentage !== null && (
              <p
                className={`text-sm ${isProfit ? "text-emerald-500" : "text-rose-500"}`}
              >
                %{Math.abs(summary.profitPercentage).toFixed(1)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
