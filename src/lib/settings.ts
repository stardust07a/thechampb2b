import "server-only";
import { cache } from "react";
import { prisma } from "./prisma";

/**
 * Setting tablosu tek seferde okunur ve istek boyunca önbelleklenir.
 * Değeri girilmemiş alanlar null döner; ilgili bölüm sayfada render EDİLMEZ
 * (brief §7: boş kutu bırakma).
 */
export type SiteSettings = {
  eurRate: number;
  whatsappNumber: string;
  phone: string;
  inquiryEmail: string;
  telegram: string;
  address: string;
  foundedYear: number;
  monthlyCapacity: number | null;
  exportCountries: number | null;
  moqPieces: number;
  customDesignFrom: number;
  logoPrintFrom: number;
  labelChangeFrom: number;
  sampleLeadTimeDays: string | null;
  bulkLeadTimeDays: string | null;
  defaultCurrency: "USD" | "EUR";
  social: { instagram: string; linkedin: string; facebook: string };
  certificates: string[];
};

const FALLBACK: SiteSettings = {
  eurRate: 0.92,
  whatsappNumber: "+905532130404",
  phone: "+90 553 213 04 04",
  inquiryEmail: "info@thechampb2b.com",
  telegram: "",
  address: "İstanbul, Türkiye",
  foundedYear: 2021,
  monthlyCapacity: null,
  exportCountries: null,
  moqPieces: 500,
  customDesignFrom: 1000,
  logoPrintFrom: 1000,
  labelChangeFrom: 1000,
  sampleLeadTimeDays: "7-15",
  bulkLeadTimeDays: "15-45",
  defaultCurrency: "USD",
  social: { instagram: "", linkedin: "", facebook: "" },
  certificates: [],
};

export const getSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const rows = await prisma.setting.findMany();
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return { ...FALLBACK, ...(map as Partial<SiteSettings>) };
  } catch {
    // Veritabanı yoksa site yine ayağa kalksın
    return FALLBACK;
  }
});

/** WhatsApp derin bağlantısı: hazır mesajla açılır (brief §8.1). */
export function whatsappLink(number: string, message: string): string {
  const digits = number.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
