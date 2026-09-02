import type { Locale } from "@/i18n/routing";

export type Currency = "USD" | "EUR";

/** Intl ile locale'e uygun para biçimi (brief §10). */
export function formatPrice(value: number, currency: Currency, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar" : locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar" : locale).format(value);
}
