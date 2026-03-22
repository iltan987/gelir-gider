import * as XLSX from "xlsx";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { execute } from "@/services/db";
import {
  REVENUE_CATEGORIES,
  EXPENSE_CATEGORIES,
  isRefundCategory,
} from "@/lib/categories";
import type { ImportError } from "@/types";

const REVENUE_SET = new Set<string>(REVENUE_CATEGORIES);
const EXPENSE_SET = new Set<string>(EXPENSE_CATEGORIES);

interface ParsedRow {
  date: string;
  type: "revenue" | "expense";
  amount: number; // kurus, already signed
  category: string;
  note: string | null;
}

export interface ImportResult {
  validRows: ParsedRow[];
  errors: ImportError[];
}

function parseDate(raw: unknown): string | null {
  if (raw == null) return null;

  // SheetJS may parse dates as JS Date objects
  if (raw instanceof Date) {
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, "0");
    const d = String(raw.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const str = String(raw).trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // DD.MM.YYYY or DD/MM/YYYY
  const match = str.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }
  return null;
}

function parseType(raw: unknown): "revenue" | "expense" | null {
  if (raw == null) return null;
  const str = String(raw).trim().toLowerCase();
  if (str === "revenue" || str === "gelir") return "revenue";
  if (str === "expense" || str === "gider") return "expense";
  return null;
}

function parseAmount(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") {
    if (raw === 0) return null;
    return Math.round(raw * 100);
  }
  const str = String(raw).trim();
  // Turkish format: 15.000,50 -> 15000.50
  const normalized = str.replace(/\./g, "").replace(",", ".");
  const val = parseFloat(normalized);
  if (isNaN(val) || val === 0) return null;
  return Math.round(val * 100);
}

export function parseAndValidate(data: Uint8Array): ImportResult {
  const wb = XLSX.read(data, { type: "array", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  const validRows: ParsedRow[] = [];
  const errors: ImportError[] = [];

  // Find header row (first row containing "Tarih" or "date" in any cell)
  let headerIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (
      Array.isArray(row) &&
      row.some(
        (c) =>
          typeof c === "string" &&
          ["tarih", "date"].includes(c.trim().toLowerCase()),
      )
    ) {
      headerIdx = i;
      break;
    }
  }

  const startRow = headerIdx >= 0 ? headerIdx + 1 : 0;

  let hasData = false;
  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row) || row.length === 0) {
      if (hasData) break; // empty row after data = end of data section
      continue;
    }
    if (row.every((c) => c == null || String(c).trim() === "")) {
      if (hasData) break;
      continue;
    }
    // Skip summary/metadata rows (single-cell rows starting with known prefixes)
    const firstCell = String(row[0] ?? "").trim();
    if (
      row.length < 3 ||
      /^(Toplam|Net|Kar|Günlük|Analiz)/i.test(firstCell)
    ) {
      continue;
    }

    const rowNum = i + 1; // 1-indexed for user display
    const [rawDate, rawType, rawAmount, rawCategory, rawNote] = row;

    const date = parseDate(rawDate);
    if (!date) {
      errors.push({
        row: rowNum,
        field: "Tarih",
        value: rawDate,
        message: `Geçersiz tarih: "${rawDate}"`,
      });
      continue;
    }

    const type = parseType(rawType);
    if (!type) {
      errors.push({
        row: rowNum,
        field: "Tür",
        value: rawType,
        message: `Geçersiz tür: "${rawType}". "Gelir" veya "Gider" olmalı`,
      });
      continue;
    }

    const amount = parseAmount(rawAmount);
    if (amount === null) {
      errors.push({
        row: rowNum,
        field: "Tutar",
        value: rawAmount,
        message: `Geçersiz veya sıfır tutar: "${rawAmount}"`,
      });
      continue;
    }

    const category = rawCategory != null ? String(rawCategory).trim() : "";
    const catSet = type === "revenue" ? REVENUE_SET : EXPENSE_SET;
    if (!catSet.has(category)) {
      errors.push({
        row: rowNum,
        field: "Kategori",
        value: rawCategory,
        message: `Geçersiz kategori: "${category}"`,
      });
      continue;
    }

    const finalAmount = isRefundCategory(category)
      ? -Math.abs(amount)
      : Math.abs(amount);

    hasData = true;
    validRows.push({
      date,
      type,
      amount: finalAmount,
      category,
      note: rawNote != null ? String(rawNote).trim() || null : null,
    });
  }

  return { validRows, errors };
}

export async function pickAndParseFile(): Promise<ImportResult | null> {
  const path = await openDialog({
    multiple: false,
    filters: [{ name: "Excel", extensions: ["xlsx", "xls"] }],
  });

  if (!path) return null;

  const data = await readFile(path);
  return parseAndValidate(data);
}

export async function insertRows(rows: ParsedRow[]): Promise<number> {
  let inserted = 0;
  for (const row of rows) {
    await execute(
      "INSERT INTO transactions (id, date, type, amount, category, note) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        crypto.randomUUID(),
        row.date,
        row.type,
        row.amount,
        row.category,
        row.note,
      ],
    );
    inserted++;
  }
  return inserted;
}
