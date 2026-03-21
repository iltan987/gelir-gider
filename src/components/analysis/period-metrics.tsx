import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateTR } from "@/lib/format";
import type { PeriodAnalysis } from "@/types";

interface PeriodMetricsProps {
  analysis: PeriodAnalysis;
}

function Metric({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={`font-semibold ${className ?? ""}`}>{value}</p>
    </div>
  );
}

export function PeriodMetrics({ analysis }: PeriodMetricsProps) {
  const isProfit = analysis.netResult >= 0;

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Özet</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric
            label="Toplam Gelir"
            value={formatCurrency(analysis.totalRevenue)}
            className="text-emerald-600 dark:text-emerald-400"
          />
          <Metric
            label="Toplam Gider"
            value={formatCurrency(analysis.totalExpense)}
            className="text-rose-600 dark:text-rose-400"
          />
          <Metric
            label="Net Sonuç"
            value={`${isProfit ? "+" : "-"}${formatCurrency(Math.abs(analysis.netResult))}`}
            className={
              isProfit
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }
          />
          <Metric label="Aktif Gün" value={String(analysis.activeDays)} />
          <Metric
            label="Ort. Günlük Gelir"
            value={formatCurrency(Math.round(analysis.avgDailyRevenue))}
            className="text-emerald-600 dark:text-emerald-400"
          />
          <Metric
            label="Ort. Günlük Gider"
            value={formatCurrency(Math.round(analysis.avgDailyExpense))}
            className="text-rose-600 dark:text-rose-400"
          />
          <Metric
            label="En İyi Gün"
            value={
              analysis.activeDays > 0
                ? `${formatDateTR(analysis.bestDay.date, "d MMM")} (${formatCurrency(analysis.bestDay.net)})`
                : "-"
            }
          />
          <Metric
            label="En Kötü Gün"
            value={
              analysis.activeDays > 0
                ? `${formatDateTR(analysis.worstDay.date, "d MMM")} (${formatCurrency(analysis.worstDay.net)})`
                : "-"
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
