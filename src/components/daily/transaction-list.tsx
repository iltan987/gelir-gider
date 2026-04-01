import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatCurrency } from "@/lib/format";
import type { Transaction, TransactionType } from "@/types";

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onDeleteAllByType: (type: TransactionType) => void;
}

function TransactionColumn({
  title,
  type,
  items,
  onEdit,
  onDelete,
  onDeleteAll,
}: {
  title: string;
  type: TransactionType;
  items: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
}) {
  const isRevenue = type === "revenue";
  const headerColor = isRevenue
    ? "text-emerald-700 dark:text-emerald-400"
    : "text-rose-700 dark:text-rose-400";
  const borderColor = isRevenue
    ? "border-emerald-200 dark:border-emerald-800"
    : "border-rose-200 dark:border-rose-800";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between print:mb-1">
        <h3 className={`text-sm font-semibold ${headerColor}`}>{title}</h3>
        {items.length > 0 && (
          <ConfirmDialog
            trigger={
              <button
                className={`text-muted-foreground hover:text-destructive inline-flex items-center gap-1 text-xs`}
              >
                <Trash2 className="h-3 w-3" />
                Tümünü sil
              </button>
            }
            title={`Tüm ${title} Kayıtlarını Sil`}
            description={`Bu güne ait tüm ${title.toLowerCase()} kayıtları silinecektir.`}
            confirmLabel="Tümünü Sil"
            variant="destructive"
            doubleConfirm
            onConfirm={onDeleteAll}
          />
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">Kayıt yok</p>
      ) : (
        <table className={`grid-table w-full text-sm ${borderColor}`}>
          <thead>
            <tr>
              <th className="w-8 p-2 text-center font-medium">#</th>
              <th className="p-2 text-left font-medium">Tutar</th>
              <th className="p-2 text-left font-medium">Kategori</th>
              <th className="p-2 text-left font-medium">Not</th>
              <th className="w-20 p-2 text-right font-medium print:hidden"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((t, index) => (
              <tr key={t.id}>
                <td className="text-muted-foreground w-8 p-2 text-center">
                  {index + 1}
                </td>
                <td className="p-2 whitespace-nowrap">
                  {formatCurrency(Math.abs(t.amount))}
                </td>
                <td className="p-2">{t.category}</td>
                <td className="text-muted-foreground max-w-50 truncate p-2">
                  {t.note ?? "-"}
                </td>
                <td className="p-2 text-right print:hidden">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEdit(t)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <button className="text-destructive hover:bg-destructive/10 inline-flex h-7 w-7 items-center justify-center rounded-md">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      }
                      title="Kaydı Sil"
                      description="Bu işlem kaydı kalıcı olarak silecektir."
                      confirmLabel="Sil"
                      variant="destructive"
                      onConfirm={() => onDelete(t.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function TransactionList({
  transactions,
  onEdit,
  onDelete,
  onDeleteAllByType,
}: TransactionListProps) {
  const revenueItems = transactions.filter((t) => t.type === "revenue");
  const expenseItems = transactions.filter((t) => t.type === "expense");

  return (
    <div className="side-by-side">
      <TransactionColumn
        title="Gelir"
        type="revenue"
        items={revenueItems}
        onEdit={onEdit}
        onDelete={onDelete}
        onDeleteAll={() => onDeleteAllByType("revenue")}
      />
      <TransactionColumn
        title="Gider"
        type="expense"
        items={expenseItems}
        onEdit={onEdit}
        onDelete={onDelete}
        onDeleteAll={() => onDeleteAllByType("expense")}
      />
    </div>
  );
}
