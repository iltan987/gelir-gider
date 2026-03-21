import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { calculateCategoryBreakdown } from "@/lib/calculations";
import type { Transaction } from "@/types";

interface CategoryBreakdownProps {
  transactions: Transaction[];
}

function CategoryList({
  title,
  items,
  colorClass,
}: {
  title: string;
  items: Array<{ category: string; total: number; percentage: number }>;
  colorClass: string;
}) {
  if (items.length === 0) {
    return (
      <div>
        <h3 className={`mb-2 font-medium ${colorClass}`}>{title}</h3>
        <p className="text-muted-foreground text-sm">Kayit yok</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className={`mb-2 font-medium ${colorClass}`}>{title}</h3>
      <table className="grid-table w-full text-sm">
        <thead>
          <tr className="text-muted-foreground text-left text-xs">
            <th className="p-2">Kategori</th>
            <th className="p-2 text-right">Tutar</th>
            <th className="p-2 text-right">%</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.category}>
              <td className="p-2">{item.category}</td>
              <td className="p-2 text-right whitespace-nowrap">
                {formatCurrency(item.total)}
              </td>
              <td className="p-2 text-right">{item.percentage.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CategoryBreakdown({ transactions }: CategoryBreakdownProps) {
  const breakdown = calculateCategoryBreakdown(transactions);

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Kategori Dağılımı</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <CategoryList
            title="Gelir"
            items={breakdown.revenue}
            colorClass="text-emerald-600 dark:text-emerald-400"
          />
          <CategoryList
            title="Gider"
            items={breakdown.expense}
            colorClass="text-rose-600 dark:text-rose-400"
          />
        </div>
      </CardContent>
    </Card>
  );
}
