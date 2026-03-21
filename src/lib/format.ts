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

/**
 * Live-format an amount input string with Turkish thousand separators.
 * Used as the user types or pastes into the amount field.
 * "15000" → "15.000", "15000,5" → "15.000,5", "15.000,00" → "15.000,00"
 */
export function formatAmountInput(raw: string): string {
  // Strip everything except digits and comma
  const cleaned = raw.replace(/[^\d,]/g, "");

  // Split on first comma
  const commaIdx = cleaned.indexOf(",");
  const intPart = commaIdx === -1 ? cleaned : cleaned.slice(0, commaIdx);
  const decPart =
    commaIdx === -1 ? null : cleaned.slice(commaIdx + 1, commaIdx + 3);

  // Add thousand separators to integer part
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  if (decPart !== null) {
    // Only keep digits in decimal part
    return `${formatted},${decPart.replace(/\D/g, "")}`;
  }

  return formatted;
}
