import * as XLSX from "xlsx";
import { save, message } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { openPath } from "@tauri-apps/plugin-opener";
import { select } from "@/services/db";
import { formatDateTR } from "@/lib/format";
import { calculateDailySummary } from "@/lib/calculations";
import type { Transaction } from "@/types";

const HEADERS = ["Tarih", "Tür", "Tutar (TL)", "Kategori", "Not"];

function kurusToTL(kurus: number): number {
  return kurus / 100;
}

function typeLabel(type: string): string {
  return type === "revenue" ? "Gelir" : "Gider";
}

function isoToDMY(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function transactionRows(transactions: Transaction[]): unknown[][] {
  return transactions.map((t) => [
    isoToDMY(t.date),
    typeLabel(t.type),
    kurusToTL(t.amount),
    t.category,
    t.note ?? "",
  ]);
}

function buildDaySheet(
  date: string,
  transactions: Transaction[],
): XLSX.WorkSheet {
  const summary = calculateDailySummary(date, transactions);
  const rows: unknown[][] = [
    [`Günlük Rapor - ${formatDateTR(date)}`],
    [],
    HEADERS,
    ...transactionRows(transactions),
    [],
    [`Toplam Gelir: ${kurusToTL(summary.totalRevenue).toFixed(2)} TL`],
    [`Toplam Gider: ${kurusToTL(summary.totalExpense).toFixed(2)} TL`],
    [`Net Sonuç: ${kurusToTL(summary.netResult).toFixed(2)} TL`],
    [
      `Kar Oranı: ${summary.profitPercentage !== null ? summary.profitPercentage.toFixed(1) + "%" : "-"}`,
    ],
  ];
  return XLSX.utils.aoa_to_sheet(rows);
}

function buildRangeSheet(
  label: string,
  transactions: Transaction[],
): XLSX.WorkSheet {
  const rows: unknown[][] = [[`Analiz Raporu - ${label}`], [], HEADERS];

  // Group transactions by date
  const byDate = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const group = byDate.get(t.date) ?? [];
    group.push(t);
    byDate.set(t.date, group);
  }

  const sortedDates = [...byDate.keys()].sort();
  let grandRevenue = 0;
  let grandExpense = 0;

  for (const date of sortedDates) {
    const dayTx = byDate.get(date)!;
    rows.push(...transactionRows(dayTx));

    const daySummary = calculateDailySummary(date, dayTx);
    grandRevenue += daySummary.totalRevenue;
    grandExpense += daySummary.totalExpense;

    rows.push([
      "",
      "",
      "",
      `${formatDateTR(date)} Toplam`,
      `G: ${kurusToTL(daySummary.totalRevenue).toFixed(2)} / Gd: ${kurusToTL(daySummary.totalExpense).toFixed(2)}`,
    ]);
  }

  const netResult = grandRevenue - grandExpense;
  const profitPct =
    grandRevenue > 0
      ? ((netResult / grandRevenue) * 100).toFixed(1) + "%"
      : "-";

  rows.push(
    [],
    [`Toplam Gelir: ${kurusToTL(grandRevenue).toFixed(2)} TL`],
    [`Toplam Gider: ${kurusToTL(grandExpense).toFixed(2)} TL`],
    [`Net Sonuc: ${kurusToTL(netResult).toFixed(2)} TL`],
    [`Kar Orani: ${profitPct}`],
  );

  return XLSX.utils.aoa_to_sheet(rows);
}

async function saveWorkbook(
  wb: XLSX.WorkBook,
  defaultName: string,
): Promise<boolean> {
  const path = await save({
    defaultPath: defaultName,
    filters: [{ name: "Excel", extensions: ["xlsx"] }],
  });

  if (!path) return false;

  try {
    const data = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    await writeFile(path, new Uint8Array(data));
    await openPath(path);
    return true;
  } catch (err) {
    console.error("Export failed:", err);
    await message(`Dosya kaydedilemedi: ${err}`, {
      title: "Hata",
      kind: "error",
    });
    return false;
  }
}

export async function exportDay(
  date: string,
  transactions: Transaction[],
): Promise<boolean> {
  const ws = buildDaySheet(date, transactions);
  const sheetName = formatDateTR(date);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  return saveWorkbook(wb, `gelir-gider-${date}.xlsx`);
}

export async function exportPeriod(
  startDate: string,
  endDate: string,
  categoryFilter: Set<string> | null,
): Promise<boolean> {
  let query =
    "SELECT id, date, type, amount, category, note, created_at FROM transactions WHERE date >= $1 AND date <= $2";
  const params: unknown[] = [startDate, endDate];

  if (categoryFilter) {
    const placeholders = [...categoryFilter].map((_, i) => `$${i + 3}`);
    query += ` AND category IN (${placeholders.join(", ")})`;
    params.push(...categoryFilter);
  }

  query += " ORDER BY date ASC, created_at ASC";

  const transactions = await select<Transaction[]>(query, params);

  const label = `${formatDateTR(startDate)} - ${formatDateTR(endDate)}`;
  const ws = buildRangeSheet(label, transactions);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Analiz");
  return saveWorkbook(wb, `gelir-gider-${startDate}_${endDate}.xlsx`);
}
