import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateTR } from "@/lib/format";
import type { Transaction } from "@/types";

interface AnalysisTableProps {
  transactions: Transaction[];
}

export function AnalysisTable({ transactions }: AnalysisTableProps) {
  if (transactions.length === 0) {
    return (
      <Card size="sm">
        <CardContent>
          <p className="text-muted-foreground text-center text-sm">
            Filtrelere uygun kayıt bulunamadı.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>İşlemler ({transactions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="grid-table w-full text-sm">
          <thead>
            <tr className="text-muted-foreground text-left text-xs">
              <th className="p-2">Tarih</th>
              <th className="p-2">Tip</th>
              <th className="p-2">Tutar</th>
              <th className="p-2">Kategori</th>
              <th className="p-2">Not</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td className="p-2 whitespace-nowrap">
                  {formatDateTR(t.date, "d MMM yyyy")}
                </td>
                <td className="p-2">
                  <span
                    className={
                      t.type === "revenue"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }
                  >
                    {t.type === "revenue" ? "Gelir" : "Gider"}
                  </span>
                </td>
                <td className="p-2 whitespace-nowrap">
                  {formatCurrency(Math.abs(t.amount))}
                </td>
                <td className="p-2">{t.category}</td>
                <td className="text-muted-foreground max-w-50 truncate p-2">
                  {t.note ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
