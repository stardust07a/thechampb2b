import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { COLORS, FITS, SECTIONS, KIDS_GENDER } from "./lib/lexicon";

// Kanonik İngilizce renk adı -> 4 dil. Aynı EN ada birden çok TR karşılığı
// gelirse ilki kazanır (ör. Kahve/Kahverengi -> Brown).
const colors: Record<string, { en: string; tr: string; de: string; ar: string }> = {};
for (const c of Object.values(COLORS)) {
  if (!colors[c.en]) colors[c.en] = { en: c.en, tr: c.tr, de: c.de, ar: c.ar };
}

const subcats: Record<string, { en: string; tr: string; de: string; ar: string }> = {
  Printed: { en: "Printed", tr: "Baskılı", de: "Bedruckt", ar: "مطبوع" },
};
for (const [k, v] of Object.entries(FITS)) {
  subcats[k] = { en: v.en || k, tr: v.tr || k, de: v.de || k, ar: v.ar || k };
}

const out = `// OTOMATİK ÜRETİLDİ — scripts/lib/lexicon.ts kaynak alınarak.
// Yeniden üretmek için: npx tsx scripts/gen-taxonomy.ts
//
// Katalog filtrelerinde gösterilen etiketler. Filtrenin URL'e yazdığı DEĞER
// veritabanındaki kanonik İngilizce metindir; kullanıcıya gösterilen ETİKET
// buradan gelir. İkisini karıştırmayın — değer değişirse filtre bozulur.

import type { AppLocale } from "./locales";

export type TaxonomyLabel = Record<AppLocale, string>;

export const SECTION_LABELS: Record<string, TaxonomyLabel> = ${JSON.stringify(
  Object.fromEntries(Object.entries(SECTIONS).map(([k, v]) => [k, { en: v.en, tr: v.tr, de: v.de, ar: v.ar }])),
  null,
  2,
)};

export const KIDS_GENDER_LABELS: Record<string, TaxonomyLabel> = ${JSON.stringify(
  Object.fromEntries(Object.entries(KIDS_GENDER).map(([k, v]) => [k, { en: v.en, tr: v.tr, de: v.de, ar: v.ar }])),
  null,
  2,
)};

export const SUBCATEGORY_LABELS: Record<string, TaxonomyLabel> = ${JSON.stringify(subcats, null, 2)};

export const COLOR_LABELS: Record<string, TaxonomyLabel> = ${JSON.stringify(colors, null, 2)};

/** Etiketi çevir; sözlükte yoksa ham değeri döndür (filtre yine çalışır). */
export function label(
  map: Record<string, TaxonomyLabel>,
  value: string,
  locale: AppLocale,
): string {
  return map[value]?.[locale] ?? value;
}

/** "Black / White" gibi birleşik renk adlarını parça parça çevirir. */
export function colorLabel(value: string, locale: AppLocale): string {
  return value
    .split(" / ")
    .map((part) => COLOR_LABELS[part]?.[locale] ?? part)
    .join(" / ");
}
`;

writeFileSync(resolve(import.meta.dirname, "../src/lib/taxonomy.ts"), out);
console.log("src/lib/taxonomy.ts yazıldı");
console.log("  renk:", Object.keys(colors).length, "· alt kategori:", Object.keys(subcats).length);
