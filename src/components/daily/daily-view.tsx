import { useState, useCallback, useMemo, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Plus, EllipsisVertical, FileSpreadsheet, Printer } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { useTransactions } from "@/hooks/use-transactions";
import { calculateDailySummary } from "@/lib/calculations";
import { exportDay } from "@/services/export";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateTR } from "@/lib/format";
import { DatePicker } from "@/components/shared/date-picker";
import { DailySummary } from "./daily-summary";
import { TransactionForm } from "./transaction-form";
import { TransactionList } from "./transaction-list";
import type { Transaction, TransactionType } from "@/types";

type FormMode =
  | { kind: "closed" }
  | { kind: "add"; type: TransactionType; resetKey: number }
  | { kind: "edit"; transaction: Transaction };

export function DailyView() {
  const selectedDate = useAppStore((s) => s.selectedDate);
  const setSelectedDate = useAppStore((s) => s.setSelectedDate);
  const goToToday = useAppStore((s) => s.goToToday);
  const { transactions, isLoading, add, update, remove, removeAllByType } =
    useTransactions();

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: () => `Günlük_Rapor_${selectedDate}`,
  });

  const [formMode, setFormMode] = useState<FormMode>({ kind: "closed" });

  const handleSave = useCallback(
    async (data: {
      type: TransactionType;
      amount: number;
      category: string;
      note: string | null;
    }) => {
      if (formMode.kind === "edit") {
        await update(formMode.transaction.id, data);
        setFormMode({ kind: "closed" });
      } else if (formMode.kind === "add") {
        await add(data);
        // Stay open for continuous adding - bump key to reset form
        setFormMode((prev) =>
          prev.kind === "add" ? { ...prev, resetKey: prev.resetKey + 1 } : prev,
        );
      }
    },
    [formMode, add, update],
  );

  function handleEdit(transaction: Transaction) {
    setFormMode({ kind: "edit", transaction });
  }

  function handleClose() {
    setFormMode({ kind: "closed" });
  }

  function openAdd(type: TransactionType) {
    setFormMode({ kind: "add", type, resetKey: 0 });
  }

  const formType =
    formMode.kind === "edit"
      ? formMode.transaction.type
      : formMode.kind === "add"
        ? formMode.type
        : null;

  const editingTransaction =
    formMode.kind === "edit" ? formMode.transaction : null;

  const formKey =
    formMode.kind === "edit"
      ? formMode.transaction.id
      : formMode.kind === "add"
        ? `new-${formMode.type}-${formMode.resetKey}`
        : "closed";

  const summary = useMemo(
    () => calculateDailySummary(selectedDate, transactions),
    [selectedDate, transactions],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <DatePicker
          value={selectedDate}
          onChange={setSelectedDate}
          onGoToToday={goToToday}
        />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Islemler">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-auto">
            <DropdownMenuItem
              onClick={() => exportDay(selectedDate, transactions)}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel'e Aktar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePrint()}>
              <Printer className="mr-2 h-4 w-4" />
              Yazdir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="side-by-side print:hidden">
        <Button
          variant="outline"
          className={
            formMode.kind === "add" && formMode.type === "revenue"
              ? "border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900"
              : "text-emerald-600 hover:border-emerald-300 hover:text-emerald-700"
          }
          onClick={() => openAdd("revenue")}
        >
          <Plus className="mr-1 h-4 w-4" />
          Gelir Ekle
        </Button>
        <Button
          variant="outline"
          className={
            formMode.kind === "add" && formMode.type === "expense"
              ? "border-rose-500 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-400 dark:hover:bg-rose-900"
              : "text-rose-600 hover:border-rose-300 hover:text-rose-700"
          }
          onClick={() => openAdd("expense")}
        >
          <Plus className="mr-1 h-4 w-4" />
          Gider Ekle
        </Button>
      </div>

      {formMode.kind !== "closed" && formType && (
        <TransactionForm
          key={formKey}
          type={formType}
          editingTransaction={editingTransaction}
          onSave={handleSave}
          onCancel={handleClose}
        />
      )}

      <div ref={printRef}>
        <div className="print-report-header">
          <h1>Günlük Rapor - {formatDateTR(selectedDate)}</h1>
          <p>Yazdırma tarihi: {formatDateTR(new Date())}</p>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-sm">Yükleniyor...</p>
        ) : (
          <div className="space-y-4">
            <TransactionList
              transactions={transactions}
              onEdit={handleEdit}
              onDelete={remove}
              onDeleteAllByType={removeAllByType}
            />
            <DailySummary
              summary={summary}
              transactionCount={transactions.length}
            />
          </div>
        )}
      </div>
    </div>
  );
}
