/** Sunucu tarafında ve betiklerde ortak locale listesi (i18n yapılandırmasından bağımsız). */
export const LOCALES = ["en", "tr", "de", "ar"] as const;
export type AppLocale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<AppLocale, string> = {
  en: "İngilizce",
  tr: "Türkçe",
  de: "Almanca",
  ar: "Arapça",
};
