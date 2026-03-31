import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { readFile, writeFile, remove } from "@tauri-apps/plugin-fs";
import { appConfigDir } from "@tauri-apps/api/path";
import Database from "@tauri-apps/plugin-sql";
import { execute } from "@/services/db";
import { REVENUE_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/categories";

export interface MigrateRow {
  date: string;
  type: "revenue" | "expense";
  amount: number; // kurus
  category: string;
  note: string | null;
  created_at: string;
}

export interface MigratePreview {
  rows: MigrateRow[];
  revenueCount: number;
  expenseCount: number;
  unknownCategories: string[];
}

interface OldRevenue {
  date: string;
  amount: number;
  collection_type: string;
  notes: string | null;
  created_at: string | null;
}

interface OldExpense {
  date: string;
  amount: number;
  expense_type: string;
  notes: string | null;
  created_at: string | null;
}

export async function pickAndPreviewOldDb(): Promise<MigratePreview | null> {
  const filePath = await openDialog({
    multiple: false,
    filters: [{ name: "SQLite Database", extensions: ["db"] }],
  });

  if (!filePath) return null;

  const configDir = await appConfigDir();
  const tempPath = `${configDir}/old-import-temp.db`;

  try {
    const data = await readFile(filePath);
    await writeFile(tempPath, data);

    const oldDb = await Database.load("sqlite:old-import-temp.db");

    const revenues = await oldDb.select<OldRevenue[]>(
      "SELECT * FROM revenues ORDER BY date",
    );
    const expenses = await oldDb.select<OldExpense[]>(
      "SELECT * FROM expenses ORDER BY date",
    );

    const rows: MigrateRow[] = [];

    for (const r of revenues) {
      rows.push({
        date: r.date,
        type: "revenue",
        amount: Math.round(r.amount * 100),
        category: r.collection_type,
        note: r.notes || null,
        created_at: r.created_at || new Date().toISOString(),
      });
    }

    for (const e of expenses) {
      rows.push({
        date: e.date,
        type: "expense",
        amount: Math.round(e.amount * 100),
        category: e.expense_type,
        note: e.notes || null,
        created_at: e.created_at || new Date().toISOString(),
      });
    }

    rows.sort((a, b) => a.date.localeCompare(b.date));

    const revSet = new Set<string>(REVENUE_CATEGORIES);
    const expSet = new Set<string>(EXPENSE_CATEGORIES);
    const unknownCategories = [
      ...new Set(
        rows
          .filter((r) => {
            const valid = r.type === "revenue" ? revSet : expSet;
            return !valid.has(r.category);
          })
          .map(
            (r) => `${r.type === "revenue" ? "Gelir" : "Gider"}: ${r.category}`,
          ),
      ),
    ];

    return {
      rows,
      revenueCount: revenues.length,
      expenseCount: expenses.length,
      unknownCategories,
    };
  } finally {
    try {
      await remove(tempPath);
    } catch {
      // ignore cleanup errors
    }
  }
}

export async function insertMigratedRows(rows: MigrateRow[]): Promise<number> {
  await execute("BEGIN TRANSACTION");
  try {
    let inserted = 0;
    for (const row of rows) {
      await execute(
        "INSERT INTO transactions (id, date, type, amount, category, note, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [
          crypto.randomUUID(),
          row.date,
          row.type,
          row.amount,
          row.category,
          row.note,
          row.created_at,
        ],
      );
      inserted++;
    }
    await execute("COMMIT");
    return inserted;
  } catch (err) {
    await execute("ROLLBACK");
    throw err;
  }
}
