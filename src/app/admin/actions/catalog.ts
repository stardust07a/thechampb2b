"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LOCALES } from "@/lib/locales";
import type { ActionResult } from "./products";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Yetkisiz");
}

/** Kategori verisi ana sayfa, katalog ve alt sayfalarda ortak kullanılıyor. */
function revalidateCategoryViews() {
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
}

/* ------------------------------------------------------------- kategori */

const decimalish = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v.replace(",", ".")))
  .refine((v) => v === null || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
    message: "Geçerli bir fiyat girin",
  });

export async function saveCategory(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const id = formData.get("id") ? String(formData.get("id")) : null;
  const slug = String(formData.get("slug") ?? "").trim();
  if (!/^[a-z0-9-]{2,}$/.test(slug)) {
    return { ok: false, message: "Slug sadece küçük harf, rakam ve tire içerebilir." };
  }

  const num = (key: string) => {
    const parsed = decimalish.safeParse(String(formData.get(key) ?? ""));
    return parsed.success ? parsed.data : null;
  };
  const int = (key: string) => {
    const raw = String(formData.get(key) ?? "").trim();
    return raw === "" ? null : Number.isInteger(Number(raw)) ? Number(raw) : null;
  };

  const l10n = (prefix: string) => {
    const out: Record<string, string> = {};
    for (const locale of LOCALES) {
      const value = String(formData.get(`${prefix}.${locale}`) ?? "").trim();
      if (value) out[locale] = value;
    }
    return Object.keys(out).length ? out : undefined;
  };

  const data = {
    slug,
    order: int("order") ?? 0,
    active: formData.get("active") === "on",
    gsm: int("gsm"),
    moq: int("moq"),
    leadTimeDays: String(formData.get("leadTimeDays") ?? "").trim() || null,
    privateLabel: formData.get("privateLabel") === "on",
    price100: num("price100"),
    price300: num("price300"),
    price500: num("price500"),
    price1000: num("price1000"),
    fabric: l10n("fabric"),
    packaging: l10n("packaging"),
    printType: l10n("printType"),
  };

  try {
    const category = id
      ? await prisma.category.update({ where: { id }, data })
      : await prisma.category.create({ data });

    for (const locale of LOCALES) {
      const name = String(formData.get(`name.${locale}`) ?? "").trim();
      if (!name) continue;
      const payload = {
        name,
        description: String(formData.get(`description.${locale}`) ?? "").trim() || null,
        seoTitle: String(formData.get(`seoTitle.${locale}`) ?? "").trim() || null,
        seoDescription: String(formData.get(`seoDescription.${locale}`) ?? "").trim() || null,
      };
      await prisma.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: category.id, locale } },
        update: payload,
        create: { categoryId: category.id, locale, ...payload },
      });
    }

    revalidateCategoryViews();
    return { ok: true, message: id ? "Kategori güncellendi." : "Kategori oluşturuldu." };
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("Unique")
        ? "Bu slug zaten kullanılıyor."
        : "Kaydedilemedi.";
    return { ok: false, message };
  }
}

export async function reorderCategories(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  await prisma.$transaction(
    ids.map((id, index) => prisma.category.update({ where: { id }, data: { order: index } })),
  );
  revalidateCategoryViews();
  return { ok: true, message: "Sıralama kaydedildi." };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    // Ürünleri yanlışlıkla silmek yerine kategoriyi tüm vitrinden kaldır.
    // Ürünler başka kategoriye taşındıktan sonra ikinci silme kalıcı olur.
    await prisma.category.update({ where: { id }, data: { active: false } });
    revalidateCategoryViews();
    return {
      ok: true,
      message: `Kategori, içindeki ${count} ürün korunarak vitrinden kaldırıldı. Ürünü taşıdıktan sonra tamamen silebilirsiniz.`,
    };
  }
  await prisma.category.delete({ where: { id } });
  revalidateCategoryViews();
  return { ok: true, message: "Kategori silindi." };
}

/* ---------------------------------------------------- ana sayfa bölümleri */

export async function saveHomeSection(
  key: string,
  payload: { enabled: boolean; limit: number; titles: Record<string, string>; productIds: string[] },
): Promise<ActionResult> {
  await requireAdmin();

  if (!["bestsellers", "featured", "new"].includes(key)) {
    return { ok: false, message: "Geçersiz bölüm." };
  }

  await prisma.homeSection.upsert({
    where: { key },
    update: {
      enabled: payload.enabled,
      limit: Math.min(Math.max(payload.limit, 1), 24),
      titles: payload.titles,
      productIds: payload.productIds,
    },
    create: {
      key,
      enabled: payload.enabled,
      limit: Math.min(Math.max(payload.limit, 1), 24),
      titles: payload.titles,
      productIds: payload.productIds,
    },
  });

  // Rozetleri de senkronla: seçilen ürünler ilgili bayrağı taşısın
  const flag =
    key === "bestsellers" ? "isBestSeller" : key === "featured" ? "isFeatured" : "isNew";
  await prisma.product.updateMany({ where: { [flag]: true } as never, data: { [flag]: false } as never });
  if (payload.productIds.length > 0) {
    await prisma.product.updateMany({
      where: { id: { in: payload.productIds } },
      data: { [flag]: true } as never,
    });
  }

  revalidatePath("/admin/home");
  revalidatePath("/[locale]", "page");
  return { ok: true, message: "Bölüm kaydedildi." };
}

/** Ana sayfa bölümüne eklemek için ürün arama. */
export async function searchProducts(query: string) {
  await requireAdmin();
  const q = query.trim();
  if (q.length < 2) return [];

  const products = await prisma.product.findMany({
    where: {
      status: "published",
      OR: [
        { productCode: { contains: q, mode: "insensitive" } },
        { translations: { some: { name: { contains: q, mode: "insensitive" } } } },
      ],
    },
    take: 12,
    select: {
      id: true,
      productCode: true,
      slug: true,
      translations: { where: { locale: "tr" }, select: { name: true } },
      variants: { take: 1, orderBy: { sortOrder: "asc" }, select: { images: true } },
    },
  });

  return products.map((p) => ({
    id: p.id,
    productCode: p.productCode,
    name: p.translations[0]?.name ?? p.slug,
    imageKey: p.variants[0]?.images[0] ?? null,
  }));
}

/* ------------------------------------------------------- teklif talepleri */

export async function updateInquiry(
  id: string,
  patch: { status?: string; adminNote?: string },
): Promise<ActionResult> {
  await requireAdmin();

  const data: Record<string, unknown> = {};
  if (patch.status) {
    if (!["new", "in_progress", "quoted", "closed"].includes(patch.status)) {
      return { ok: false, message: "Geçersiz durum." };
    }
    data.status = patch.status;
  }
  if (patch.adminNote !== undefined) data.adminNote = patch.adminNote.trim() || null;

  if (Object.keys(data).length === 0) return { ok: false, message: "Değişiklik yok." };

  await prisma.inquiry.update({ where: { id }, data: data as never });
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${id}`);
  return { ok: true, message: "Kaydedildi." };
}

/* ---------------------------------------------------------------- ayarlar */

export async function saveSettings(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const text = (k: string) => String(formData.get(k) ?? "").trim();
  const numOrNull = (k: string) => {
    const raw = text(k);
    return raw === "" ? null : Number(raw.replace(",", "."));
  };

  const entries: [string, unknown][] = [
    ["eurRate", numOrNull("eurRate") ?? 0.92],
    ["whatsappNumber", text("whatsappNumber")],
    ["phone", text("phone")],
    ["inquiryEmail", text("inquiryEmail")],
    ["telegram", text("telegram")],
    ["address", text("address")],
    ["foundedYear", numOrNull("foundedYear") ?? 2021],
    ["monthlyCapacity", numOrNull("monthlyCapacity")],
    ["exportCountries", numOrNull("exportCountries")],
    ["moqPieces", numOrNull("moqPieces") ?? 500],
    ["customDesignFrom", numOrNull("customDesignFrom") ?? 1000],
    ["logoPrintFrom", numOrNull("logoPrintFrom") ?? 1000],
    ["labelChangeFrom", numOrNull("labelChangeFrom") ?? 1000],
    ["sampleLeadTimeDays", text("sampleLeadTimeDays") || null],
    ["bulkLeadTimeDays", text("bulkLeadTimeDays") || null],
    ["defaultCurrency", text("defaultCurrency") === "EUR" ? "EUR" : "USD"],
    [
      "social",
      {
        instagram: text("social.instagram"),
        linkedin: text("social.linkedin"),
        facebook: text("social.facebook"),
      },
    ],
    [
      "certificates",
      text("certificates")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ],
  ];

  const email = text("inquiryEmail");
  if (email && !z.email().safeParse(email).success) {
    return { ok: false, message: "Geçerli bir e-posta adresi girin." };
  }

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: value as never },
        create: { key, value: value as never },
      }),
    ),
  );

  revalidatePath("/admin/settings");
  revalidatePath("/[locale]", "layout");
  return { ok: true, message: "Ayarlar kaydedildi." };
}
