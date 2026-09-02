/**
 * B2B urun metinleri (kisa aciklama, uzun aciklama, SEO).
 *
 * Kaynaktaki Turkce aciklamalar perakende pazaryeri metinleridir ("rahat kalibiyla
 * gunluk kullanima uygun...") - toptan alici icin degeri yok. Bunun yerine urunun
 * yapisal verisinden (kumas, kalip, renk, beden, ozellestirme, MOQ) 4 dilde
 * teknik B2B metni uretiyoruz. Brief SS4.4 / SS11.
 */

import { LOCALES, type L10n, type Locale } from "./lexicon";

export type DescribeInput = {
  name: L10n;
  categoryName: L10n;
  sectionName: L10n;
  fabric: L10n | null;
  details: L10n[];
  colorNames: L10n[];
  sizeRange: string | null;
  colorCount: number;
  moq: number;
};

function list(items: string[], locale: Locale): string {
  const clean = items.filter(Boolean);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];

  // Arapçada ayraç Arap virgülüdür ve "و" sonraki kelimeye bitişik yazılır.
  if (locale === "ar") {
    return `${clean.slice(0, -1).join("، ")} و${clean[clean.length - 1]}`;
  }

  const conj: Record<Exclude<Locale, "ar">, string> = { en: "and", tr: "ve", de: "und" };
  return `${clean.slice(0, -1).join(", ")} ${conj[locale as Exclude<Locale, "ar">]} ${clean[clean.length - 1]}`;
}

/**
 * Arapçada sayı-isim uyumu:
 *   1  → tekil            لون
 *   2  → ikil             لونين
 *   3-10 → çoğul          ألوان
 *   11+ → tekil tamyiz    لوناً
 */
function arColourCount(n: number, names: string): string {
  if (n === 1) return `متوفر باللون ${names}`;
  if (n === 2) return `متوفر بلونين: ${names}`;
  if (n <= 10) return `متوفر بـ ${n} ألوان: ${names}`;
  return `متوفر بـ ${n} لوناً: ${names}`;
}

const SHORT: Record<Locale, (v: Record<string, string>) => string> = {
  en: (v) =>
    `${v.name} for wholesale and private label production${v.fabric ? `, ${v.fabric}` : ""}. ` +
    `${v.colours}${v.sizes ? `, sizes ${v.sizes}` : ""}. Minimum order ${v.moq} pcs.`,
  // Ürün adı olduğu gibi kullanılır: küçültmek "Howdy" gibi baskı adlarını
  // ve marka isimlerini bozuyordu.
  tr: (v) =>
    `${v.name} — toptan ve private label üretime uygun` +
    `${v.fabric ? `, ${v.fabric}` : ""}. ${v.colours}${v.sizes ? `, ${v.sizes} beden` : ""}. ` +
    `Minimum sipariş ${v.moq} adet.`,
  de: (v) =>
    `${v.name} für Großhandel und Private-Label-Produktion${v.fabric ? `, ${v.fabric}` : ""}. ` +
    `${v.colours}${v.sizes ? `, Größen ${v.sizes}` : ""}. Mindestbestellmenge ${v.moq} Stück.`,
  ar: (v) =>
    `${v.name} — للإنتاج بالجملة وبالعلامة الخاصة${v.fabric ? `، ${v.fabric}` : ""}. ` +
    `${v.colours}${v.sizes ? `، المقاسات ${v.sizes}` : ""}. الحد الأدنى للطلب ${v.moq} قطعة.`,
};

const COLOURS_PHRASE: Record<Locale, (n: number, names: string) => string> = {
  en: (n, names) => (n === 1 ? `Available in ${names}` : `Available in ${n} colours: ${names}`),
  tr: (n, names) => (n === 1 ? `${names} renginde` : `${n} renk seçeneği: ${names}`),
  de: (n, names) => (n === 1 ? `Erhältlich in ${names}` : `${n} Farben verfügbar: ${names}`),
  ar: (n, names) => arColourCount(n, names),
};

const LONG: Record<Locale, (v: Record<string, string>) => string> = {
  en: (v) =>
    `${v.name} produced in our own knitwear facility in Istanbul for wholesale buyers, ` +
    `distributors and brand owners.${v.fabric ? ` Fabric: ${v.fabric}.` : ""}` +
    `${v.details ? ` Construction details: ${v.details}.` : ""}\n\n` +
    `${v.colours}${v.sizes ? `. Size range ${v.sizes}` : ""}. ` +
    `Custom colours, fabrics and size runs can be developed on request.\n\n` +
    `Private label production is available: your own woven and care labels, hangtags and ` +
    `packaging. Custom logo print, custom design and label change are available from 1,000 pcs. ` +
    `Minimum order ${v.moq} pcs per style. Prices are quoted EXW Istanbul, ` +
    `excluding VAT and shipping.`,
  tr: (v) =>
    `${v.name} — İstanbul'daki kendi örme tesisimizde toptan alıcılar, distribütörler ve ` +
    `marka sahipleri için üretilir.${v.fabric ? ` Kumaş: ${v.fabric}.` : ""}` +
    `${v.details ? ` Yapı detayları: ${v.details}.` : ""}\n\n` +
    `${v.colours}${v.sizes ? `. Beden aralığı ${v.sizes}` : ""}. ` +
    `Talep üzerine özel renk, kumaş ve beden serisi geliştirilebilir.\n\n` +
    `Private label üretim mümkündür: kendi dokuma ve bakım etiketleriniz, karton etiket ve ` +
    `ambalaj. Logo baskı, özel tasarım ve etiket değişimi 1.000 adetten başlar. ` +
    `Model başına minimum sipariş ${v.moq} adet. Fiyatlar EXW İstanbul'dur; KDV ve nakliye hariçtir.`,
  de: (v) =>
    `${v.name} wird in unserer eigenen Strickerei in Istanbul für Großhändler, Distributoren ` +
    `und Markeninhaber gefertigt.${v.fabric ? ` Stoff: ${v.fabric}.` : ""}` +
    `${v.details ? ` Verarbeitungsdetails: ${v.details}.` : ""}\n\n` +
    `${v.colours}${v.sizes ? `. Größenbereich ${v.sizes}` : ""}. ` +
    `Sonderfarben, Sonderstoffe und eigene Größenläufe sind auf Anfrage möglich.\n\n` +
    `Private-Label-Produktion ist möglich: eigene Web- und Pflegeetiketten, Hangtags und ` +
    `Verpackung. Logodruck, Sonderdesign und Etikettenwechsel sind ab 1.000 Stück möglich. ` +
    `Mindestbestellmenge ${v.moq} Stück pro Modell. Preise verstehen sich EXW ` +
    `Istanbul, zzgl. MwSt. und Versand.`,
  ar: (v) =>
    `${v.name} يُنتج في مصنع التريكو الخاص بنا في إسطنبول لتجار الجملة والموزعين وأصحاب ` +
    `العلامات التجارية.${v.fabric ? ` القماش: ${v.fabric}.` : ""}` +
    `${v.details ? ` تفاصيل التصنيع: ${v.details}.` : ""}\n\n` +
    `${v.colours}${v.sizes ? `. نطاق المقاسات ${v.sizes}` : ""}. ` +
    `يمكن تطوير ألوان وأقمشة ومقاسات خاصة حسب الطلب.\n\n` +
    `الإنتاج بالعلامة الخاصة متاح: ملصقات منسوجة وملصقات العناية والبطاقات والتغليف الخاص بكم. ` +
    `طباعة الشعار والتصميم الخاص وتغيير الملصق متاحة ابتداءً من 1,000 قطعة. ` +
    `الحد الأدنى للطلب ${v.moq} قطعة لكل موديل. الأسعار تسليم أرض المصنع إسطنبول، غير شاملة ` +
    `الضريبة والشحن.`,
};

const SEO_TITLE: Record<Locale, (v: Record<string, string>) => string> = {
  en: (v) => `${v.name} | Wholesale & Private Label | THE CHAMP GLOBAL`,
  tr: (v) => `${v.name} | Toptan ve Private Label Üretim | THE CHAMP GLOBAL`,
  de: (v) => `${v.name} | Großhandel & Private Label | THE CHAMP GLOBAL`,
  ar: (v) => `${v.name} | الجملة والعلامة الخاصة | THE CHAMP GLOBAL`,
};

const SEO_DESC: Record<Locale, (v: Record<string, string>) => string> = {
  en: (v) =>
    `${v.name} from a Turkish knitwear manufacturer. Wholesale and OEM production, ` +
    `private label, MOQ ${v.moq} pcs${v.sizes ? `, sizes ${v.sizes}` : ""}. ` +
    `Request a quotation from THE CHAMP GLOBAL, Istanbul.`,
  tr: (v) =>
    `${v.name} — Türk örme tekstil üreticisinden toptan ve OEM üretim, private label, ` +
    `MOQ ${v.moq} adet${v.sizes ? `, ${v.sizes} beden` : ""}. THE CHAMP GLOBAL, İstanbul.`,
  de: (v) =>
    `${v.name} vom türkischen Strickwarenhersteller. Großhandel und OEM-Produktion, ` +
    `Private Label, MOQ ${v.moq} Stück${v.sizes ? `, Größen ${v.sizes}` : ""}. ` +
    `Angebot anfordern bei THE CHAMP GLOBAL, Istanbul.`,
  ar: (v) =>
    `${v.name} من مصنّع تريكو تركي. إنتاج بالجملة و OEM، علامة خاصة، الحد الأدنى ${v.moq} قطعة` +
    `${v.sizes ? `، المقاسات ${v.sizes}` : ""}. اطلب عرض سعر من THE CHAMP GLOBAL، إسطنبول.`,
};

export type ProductCopy = {
  shortDescription: L10n;
  description: L10n;
  seoTitle: L10n;
  seoDescription: L10n;
};

export function buildProductCopy(input: DescribeInput): ProductCopy {
  const shortDescription = {} as L10n;
  const description = {} as L10n;
  const seoTitle = {} as L10n;
  const seoDescription = {} as L10n;

  for (const locale of LOCALES) {
    const colourNames = list(
      input.colorNames.slice(0, 6).map((c) => c[locale]),
      locale,
    );
    const v: Record<string, string> = {
      name: input.name[locale],
      category: input.categoryName[locale],
      section: input.sectionName[locale],
      fabric: input.fabric ? input.fabric[locale] : "",
      details: list(
        input.details.map((d) => d[locale]),
        locale,
      ),
      colours: COLOURS_PHRASE[locale](input.colorCount, colourNames),
      sizes: input.sizeRange ?? "",
      moq: String(input.moq),
    };

    shortDescription[locale] = SHORT[locale](v).replace(/\s+/g, " ").trim();
    description[locale] = LONG[locale](v)
      .split("\n\n")
      .map((p) => p.replace(/[ \t]+/g, " ").trim())
      .join("\n\n");
    seoTitle[locale] = SEO_TITLE[locale](v).slice(0, 70);
    seoDescription[locale] = SEO_DESC[locale](v).replace(/\s+/g, " ").trim().slice(0, 165);
  }

  return { shortDescription, description, seoTitle, seoDescription };
}
