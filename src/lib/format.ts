import { format } from "date-fns";
import { tr } from "date-fns/locale/tr";

/**
 * Format kuruş amount to Turkish currency display.
 * Example: 1500000 → "15.000,00 TL"
 */
export function formatCurrency(kurusAmount: number): string {
  const tl = kurusAmount / 100;
  const formatted = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(tl);
  return `${formatted} TL`;
}

/**
 * Format a date string (YYYY-MM-DD) or Date to Turkish locale display.
 * Example: "2026-03-21" → "21 Mart 2026"
 */
export function formatDateTR(
  date: string | Date,
  pattern: string = "d MMMM yyyy",
): string {
  const d = typeof date === "string" ? new Date(date + "T00:00:00") : date;
  return format(d, pattern, { locale: tr });
}

/**
 * Parse a Turkish-formatted amount string to kuruş integer.
 * Accepts: "15.000,00" or "15000,00" or "15000.00" or "15000"
 * Returns integer kuruş value.
 */
export function parseTurkishAmount(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Remove thousand separators (dots), then replace decimal comma with dot
  const normalized = trimmed.replace(/\./g, "").replace(",", ".");

  const parsed = parseFloat(normalized);
  if (isNaN(parsed)) return null;

  return Math.round(parsed * 100);
}
