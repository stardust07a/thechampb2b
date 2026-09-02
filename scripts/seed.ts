/**
 * data/products.normalized.json -> veritabani.
 *
 * Fiyatlar BOS birakilir (brief SS7: ilk surum kararidir). Kategori uretim
 * varsayilanlari burada tanimlanir; panelden ve Excel'den ustune yazilir.
 *
 * Idempotent: tekrar calistirilabilir (upsert).
 * Calistir: npm run db:seed
 */

import "dotenv/config";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { CATEGORY_NAMES, LOCALES } from "./lib/lexicon";
import type { L10n } from "./lib/lexicon";

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`${key} tanımlı değil — .env dosyasını kontrol edin`);
  return v;
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireEnv("DATABASE_URL") }),
});
const ROOT = resolve(import.meta.dirname, "..");

const data = JSON.parse(
  readFileSync(resolve(ROOT, "data/products.normalized.json"), "utf8"),
) as {
  categories: { slug: string; order: number; productCount: number; names: L10n }[];
  products: Array<{
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
    variants: Array<{
      color: string;
      colorTr: string;
      colorDe: string;
      colorAr: string;
      colorHex: string | null;
      colorSlug: string;
      sizes: string[];
      sourceImages: string[];
      sortOrder: number;
    }>;
    imageCount: number;
    sourceUrl: string | null;
    retailTry: number | null;
    importWarnings: string[];
  }>;
};

/* -------------------------------------------------- kategori varsayilanlari
   Fiyat alanlari bilerek bos. Uretim bilgileri kategori bazli makul
   varsayilanlardir; kullanici Excel/panelden gunceller (brief SS6.2/7). */

type CategoryDefaults = {
  fabric: L10n;
  gsm: number;
  moq: number;
  leadTimeDays: string;
  printType: L10n;
};

const KNIT_JERSEY: L10n = {
  en: "100% cotton single jersey",
  tr: "%100 pamuk süprem",
  de: "100 % Baumwolle Single Jersey",
  ar: "قطن 100% جيرسيه",
};
/** 3 iplik bileşimi — kullanıcı tarafından verildi. */
const FLEECE: L10n = {
  en: "65% cotton, 35% polyviscose — 3-thread brushed fleece",
  tr: "%65 pamuk, %35 poliviskon — 3 iplik şardonlu",
  de: "65 % Baumwolle, 35 % Polyviskose — 3-Faden angeraut",
  ar: "65% قطن، 35% بولي فيسكوز — ثلاثة خيوط مكشّط",
};
const PIQUE: L10n = {
  en: "Cotton pique",
  tr: "Pamuk pike",
  de: "Baumwoll-Piqué",
  ar: "بيكيه قطني",
};
const VISCOSE: L10n = {
  en: "Viscose blend",
  tr: "Viskon karışım",
  de: "Viskose-Mischung",
  ar: "مزيج فيسكوز",
};
const RIB: L10n = {
  en: "Ribbed cotton jersey",
  tr: "Fitilli pamuk kaşkorse",
  de: "Gerippter Baumwolljersey",
  ar: "جيرسيه قطني مضلع",
};
const KNITWEAR_YARN: L10n = {
  en: "Acrylic / cotton knit yarn",
  tr: "Akrilik / pamuk triko ipliği",
  de: "Acryl-/Baumwoll-Strickgarn",
  ar: "خيط تريكو أكريليك/قطن",
};

const PRINT_DTG: L10n = {
  en: "Screen print, DTG, embroidery",
  tr: "Serigrafi, DTG, nakış",
  de: "Siebdruck, DTG, Stickerei",
  ar: "طباعة شاشية، DTG، تطريز",
};
const PRINT_EMB: L10n = {
  en: "Embroidery, woven label",
  tr: "Nakış, dokuma etiket",
  de: "Stickerei, Webetikett",
  ar: "تطريز، ملصق منسوج",
};

const PACKAGING: L10n = {
  en: "Individual polybag + master carton",
  tr: "Tekli poşet + koli",
  de: "Einzelpolybeutel + Umkarton",
  ar: "كيس مفرد + كرتونة",
};

const CATEGORY_DEFAULTS: Record<string, CategoryDefaults> = {
  tshirts: { fabric: KNIT_JERSEY, gsm: 190, moq: 500, leadTimeDays: "25-35", printType: PRINT_DTG },
  sweatshirts: { fabric: FLEECE, gsm: 320, moq: 500, leadTimeDays: "30-40", printType: PRINT_DTG },
  "polo-shirts": { fabric: PIQUE, gsm: 220, moq: 500, leadTimeDays: "30-40", printType: PRINT_EMB },
  tracksuits: { fabric: FLEECE, gsm: 320, moq: 500, leadTimeDays: "35-45", printType: PRINT_DTG },
  sweatpants: { fabric: FLEECE, gsm: 320, moq: 500, leadTimeDays: "30-40", printType: PRINT_DTG },
  "co-ord-sets": { fabric: KNIT_JERSEY, gsm: 240, moq: 500, leadTimeDays: "30-40", printType: PRINT_DTG },
  shorts: { fabric: KNIT_JERSEY, gsm: 240, moq: 500, leadTimeDays: "25-35", printType: PRINT_DTG },
  blouses: { fabric: VISCOSE, gsm: 160, moq: 500, leadTimeDays: "30-40", printType: PRINT_EMB },
  dresses: { fabric: VISCOSE, gsm: 180, moq: 500, leadTimeDays: "35-45", printType: PRINT_EMB },
  skirts: { fabric: VISCOSE, gsm: 180, moq: 500, leadTimeDays: "30-40", printType: PRINT_EMB },
  trousers: { fabric: VISCOSE, gsm: 220, moq: 500, leadTimeDays: "35-45", printType: PRINT_EMB },
  bodysuits: { fabric: RIB, gsm: 200, moq: 500, leadTimeDays: "30-40", printType: PRINT_EMB },
  shirts: { fabric: VISCOSE, gsm: 130, moq: 500, leadTimeDays: "35-45", printType: PRINT_EMB },
  jackets: { fabric: FLEECE, gsm: 400, moq: 500, leadTimeDays: "40-50", printType: PRINT_EMB },
  knitwear: { fabric: KNITWEAR_YARN, gsm: 300, moq: 500, leadTimeDays: "40-50", printType: PRINT_EMB },
  leggings: { fabric: RIB, gsm: 220, moq: 500, leadTimeDays: "30-40", printType: PRINT_EMB },
};

/* ----------------------------------------------------------- SEO metinleri */

function categoryDescription(names: L10n, locale: keyof L10n): string {
  const n = names[locale].toLocaleLowerCase(locale === "tr" ? "tr" : "en");
  const map: Record<string, string> = {
    en: `Wholesale ${n} manufactured in Istanbul by THE CHAMP GLOBAL. Private label and OEM production for international buyers, distributors and brand owners. Minimum order 500 pcs; custom logo print and custom design from 1,000 pcs.`,
    tr: `THE CHAMP GLOBAL tarafından İstanbul'da üretilen toptan ${names.tr.toLocaleLowerCase("tr")} koleksiyonu. Uluslararası alıcılar, distribütörler ve marka sahipleri için private label ve OEM üretim. Minimum sipariş 500 adet; logo baskı ve özel tasarım 1.000 adetten başlar.`,
    de: `Großhandel ${names.de} aus eigener Produktion in Istanbul von THE CHAMP GLOBAL. Private Label und OEM-Fertigung für internationale Einkäufer, Distributoren und Markeninhaber. Mindestbestellmenge 500 Stück; Logodruck und Sonderdesign ab 1.000 Stück.`,
    ar: `${names.ar} بالجملة من إنتاج THE CHAMP GLOBAL في إسطنبول. إنتاج بالعلامة الخاصة و OEM للمشترين الدوليين والموزعين وأصحاب العلامات التجارية. الحد الأدنى للطلب 500 قطعة، وطباعة الشعار والتصميم الخاص من 1,000 قطعة.`,
  };
  return map[locale];
}

function categorySeoTitle(names: L10n, locale: keyof L10n): string {
  const map: Record<string, string> = {
    en: `${names.en} Manufacturer & Wholesale Supplier | THE CHAMP GLOBAL`,
    tr: `${names.tr} Üreticisi ve Toptan Tedarikçi | THE CHAMP GLOBAL`,
    de: `${names.de} Hersteller & Großhandel | THE CHAMP GLOBAL`,
    ar: `مصنّع ${names.ar} ومورد بالجملة | THE CHAMP GLOBAL`,
  };
  return map[locale].slice(0, 70);
}

function categorySeoDescription(names: L10n, locale: keyof L10n, count: number): string {
  const map: Record<string, string> = {
    en: `Turkish ${names.en.toLocaleLowerCase("en")} manufacturer. ${count} styles, wholesale and private label production, MOQ 500 pcs, EXW Istanbul. Request a quotation.`,
    tr: `Türk ${names.tr.toLocaleLowerCase("tr")} üreticisi. ${count} model, toptan ve private label üretim, MOQ 500 adet, EXW İstanbul. Teklif isteyin.`,
    de: `Türkischer ${names.de} Hersteller. ${count} Modelle, Großhandel und Private Label, MOQ 500 Stück, EXW Istanbul. Angebot anfordern.`,
    ar: `مصنّع ${names.ar} تركي. ${count} موديل، إنتاج بالجملة وبالعلامة الخاصة، الحد الأدنى 500 قطعة، تسليم أرض المصنع إسطنبول.`,
  };
  return map[locale].slice(0, 165);
}

/* ---------------------------------------------------------------- ayarlar */

const SETTINGS: Record<string, unknown> = {
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

/* -------------------------------------------------------------------- ana */

async function main() {
  console.log("→ kategoriler");
  const categoryIdBySlug = new Map<string, string>();

  for (const c of data.categories) {
    const d = CATEGORY_DEFAULTS[c.slug];
    const category = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {
        order: c.order,
        fabric: d?.fabric ?? undefined,
        gsm: d?.gsm ?? null,
        moq: d?.moq ?? 500,
        leadTimeDays: d?.leadTimeDays ?? null,
        packaging: PACKAGING,
        privateLabel: true,
        printType: d?.printType ?? undefined,
      },
      create: {
        slug: c.slug,
        order: c.order,
        active: true,
        fabric: d?.fabric ?? undefined,
        gsm: d?.gsm ?? null,
        moq: d?.moq ?? 500,
        leadTimeDays: d?.leadTimeDays ?? null,
        packaging: PACKAGING,
        privateLabel: true,
        printType: d?.printType ?? undefined,
        // fiyatlar bilerek bos - brief SS7
      },
    });
    categoryIdBySlug.set(c.slug, category.id);

    const names = CATEGORY_NAMES[c.slug] ?? c.names;
    for (const locale of LOCALES) {
      await prisma.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: category.id, locale } },
        update: {
          name: names[locale],
          description: categoryDescription(names, locale),
          seoTitle: categorySeoTitle(names, locale),
          seoDescription: categorySeoDescription(names, locale, c.productCount),
        },
        create: {
          categoryId: category.id,
          locale,
          name: names[locale],
          description: categoryDescription(names, locale),
          seoTitle: categorySeoTitle(names, locale),
          seoDescription: categorySeoDescription(names, locale, c.productCount),
        },
      });
    }
  }
  console.log(`  ${data.categories.length} kategori`);

  console.log("→ ürünler");
  let i = 0;
  for (const p of data.products) {
    const categoryId = categoryIdBySlug.get(p.categorySlug);
    if (!categoryId) {
      console.warn(`  ! kategori yok: ${p.categorySlug} (${p.productCode})`);
      continue;
    }

    const product = await prisma.product.upsert({
      where: { productCode: p.productCode },
      update: {
        slug: p.slug,
        categoryId,
        subcategory: p.subcategory,
        section: p.section,
        audience: p.audience,
        status: p.status,
        fabric: p.fabric ?? undefined,
        sourceUrl: p.sourceUrl,
        retailTry: p.retailTry ?? null,
        importWarnings: p.importWarnings,
      },
      create: {
        productCode: p.productCode,
        modelCode: p.modelCode,
        slug: p.slug,
        categoryId,
        subcategory: p.subcategory,
        section: p.section,
        audience: p.audience,
        status: p.status,
        fabric: p.fabric ?? undefined,
        sortOrder: i,
        sourceUrl: p.sourceUrl,
        retailTry: p.retailTry ?? null,
        importWarnings: p.importWarnings,
        // fiyat / gsm / moq / termin bos -> kategoriden devralinir
      },
    });

    for (const locale of LOCALES) {
      const t = p.translations[locale];
      await prisma.productTranslation.upsert({
        where: { productId_locale: { productId: product.id, locale } },
        update: t,
        create: { productId: product.id, locale, ...t },
      });
    }

    // varyantlar tam degistirilir (gorsel yollari yeniden uretiliyor)
    await prisma.variant.deleteMany({ where: { productId: product.id } });
    await prisma.variant.createMany({
      data: p.variants.map((v) => ({
        productId: product.id,
        color: v.color,
        colorTr: v.colorTr,
        colorHex: v.colorHex,
        sizes: v.sizes,
        // kendi medya anahtarlarimiz - Trendyol URL'i DB'ye hic girmiyor
        images: v.sourceImages.map(
          (_, idx) => `${p.productCode}/${v.colorSlug}/${idx + 1}.webp`,
        ),
        sortOrder: v.sortOrder,
      })),
    });

    if (++i % 100 === 0) console.log(`  ${i}/${data.products.length}`);
  }
  console.log(`  ${i} ürün`);

  console.log("→ ayarlar");
  for (const [key, value] of Object.entries(SETTINGS)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: value as never },
    });
  }

  console.log("→ ana sayfa bölümleri");
  const homeSections = [
    {
      key: "bestsellers",
      titles: {
        en: "Best Sellers",
        tr: "Çok Satanlar",
        de: "Bestseller",
        ar: "الأكثر مبيعاً",
      },
    },
    {
      key: "featured",
      titles: {
        en: "Featured Products",
        tr: "Öne Çıkan Ürünler",
        de: "Ausgewählte Produkte",
        ar: "منتجات مميزة",
      },
    },
    {
      key: "new",
      titles: { en: "New Arrivals", tr: "Yeni Gelenler", de: "Neuheiten", ar: "وصل حديثاً" },
    },
  ];
  for (const s of homeSections) {
    await prisma.homeSection.upsert({
      where: { key: s.key },
      update: {},
      create: { key: s.key, enabled: true, limit: 8, titles: s.titles, productIds: [] },
    });
  }

  console.log("→ yönetici hesabı");
  const email = process.env.ADMIN_EMAIL ?? "admin@thechampb2b.com";
  const password = process.env.ADMIN_PASSWORD ?? "changeme-" + Math.random().toString(36).slice(2, 10);
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`  mevcut: ${email}`);
  } else {
    await prisma.adminUser.create({
      data: { email, passwordHash: await bcrypt.hash(password, 12), name: "Admin" },
    });
    console.log(`  oluşturuldu: ${email}`);
    if (!process.env.ADMIN_PASSWORD) {
      console.log(`  GEÇİCİ ŞİFRE: ${password}  ← ilk girişte değiştirin`);
    }
  }

  const counts = {
    kategori: await prisma.category.count(),
    urun: await prisma.product.count(),
    yayinda: await prisma.product.count({ where: { status: "published" } }),
    varyant: await prisma.variant.count(),
    ceviri: await prisma.productTranslation.count(),
  };
  console.log("\n✓ seed tamam", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
