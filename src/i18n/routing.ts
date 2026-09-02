import { defineRouting } from "next-intl/routing";

/** Brief §10: alt yol tabanlı 4 dil, varsayılan en, engelleyici modal yok. */
export const routing = defineRouting({
  locales: ["en", "tr", "de", "ar"],
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: true,
  localeCookie: {
    name: "NEXT_LOCALE",
    maxAge: 60 * 60 * 24 * 365,
  },
});

export type Locale = (typeof routing.locales)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  tr: "Türkçe",
  de: "Deutsch",
  ar: "العربية",
};

export const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  tr: "TR",
  de: "DE",
  ar: "AR",
};

/** hreflang etiketleri */
export const HREFLANG: Record<Locale, string> = {
  en: "en",
  tr: "tr",
  de: "de",
  ar: "ar",
};

export function isRtl(locale: string): boolean {
  return locale === "ar";
}

export function dirFor(locale: string): "rtl" | "ltr" {
  return isRtl(locale) ? "rtl" : "ltr";
}
