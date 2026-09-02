"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseWorkbook, type ParsedWorkbook, type RowIssue } from "@/lib/excel";

/**
 * Excel yükleme — brief §6.3.
 * İki adım: önce ÖNİZLEME (hiçbir şey yazılmaz), sonra UYGULA (tek transaction).
 * Yarım kalma olmaz: transaction ya tamamen geçer ya hiç geçmez.
 */

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Yetkisiz");
}

export type ImportPreview = {
  ok: true;
  sheetsFound: string[];
  categoryPrices: { willUpdate: number; unknownSlugs: string[] };
  categoryProduction: { willUpdate: number; unknownSlugs: string[] };
  products: { willUpdate: number; unknownCodes: string[] };
  settings: { willUpdate: number; keys: string[] };
  issues: RowIssue[];
  /** Uygulama adımında yeniden ayrıştırmamak için serileştirilmiş veri. */
  payload: string;
};

export type ImportPreviewResult = ImportPreview | { ok: false; message: string };

const MAX_BYTES = 10 * 1024 * 1024;

export async function previewImport(formData: FormData): Promise<ImportPreviewResult> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, message: "Dosya seçilmedi." };
  if (file.size === 0) return { ok: false, message: "Dosya boş." };
  if (file.size > MAX_BYTES) return { ok: false, message: "Dosya 10 MB'tan büyük." };
  if (!/\.(xlsx|xlsm)$/i.test(file.name)) {
    return { ok: false, message: "Sadece .xlsx dosyası yükleyin." };
  }

  let parsed: ParsedWorkbook;
  try {
    parsed = await parseWorkbook(await file.arrayBuffer());
  } catch {
    return { ok: false, message: "Dosya okunamadı. Excel biçimini kontrol edin." };
  }

  // Hangi slug / kod veritabanında var?
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ select: { slug: true } }),
    prisma.product.findMany({ select: { productCode: true } }),
  ]);
  const knownSlugs = new Set(categories.map((c) => c.slug));
  const knownCodes = new Set(products.map((p) => p.productCode));

  const priceUnknown = parsed.categoryPrices
    .filter((r) => !knownSlugs.has(r.slug))
    .map((r) => r.slug);
  const productionUnknown = parsed.categoryProduction
    .filter((r) => !knownSlugs.has(r.slug))
    .map((r) => r.slug);
  const codeUnknown = parsed.products
    .filter((r) => !knownCodes.has(r.productCode))
    .map((r) => r.productCode);

  return {
    ok: true,
    sheetsFound: parsed.sheetsFound,
    categoryPrices: {
      willUpdate: parsed.categoryPrices.length - priceUnknown.length,
      unknownSlugs: [...new Set(priceUnknown)],
    },
    categoryProduction: {
      willUpdate: parsed.categoryProduction.length - productionUnknown.length,
      unknownSlugs: [...new Set(productionUnknown)],
    },
    products: {
      willUpdate: parsed.products.length - codeUnknown.length,
      unknownCodes: [...new Set(codeUnknown)].slice(0, 50),
    },
    settings: {
      willUpdate: parsed.settings.length,
      keys: parsed.settings.map((s) => s.key),
    },
    issues: parsed.issues,
    payload: JSON.stringify({
      categoryPrices: parsed.categoryPrices,
      categoryProduction: parsed.categoryProduction,
      products: parsed.products,
      settings: parsed.settings,
    }),
  };
}

export type ImportResult =
  | { ok: true; message: string; counts: Record<string, number> }
  | { ok: false; message: string };

export async function applyImport(payload: string): Promise<ImportResult> {
  await requireAdmin();

  let data: {
    categoryPrices: ParsedWorkbook["categoryPrices"];
    categoryProduction: ParsedWorkbook["categoryProduction"];
    products: ParsedWorkbook["products"];
    settings: ParsedWorkbook["settings"];
  };
  try {
    data = JSON.parse(payload);
  } catch {
    return { ok: false, message: "Önizleme verisi okunamadı, dosyayı yeniden yükleyin." };
  }

  const counts = { kategoriFiyat: 0, kategoriUretim: 0, urun: 0, ayar: 0 };

  try {
    await prisma.$transaction(async (tx) => {
      for (const row of data.categoryPrices) {
        const category = await tx.category.findUnique({ where: { slug: row.slug } });
        if (!category) continue;
        // sadece dolu gelen kademe yazılır; boş bırakılan mevcut değeri korur
        const patch: Record<string, unknown> = {};
        if (row.price100 !== null) patch.price100 = row.price100;
        if (row.price300 !== null) patch.price300 = row.price300;
        if (row.price500 !== null) patch.price500 = row.price500;
        if (row.price1000 !== null) patch.price1000 = row.price1000;
        if (Object.keys(patch).length === 0) continue;
        await tx.category.update({ where: { id: category.id }, data: patch as never });
        counts.kategoriFiyat++;
      }

      for (const row of data.categoryProduction) {
        const category = await tx.category.findUnique({ where: { slug: row.slug } });
        if (!category) continue;
        const patch: Record<string, unknown> = {};
        if (row.fabric) patch.fabric = row.fabric;
        if (row.gsm !== null) patch.gsm = row.gsm;
        if (row.moq !== null) patch.moq = row.moq;
        if (row.leadTimeDays) patch.leadTimeDays = row.leadTimeDays;
        if (row.packaging) patch.packaging = row.packaging;
        if (row.privateLabel !== null) patch.privateLabel = row.privateLabel;
        if (row.printType) patch.printType = row.printType;
        if (Object.keys(patch).length === 0) continue;
        await tx.category.update({ where: { id: category.id }, data: patch as never });
        counts.kategoriUretim++;
      }

      for (const row of data.products) {
        const product = await tx.product.findUnique({
          where: { productCode: row.productCode },
          select: { id: true },
        });
        if (!product) continue;
        const patch: Record<string, unknown> = {};
        if (row.price100 !== null) patch.price100 = row.price100;
        if (row.price300 !== null) patch.price300 = row.price300;
        if (row.price500 !== null) patch.price500 = row.price500;
        if (row.price1000 !== null) patch.price1000 = row.price1000;
        if (row.fabric) patch.fabric = row.fabric;
        if (row.gsm !== null) patch.gsm = row.gsm;
        if (row.moq !== null) patch.moq = row.moq;
        if (row.leadTimeDays) patch.leadTimeDays = row.leadTimeDays;
        if (Object.keys(patch).length === 0) continue;
        await tx.product.update({ where: { id: product.id }, data: patch as never });
        counts.urun++;
      }

      for (const row of data.settings) {
        await tx.setting.upsert({
          where: { key: row.key },
          update: { value: row.value as never },
          create: { key: row.key, value: row.value as never },
        });
        counts.ayar++;
      }
    });
  } catch (error) {
    console.error("[import] transaction hatası:", error);
    return {
      ok: false,
      message: "İşlem geri alındı, hiçbir kayıt değişmedi. Dosyayı kontrol edip tekrar deneyin.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/categories");
  revalidatePath("/[locale]", "layout");

  const total = counts.kategoriFiyat + counts.kategoriUretim + counts.urun + counts.ayar;
  return { ok: true, message: `${total} kayıt güncellendi.`, counts };
}
