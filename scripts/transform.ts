/**
 * data/products.source.json -> data/products.normalized.json + data/import-report.json
 *
 * Yaptigi (brief SS6.2):
 *  1. nameEn uretimi (yapisal, benzersiz, <=40 karakter)
 *  2. slug uretimi (cakismada -2)
 *  3. TR / DE / AR cevirileri
 *  4. renk normalizasyonu + hex
 *  8/9. beden normalizasyonu, bebek bedenli urunu draft'a alma
 *
 * Bu betik ag erisimi yapmaz, veritabanina yazmaz. Ciktisi seed'in girdisidir.
 * Calistir: npm run data:transform
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  CATEGORY_NAMES,
  LOCALES,
  SECTIONS,
  type L10n,
} from "./lib/lexicon";
import { buildProductCopy } from "./lib/describe";
import {
  buildFabric,
  buildNames,
  extractDetails,
  extractNameParts,
  normalizeColor,
  normalizeSizes,
  slugify,
  type NormalizedColor,
} from "./lib/normalize";

const ROOT = resolve(import.meta.dirname, "..");
const SRC = resolve(ROOT, "data/products.source.json");
const OUT = resolve(ROOT, "data/products.normalized.json");
const REPORT = resolve(ROOT, "data/import-report.json");

/** Fiyat verisi gelene kadar MOQ varsayilani (brief SS13.3). */
const DEFAULT_MOQ = 500;

/** Brief SS6.2/1: urun adi 40 karakteri gecmez. */
const MAX_NAME_LEN = 40;

/**
 * 3 iplik uretilen kategoriler (sweatshirt, esofman alti, esofman takimi).
 * Kumas bilesimi kullanici tarafindan verildi ve kaynak ipucundan
 * (fabricHint) ustundur: bu kategorilerde ipucu ne derse desin bu gecerli.
 */
const THREE_THREAD_CATEGORIES = new Set(["sweatshirts", "sweatpants", "tracksuits"]);

const THREE_THREAD_FABRIC: L10n = {
  en: "65% cotton, 35% polyviscose — 3-thread brushed fleece",
  tr: "%65 pamuk, %35 poliviskon — 3 iplik şardonlu",
  de: "65 % Baumwolle, 35 % Polyviskose — 3-Faden angeraut",
  ar: "65% قطن، 35% بولي فيسكوز — ثلاثة خيوط مكشّط",
};

type SourceVariant = {
  color: string;
  sizes: string[];
  images: string[];
  skuCount: number;
};

type SourceProduct = {
  productCode: string;
  modelCode: string | null;
  nameTr: string;
  nameEn: string | null;
  slug: string | null;
  descriptionTr: string | null;
  category: string;
  categorySlug: string;
  categoryTr: string;
  subcategory: string | null;
  section: string;
  audience: string;
  sizes: string[];
  colorCount: number;
  variants: SourceVariant[];
  imageCount: number;
  fabricHint: string | null;
  fabricTag: string | null;
  retailTry: number | null;
  sourceUrl: string | null;
};

export type NormalizedVariant = {
  color: string;
  colorTr: string;
  colorDe: string;
  colorAr: string;
  colorHex: string | null;
  colorSlug: string;
  sizes: string[];
  sourceImages: string[];
  sortOrder: number;
};

export type NormalizedProduct = {
  productCode: string;
  modelCode: string | null;
  slug: string;
  categorySlug: string;
  subcategory: string | null;
  section: string;
  audience: "adult" | "kids";
  status: "published" | "draft";
  sizes: string[];
  sizeRange: string | null;
  fabric: L10n | null;
  details: L10n[];
  translations: Record<
    string,
    {
      name: string;
      shortDescription: string;
      description: string;
      seoTitle: string;
      seoDescription: string;
    }
  >;
  variants: NormalizedVariant[];
  imageCount: number;
  sourceUrl: string | null;
  retailTry: number | null;
  importWarnings: string[];
};

const source = JSON.parse(readFileSync(SRC, "utf8")) as {
  brand: string;
  generated: string;
  productCount: number;
  categories: { name: string; slug: string; count: number }[];
  products: SourceProduct[];
};

const usedSlugs = new Set<string>();
const usedNamesEn = new Set<string>();
const unmappedColors = new Map<string, number>();
const unmappedDetails = new Map<string, number>();
const sizeWarnings: { code: string; warnings: string[] }[] = [];
const drafted: { code: string; reason: string }[] = [];

/** Ayni ad iki kez cikamaz (brief SS6.2/1). */
function uniqueName(base: string, productCode: string): string {
  if (!usedNamesEn.has(base)) {
    usedNamesEn.add(base);
    return base;
  }
  // ayirt edici kelime: urun kodunun sayisal kuyrugu.
  // Ek geldikten sonra da 40 karakter siniri korunur -> once gövde kisaltilir.
  const suffix = productCode.split("-").pop() ?? "";
  const budget = MAX_NAME_LEN - suffix.length - 1;
  let stem = base;
  while (stem.length > budget && stem.includes(" ")) {
    stem = stem.slice(0, stem.lastIndexOf(" ")).trim();
  }
  let candidate = `${stem} ${suffix}`;
  let n = 2;
  while (usedNamesEn.has(candidate)) candidate = `${stem} ${suffix}-${n++}`;
  usedNamesEn.add(candidate);
  return candidate;
}

function uniqueSlug(base: string): string {
  let candidate = base || "product";
  let n = 2;
  while (usedSlugs.has(candidate)) candidate = `${base}-${n++}`;
  usedSlugs.add(candidate);
  return candidate;
}

const products: NormalizedProduct[] = [];

for (const src of source.products) {
  const warnings: string[] = [];

  /* ---- beden ---- */
  const sizeResult = normalizeSizes(src.sizes, src.audience);
  if (sizeResult.warnings.length) {
    sizeWarnings.push({ code: src.productCode, warnings: sizeResult.warnings });
    warnings.push(...sizeResult.warnings);
  }

  let status: "published" | "draft" = "published";
  if (sizeResult.babySize) {
    status = "draft";
    const reason = "bebek bedeni (12-13 Ay) iceriyor";
    drafted.push({ code: src.productCode, reason });
    warnings.push(reason);
  }
  if (src.variants.length === 0 || src.imageCount === 0) {
    status = "draft";
    const reason = "gorsel yok";
    drafted.push({ code: src.productCode, reason });
    warnings.push(reason);
  }

  /* ---- renk ----
     Kaynakta ayni renk birden fazla varyant olarak gelebiliyor (BEYAZ, BEYAZ-1,
     BEYAZ2 ...). Kanonik renge gore birlestirilir; gorseller ve bedenler toplanir.
     Yoksa detay sayfasinda yan yana iki "White" noktasi cikiyor. */
  const byColor = new Map<string, NormalizedVariant>();
  const colorNames: L10n[] = [];

  src.variants.forEach((v, i) => {
    const c: NormalizedColor = normalizeColor(v.color);
    if (!c.mapped) {
      unmappedColors.set(v.color, (unmappedColors.get(v.color) ?? 0) + 1);
      warnings.push(`eslenmemis renk: ${v.color}`);
    }
    const colorSlug = slugify(c.canonical) || `color-${i + 1}`;
    const vSizes = normalizeSizes(v.sizes.length ? v.sizes : src.sizes, src.audience);

    const existing = byColor.get(colorSlug);
    if (existing) {
      for (const img of v.images) {
        if (!existing.sourceImages.includes(img)) existing.sourceImages.push(img);
      }
      existing.sizes = [...new Set([...existing.sizes, ...vSizes.sizes])];
      return;
    }

    byColor.set(colorSlug, {
      color: c.canonical,
      colorTr: c.tr,
      colorDe: c.de,
      colorAr: c.ar,
      colorHex: c.hex,
      colorSlug,
      sizes: vSizes.sizes,
      sourceImages: [...v.images],
      sortOrder: byColor.size,
    });
    colorNames.push({ en: c.canonical, tr: c.tr, de: c.de, ar: c.ar });
  });

  const variants: NormalizedVariant[] = [...byColor.values()];
  // birlestirme sonrasi beden sirasini kanonik siraya geri koy
  for (const v of variants) {
    v.sizes = normalizeSizes(v.sizes, src.audience).sizes;
  }

  /* ---- ad ---- */
  const parts = extractNameParts(src.nameTr, src.categorySlug, src.subcategory, src.section);
  const { name } = buildNames(parts, src.categorySlug, src.section);
  const nameEn = uniqueName(name.en, src.productCode);
  if (nameEn !== name.en) {
    // cakisma cozuldu: ayirt edici eki diger dillere de tasi
    const extra = nameEn.split(" ").pop() ?? "";
    for (const locale of LOCALES) {
      if (locale === "en") continue;
      name[locale] = `${name[locale]} ${extra}`.trim();
    }
  }
  name.en = nameEn;

  const slug = uniqueSlug(slugify(nameEn));

  /* ---- kumas + detay ---- */
  const fabric = THREE_THREAD_CATEGORIES.has(src.categorySlug)
    ? THREE_THREAD_FABRIC
    : buildFabric(src.fabricHint, src.fabricTag);
  const { details, unmatched } = extractDetails(src.nameTr);
  for (const u of unmatched) unmappedDetails.set(u, (unmappedDetails.get(u) ?? 0) + 1);

  /* ---- metinler ---- */
  const copy = buildProductCopy({
    name,
    categoryName: CATEGORY_NAMES[src.categorySlug] ?? {
      en: src.category,
      tr: src.categoryTr,
      de: src.category,
      ar: src.category,
    },
    sectionName: SECTIONS[src.section],
    fabric,
    details,
    colorNames,
    sizeRange: sizeResult.range,
    colorCount: variants.length || src.colorCount,
    moq: DEFAULT_MOQ,
  });

  const translations: NormalizedProduct["translations"] = {};
  for (const locale of LOCALES) {
    translations[locale] = {
      name: name[locale],
      shortDescription: copy.shortDescription[locale],
      description: copy.description[locale],
      seoTitle: copy.seoTitle[locale],
      seoDescription: copy.seoDescription[locale],
    };
  }

  products.push({
    productCode: src.productCode,
    modelCode: src.modelCode,
    slug,
    categorySlug: src.categorySlug,
    subcategory: src.subcategory,
    section: src.section,
    audience: sizeResult.audience,
    status,
    sizes: sizeResult.sizes,
    sizeRange: sizeResult.range,
    fabric,
    details,
    translations,
    variants,
    imageCount: variants.reduce((a, v) => a + v.sourceImages.length, 0),
    sourceUrl: src.sourceUrl,
    retailTry: src.retailTry,
    importWarnings: [...new Set(warnings)],
  });
}

/* --------------------------------------------------------------- kategori */

const categories = source.categories.map((c, i) => ({
  slug: c.slug,
  order: i,
  productCount: c.count,
  names: CATEGORY_NAMES[c.slug] ?? { en: c.name, tr: c.name, de: c.name, ar: c.name },
}));

/* ------------------------------------------------------------------ cikti */

writeFileSync(
  OUT,
  JSON.stringify(
    {
      brand: source.brand,
      generatedFrom: source.generated,
      transformedAt: new Date().toISOString().slice(0, 10),
      categories,
      products,
    },
    null,
    1,
  ),
);

const report = {
  totalProducts: products.length,
  published: products.filter((p) => p.status === "published").length,
  draft: products.filter((p) => p.status === "draft").length,
  totalVariants: products.reduce((a, p) => a + p.variants.length, 0),
  totalImages: products.reduce((a, p) => a + p.imageCount, 0),
  draftedProducts: drafted,
  unmappedColors: Object.fromEntries(
    [...unmappedColors.entries()].sort((a, b) => b[1] - a[1]),
  ),
  unmappedDetailSegments: Object.fromEntries(
    [...unmappedDetails.entries()].sort((a, b) => b[1] - a[1]).slice(0, 60),
  ),
  sizeWarnings,
  duplicateNamesResolved: products.filter((p) => /\d{4}(-\d)?$/.test(p.translations.en.name))
    .length,
  longestNameEn: products.reduce(
    (a, p) => Math.max(a, p.translations.en.name.length),
    0,
  ),
};

writeFileSync(REPORT, JSON.stringify(report, null, 2));

console.log(`✓ ${products.length} ürün normalize edildi`);
console.log(`  yayında: ${report.published} · taslak: ${report.draft}`);
console.log(`  varyant: ${report.totalVariants} · görsel: ${report.totalImages}`);
console.log(`  eşlenmemiş renk: ${Object.keys(report.unmappedColors).length}`);
console.log(`  en uzun EN ad: ${report.longestNameEn} karakter`);
console.log(`→ ${OUT}`);
console.log(`→ ${REPORT}`);
