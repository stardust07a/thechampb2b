import "server-only";
import { cache } from "react";

import { prisma } from "./prisma";
import type { Locale } from "@/i18n/routing";
import { SECTION_LABELS, SUBCATEGORY_LABELS, colorLabel, label } from "./taxonomy";

/**
 * Public ürün sorguları.
 *
 * GÜVENLİK KURALI (brief §6.2/6, §17.12): `sourceUrl` ve `retailTry` Trendyol
 * perakende bilgisidir ve HİÇBİR public yanıtta yer alamaz. Bu dosyadaki tüm
 * sorgular açık `select` kullanır ve bu iki alanı asla seçmez. Yeni bir public
 * sorgu eklerken aynı kurala uy — `include` ile tüm modeli çekme.
 */

/** Public ürün seçimi — bu nesne dışına çıkan bir alan olmamalı. */
const publicProductSelect = (locale: Locale) =>
  ({
    id: true,
    productCode: true,
    slug: true,
    section: true,
    audience: true,
    subcategory: true,
    gsm: true,
    moq: true,
    leadTimeDays: true,
    privateLabel: true,
    fabric: true,
    packaging: true,
    printType: true,
    price100: true,
    price300: true,
    price500: true,
    price1000: true,
    priceEurOverride: true,
    isBestSeller: true,
    isFeatured: true,
    isNew: true,
    sortOrder: true,
    createdAt: true,
    category: {
      select: {
        slug: true,
        gsm: true,
        moq: true,
        leadTimeDays: true,
        privateLabel: true,
        fabric: true,
        packaging: true,
        printType: true,
        price100: true,
        price300: true,
        price500: true,
        price1000: true,
        translations: {
          where: { locale },
          select: { name: true, description: true, seoTitle: true, seoDescription: true },
        },
      },
    },
    translations: {
      where: { locale },
      select: {
        name: true,
        shortDescription: true,
        description: true,
        seoTitle: true,
        seoDescription: true,
      },
    },
    variants: {
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        color: true,
        colorTr: true,
        colorHex: true,
        sizes: true,
        images: true,
        sortOrder: true,
      },
    },
  }) as const;

export type PublicProduct = Awaited<ReturnType<typeof getProductBySlug>>;

/** Kart için hafif seçim — sadece ilk varyantın ilk görseli çekilir. */
const cardProductSelect = (locale: Locale) =>
  ({
    id: true,
    productCode: true,
    slug: true,
    section: true,
    subcategory: true,
    isNew: true,
    isBestSeller: true,
    price100: true,
    price300: true,
    price500: true,
    price1000: true,
    priceEurOverride: true,
    category: {
      select: {
        slug: true,
        price100: true,
        price300: true,
        price500: true,
        price1000: true,
        translations: { where: { locale }, select: { name: true } },
      },
    },
    translations: { where: { locale }, select: { name: true } },
    variants: {
      orderBy: { sortOrder: "asc" },
      select: { color: true, colorHex: true, images: true, sizes: true },
    },
  }) as const;

export type ProductCardData = Awaited<ReturnType<typeof listProducts>>["items"][number];

export const getCategories = cache(async (locale: Locale) =>
  prisma.category.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: {
      slug: true,
      coverImage: true,
      translations: {
        where: { locale },
        select: { name: true, description: true, seoTitle: true, seoDescription: true },
      },
      _count: { select: { products: { where: { status: "published" } } } },
    },
  }),
);

export const getCategoryBySlug = cache(async (slug: string, locale: Locale) =>
  prisma.category.findUnique({
    where: { slug },
    select: {
      slug: true,
      coverImage: true,
      active: true,
      translations: {
        where: { locale },
        select: { name: true, description: true, seoTitle: true, seoDescription: true },
      },
      _count: { select: { products: { where: { status: "published" } } } },
    },
  }),
);

export const getProductBySlug = cache(async (slug: string, locale: Locale) =>
  prisma.product.findFirst({
    where: { slug, status: "published" },
    select: publicProductSelect(locale),
  }),
);

/* ------------------------------------------------------------------ liste */

export type ProductFilters = {
  q?: string;
  category?: string;
  section?: string;
  subcategory?: string;
  color?: string;
  size?: string;
  sort?: "newest" | "bestsellers" | "price" | "alpha";
  page?: number;
  perPage?: number;
};

// Masaüstündeki 5 sütunlu katalogda ilk ekran 7 tam sıra gösterir.
export const PER_PAGE = 35;

/**
 * "Load more" sunucudan biriktirerek çalışır: sayfa numarası URL'e yazılır ve
 * o sayfaya kadarki tüm ürünler tek istekte gelir. Üst sınır olmadan 819 ürün
 * tek DOM'a basılır (brief §17.2), bu yüzden 12 tıklamada duruyor; ötesinde
 * kullanıcı filtreye yönlendiriliyor.
 */
export const MAX_ACCUMULATED = PER_PAGE * 12;

/** Katalog listesi — sayfalama zorunlu (brief §4.2, §17.2). */
export async function listProducts(locale: Locale, filters: ProductFilters = {}) {
  const perPage = Math.min(filters.perPage ?? PER_PAGE, MAX_ACCUMULATED);
  const page = Math.max(1, filters.page ?? 1);

  const where: Record<string, unknown> = { status: "published" };

  if (filters.category) where.category = { slug: filters.category };
  if (filters.section) where.section = filters.section;
  if (filters.subcategory) where.subcategory = filters.subcategory;

  const and: unknown[] = [];

  if (filters.color) {
    and.push({ variants: { some: { color: { contains: filters.color, mode: "insensitive" } } } });
  }
  if (filters.size) {
    and.push({ variants: { some: { sizes: { has: filters.size } } } });
  }
  if (filters.q) {
    const q = filters.q.trim();
    and.push({
      OR: [
        { productCode: { contains: q, mode: "insensitive" } },
        { modelCode: { contains: q, mode: "insensitive" } },
        { slug: { contains: q.toLowerCase().replace(/\s+/g, "-") } },
        { translations: { some: { name: { contains: q, mode: "insensitive" } } } },
        { category: { translations: { some: { name: { contains: q, mode: "insensitive" } } } } },
        { variants: { some: { color: { contains: q, mode: "insensitive" } } } },
        { variants: { some: { colorTr: { contains: q, mode: "insensitive" } } } },
      ],
    });
  }
  if (and.length) where.AND = and;

  const orderBy = (() => {
    switch (filters.sort) {
      case "bestsellers":
        return [{ isBestSeller: "desc" as const }, { sortOrder: "asc" as const }];
      case "price":
        // fiyat girilmemişse null'lar sona
        return [{ price1000: { sort: "asc" as const, nulls: "last" as const } }];
      case "alpha":
        return [{ slug: "asc" as const }];
      default:
        // sortOrder Excel satır sırasıdır: 0 = en üstteki = en yeni
        return [{ sortOrder: "asc" as const }];
    }
  })();

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where: where as never,
      orderBy: orderBy as never,
      skip: (page - 1) * perPage,
      take: perPage,
      select: cardProductSelect(locale),
    }),
    prisma.product.count({ where: where as never }),
  ]);

  return { items, total, page, perPage, hasMore: page * perPage < total };
}

/** Ana sayfa bölümleri — panelden seçilir; seçim yoksa makul bir varsayılan. */
export async function getHomeSection(key: string, locale: Locale) {
  const section = await prisma.homeSection.findUnique({ where: { key } });
  if (!section || !section.enabled) return null;

  const ids = section.productIds;
  const flag =
    key === "bestsellers"
      ? { isBestSeller: true }
      : key === "featured"
        ? { isFeatured: true }
        : { isNew: true };

  const products = await prisma.product.findMany({
    where:
      ids.length > 0
        ? { id: { in: ids }, status: "published" }
        : { ...flag, status: "published" },
    take: section.limit,
    select: cardProductSelect(locale),
  });

  // panelde belirlenen sıra korunur
  const ordered =
    ids.length > 0
      ? ids.map((id) => products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => Boolean(p))
      : products;

  if (ordered.length === 0) return null;

  const titles = section.titles as Record<string, string>;
  return { key, title: titles[locale] ?? titles.en ?? key, products: ordered };
}

/** Ürün detayında "ilgili ürünler" — aynı kategori, farklı model. */
export async function getRelatedProducts(
  categorySlug: string,
  excludeId: string,
  locale: Locale,
  take = 4,
) {
  return prisma.product.findMany({
    where: { status: "published", category: { slug: categorySlug }, id: { not: excludeId } },
    take,
    orderBy: { sortOrder: "asc" },
    select: cardProductSelect(locale),
  });
}

/** Katalog filtre panelini beslemek için mevcut değerler. */
export const getFilterFacets = cache(async (locale: Locale) => {
  const [categories, sections, subcategories, variants] = await Promise.all([
    getCategories(locale),
    prisma.product.groupBy({
      by: ["section"],
      where: { status: "published" },
      _count: { _all: true },
    }),
    prisma.product.groupBy({
      by: ["subcategory"],
      where: { status: "published", subcategory: { not: null } },
      _count: { _all: true },
    }),
    prisma.variant.findMany({
      where: { product: { status: "published" } },
      select: { color: true, colorHex: true, sizes: true },
    }),
  ]);

  const colorMap = new Map<string, { name: string; hex: string | null; count: number }>();
  const sizeSet = new Map<string, number>();
  for (const v of variants) {
    const key = v.color;
    const hit = colorMap.get(key);
    if (hit) hit.count += 1;
    else colorMap.set(key, { name: v.color, hex: v.colorHex, count: 1 });
    for (const s of v.sizes) sizeSet.set(s, (sizeSet.get(s) ?? 0) + 1);
  }

  const ADULT = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"];
  const KIDS = ["4-5", "6-7", "8-9", "10-11", "12-13", "14-15"];
  const sizeOrder = [...ADULT, ...KIDS];

  // Filtrenin URL'e yazdığı DEĞER kanonik İngilizce kalır (filtre çalışsın diye);
  // kullanıcıya gösterilen ETİKET seçili dile çevrilir.
  return {
    categories,
    sections: sections
      .map((s) => ({
        value: s.section,
        label: label(SECTION_LABELS, s.section, locale),
        count: s._count._all,
      }))
      .sort((a, b) => b.count - a.count),
    subcategories: subcategories
      .map((s) => ({
        value: s.subcategory as string,
        label: label(SUBCATEGORY_LABELS, s.subcategory as string, locale),
        count: s._count._all,
      }))
      .sort((a, b) => b.count - a.count),
    colors: [...colorMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 24)
      .map((c) => ({ ...c, label: colorLabel(c.name, locale) })),
    sizes: [...sizeSet.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => {
        const ia = sizeOrder.indexOf(a.value);
        const ib = sizeOrder.indexOf(b.value);
        if (ia === -1 && ib === -1) return b.count - a.count;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      }),
  };
});
