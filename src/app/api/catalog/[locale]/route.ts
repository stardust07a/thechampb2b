import { existsSync } from "node:fs";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { resolvePrices, TIERS } from "@/lib/price";
import { LOCALES, type AppLocale } from "@/lib/locales";
import { pdfImagePath, renderCatalogPdf, type PdfCategory } from "@/lib/catalog-pdf";

/**
 * PDF katalog — brief §12.
 * `/api/catalog/en` tüm katalog, `?category=tshirts` tek kategori.
 * Üretimi ağır olduğu için sonuç bir saat önbelleğe alınır; panelden
 * "yeniden üret" butonu `?refresh=1` ile önbelleği atlar.
 */

export const runtime = "nodejs";
export const revalidate = 3600;
// Tam katalog ~8 MB / ~7 sn sürüyor; varsayılan 10 sn sınırı riskli.
export const maxDuration = 60;

// Basit bellek içi önbellek — aynı sunucu örneğinde tekrar üretmeyi önler
const cache = new Map<string, { buffer: Buffer; at: number }>();
const TTL_MS = 60 * 60 * 1000;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: raw } = await params;
  const locale = (LOCALES as readonly string[]).includes(raw)
    ? (raw as AppLocale)
    : "en";

  const url = new URL(request.url);
  const categorySlug = url.searchParams.get("category") ?? undefined;
  const cacheKey = `${locale}:${categorySlug ?? "all"}`;

  /**
   * Önbelleği atlamak PAHALI bir iştir (819 ürün, ~8 MB, ~7 sn). Herkese açık
   * olsaydı `?refresh=1` ile art arda istek atarak sunucu tüketilebilirdi.
   * Bu yüzden yalnızca oturum açmış yöneticiye izin veriliyor; panelde
   * "Yeniden üret" butonu zaten bu koşulu sağlıyor.
   */
  let refresh = false;
  if (url.searchParams.get("refresh") === "1") {
    const session = await auth();
    if (!session?.user) {
      return new Response("Önbellek yenileme yetkisi gerekir.", { status: 401 });
    }
    refresh = true;
  }

  const hit = cache.get(cacheKey);
  if (!refresh && hit && Date.now() - hit.at < TTL_MS) {
    return pdfResponse(hit.buffer, locale, categorySlug);
  }

  const settings = await getSettings();

  const categories = await prisma.category.findMany({
    where: {
      active: true,
      ...(categorySlug ? { slug: categorySlug } : {}),
      products: { some: { status: "published" } },
    },
    orderBy: { order: "asc" },
    select: {
      slug: true,
      price100: true,
      price300: true,
      price500: true,
      price1000: true,
      translations: { where: { locale }, select: { name: true } },
      products: {
        where: { status: "published" },
        orderBy: { sortOrder: "asc" },
        select: {
          productCode: true,
          slug: true,
          price100: true,
          price300: true,
          price500: true,
          price1000: true,
          priceEurOverride: true,
          translations: { where: { locale }, select: { name: true } },
          variants: { orderBy: { sortOrder: "asc" }, select: { color: true, sizes: true } },
        },
      },
    },
  });

  if (categories.length === 0) {
    return new Response("Katalogda yayında ürün yok.", { status: 404 });
  }

  const pdfCategories: PdfCategory[] = categories.map((category) => ({
    slug: category.slug,
    name: category.translations[0]?.name ?? category.slug,
    products: category.products.map((product) => {
      const prices = resolvePrices(
        product,
        category,
        settings.eurRate,
        product.priceEurOverride as Record<string, number> | null,
      );
      const sizes = [...new Set(product.variants.flatMap((v) => v.sizes))];
      const path = pdfImagePath(product.productCode);

      return {
        productCode: product.productCode,
        name: product.translations[0]?.name ?? product.slug,
        colours: product.variants.map((v) => v.color),
        sizeRange:
          sizes.length > 1 ? `${sizes[0]}–${sizes[sizes.length - 1]}` : (sizes[0] ?? null),
        prices: TIERS.map((tier) => ({ tier, value: prices.usd[tier] })),
        imagePath: existsSync(path) ? path : null,
      };
    }),
  }));

  const buffer = await renderCatalogPdf({
    locale,
    categories: pdfCategories,
    settings: {
      inquiryEmail: settings.inquiryEmail,
      phone: settings.phone,
      address: settings.address,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://thechampb2b.com",
      moqPieces: settings.moqPieces,
      logoPrintFrom: settings.logoPrintFrom,
      customDesignFrom: settings.customDesignFrom,
      labelChangeFrom: settings.labelChangeFrom,
    },
  });

  cache.set(cacheKey, { buffer, at: Date.now() });
  return pdfResponse(buffer, locale, categorySlug);
}

function pdfResponse(buffer: Buffer, locale: string, categorySlug?: string) {
  const name = categorySlug
    ? `the-champ-global-${categorySlug}-${locale}.pdf`
    : `the-champ-global-catalogue-${locale}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${name}"`,
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
