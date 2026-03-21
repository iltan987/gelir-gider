import type { TransactionType } from "@/types";

export const REVENUE_CATEGORIES = [
  "BARTER",
  "CARİYE MAHSUBEN",
  "ÇEK",
  "DİĞER",
  "EFT-HAVALE",
  "İADE",
  "KREDİ KARTI",
  "NAKİT",
  "SENET",
] as const;

export const EXPENSE_CATEGORIES = [
  "AKSESUAR",
  "ARAÇ KİRALAMA",
  "ARAÇ TAMİR",
  "BANKA KOMİSYON",
  "CAM VE MLZ",
  "CARİYE MAHSUBEN",
  "ÇEK",
  "DİĞER",
  "ELEKTRİK FT",
  "FAİZ",
  "FAZLA MESAİ",
  "FİNANSMAN",
  "HGS",
  "HIRDAVAT MLZ",
  "İADE",
  "İŞ GÜVENLİĞİ",
  "KİRA",
  "KONAKLAMA",
  "MAAŞ",
  "MAKİNA-TESİSAT",
  "MAMA",
  "MARKET",
  "MUHASEBE",
  "NAKLİYE GİDERİ",
  "PANJUR",
  "PRİM",
  "PROFİL",
  "PVC DOĞRAMA",
  "PVC YRD. MLZ",
  "REKLAMASYON",
  "SAC",
  "SARF-KIRTASİYE",
  "SGK",
  "SU FT",
  "TELEFON FT",
  "TRAFİK CEZASI",
  "VERGİ",
  "YAKIT",
  "YEMEK",
  "YÖNETİM GİDERLERİ",
] as const;

export function isRefundCategory(category: string): boolean {
  return category === "İADE";
}

export function getCategoriesForType(type: TransactionType): readonly string[] {
  return type === "revenue" ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES;
}
