"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LOCALES } from "@/lib/locales";

/** Her eylem oturum kontrolünden geçer — panel dışından çağrılamaz. */
async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Yetkisiz");
  return session.user;
}

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string; fields?: Record<string, string> };

/* ------------------------------------------------------------ tekil ürün */

const decimalish = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v.replace(",", ".")))
  .refine((v) => v === null || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
    message: "Geçerli bir fiyat girin",
  });

const intish = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v)))
  .refine((v) => v === null || (Number.isInteger(v) && v >= 0), {
    message: "Tam sayı girin",
  });

const productSchema = z.object({
  id: z.string().optional(),
  productCode: z.string().trim().min(3, "Ürün kodu gerekli").max(64),
  modelCode: z.string().trim().max(64).optional(),
  slug: z.string().trim().min(2, "Slug gerekli").max(120),
  categoryId: z.string().min(1, "Kategori seçin"),
  subcategory: z.string().trim().max(60).optional(),
  section: z.enum(["Women", "Men", "Unisex", "Kids"]),
  audience: z.enum(["adult", "kids"]),
  status: z.enum(["published", "draft", "archived"]),
  gsm: intish,
  moq: intish,
  leadTimeDays: z.string().trim().max(40).optional(),
  privateLabel: z.enum(["inherit", "yes", "no"]),
  price100: decimalish,
  price300: decimalish,
  price500: decimalish,
  price1000: decimalish,
  isBestSeller: z.coerce.boolean(),
  isFeatured: z.coerce.boolean(),
  isNew: z.coerce.boolean(),
  sortOrder: z.coerce.number().int().default(0),
});

function readL10n(formData: FormData, prefix: string) {
  const out: Record<string, string> = {};
  for (const locale of LOCALES) {
    const value = String(formData.get(`${prefix}.${locale}`) ?? "").trim();
    if (value) out[locale] = value;
  }
  return Object.keys(out).length > 0 ? out : null;
}

export async function saveProduct(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const raw = {
    id: formData.get("id") ? String(formData.get("id")) : undefined,
    productCode: String(formData.get("productCode") ?? ""),
    modelCode: String(formData.get("modelCode") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    subcategory: String(formData.get("subcategory") ?? ""),
    section: String(formData.get("section") ?? "Unisex"),
    audience: String(formData.get("audience") ?? "adult"),
    status: String(formData.get("status") ?? "draft"),
    gsm: String(formData.get("gsm") ?? ""),
    moq: String(formData.get("moq") ?? ""),
    leadTimeDays: String(formData.get("leadTimeDays") ?? ""),
    privateLabel: String(formData.get("privateLabel") ?? "inherit"),
    price100: String(formData.get("price100") ?? ""),
    price300: String(formData.get("price300") ?? ""),
    price500: String(formData.get("price500") ?? ""),
    price1000: String(formData.get("price1000") ?? ""),
    isBestSeller: formData.get("isBestSeller") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    isNew: formData.get("isNew") === "on",
    sortOrder: String(formData.get("sortOrder") ?? "0"),
  };

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fields[key]) fields[key] = issue.message;
    }
    return { ok: false, message: "Formda hatalı alanlar var.", fields };
  }

  const d = parsed.data;
  const data = {
    productCode: d.productCode,
    modelCode: d.modelCode || null,
    slug: d.slug,
    categoryId: d.categoryId,
    subcategory: d.subcategory || null,
    section: d.section,
    audience: d.audience,
    status: d.status,
    gsm: d.gsm,
    moq: d.moq,
    leadTimeDays: d.leadTimeDays || null,
    privateLabel: d.privateLabel === "inherit" ? null : d.privateLabel === "yes",
    price100: d.price100,
    price300: d.price300,
    price500: d.price500,
    price1000: d.price1000,
    isBestSeller: d.isBestSeller,
    isFeatured: d.isFeatured,
    isNew: d.isNew,
    sortOrder: d.sortOrder,
    fabric: readL10n(formData, "fabric") ?? undefined,
    packaging: readL10n(formData, "packaging") ?? undefined,
    printType: readL10n(formData, "printType") ?? undefined,
  };

  try {
    const product = d.id
      ? await prisma.product.update({ where: { id: d.id }, data })
      : await prisma.product.create({ data });

    for (const locale of LOCALES) {
      const name = String(formData.get(`name.${locale}`) ?? "").trim();
      if (!name) continue;
      const payload = {
        name,
        shortDescription: String(formData.get(`shortDescription.${locale}`) ?? "").trim() || null,
        description: String(formData.get(`description.${locale}`) ?? "").trim() || null,
        seoTitle: String(formData.get(`seoTitle.${locale}`) ?? "").trim() || null,
        seoDescription: String(formData.get(`seoDescription.${locale}`) ?? "").trim() || null,
      };
      await prisma.productTranslation.upsert({
        where: { productId_locale: { productId: product.id, locale } },
        update: payload,
        create: { productId: product.id, locale, ...payload },
      });
    }

    revalidatePath("/admin/products");
    revalidatePath("/[locale]/products", "page");
    return { ok: true, message: d.id ? "Ürün güncellendi." : "Ürün oluşturuldu." };
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("Unique")
        ? "Bu ürün kodu veya slug zaten kullanılıyor."
        : "Kaydedilemedi.";
    return { ok: false, message };
  }
}

export async function setProductStatus(id: string, status: string): Promise<ActionResult> {
  await requireAdmin();
  if (!["published", "draft", "archived"].includes(status)) {
    return { ok: false, message: "Geçersiz durum." };
  }
  await prisma.product.update({ where: { id }, data: { status } });
  revalidatePath("/admin/products");
  return { ok: true, message: "Durum güncellendi." };
}

/** Ürünü kopyalar; kod ve slug'a benzersiz sonek eklenir, taslak olarak açılır. */
export async function duplicateProduct(id: string): Promise<ActionResult & { id?: string }> {
  await requireAdmin();

  const source = await prisma.product.findUnique({
    where: { id },
    include: { translations: true, variants: true },
  });
  if (!source) return { ok: false, message: "Ürün bulunamadı." };

  let suffix = 2;
  let code = `${source.productCode}-${suffix}`;
  let slug = `${source.slug}-${suffix}`;
  while (
    await prisma.product.findFirst({ where: { OR: [{ productCode: code }, { slug }] } })
  ) {
    suffix += 1;
    code = `${source.productCode}-${suffix}`;
    slug = `${source.slug}-${suffix}`;
  }

  // Json alanları açıkça geçiyoruz: Prisma null yerine undefined bekliyor
  const copy = await prisma.product.create({
    data: {
      productCode: code,
      slug,
      status: "draft",
      modelCode: source.modelCode,
      categoryId: source.categoryId,
      subcategory: source.subcategory,
      section: source.section,
      audience: source.audience,
      gsm: source.gsm,
      moq: source.moq,
      leadTimeDays: source.leadTimeDays,
      privateLabel: source.privateLabel,
      price100: source.price100,
      price300: source.price300,
      price500: source.price500,
      price1000: source.price1000,
      isBestSeller: source.isBestSeller,
      isFeatured: source.isFeatured,
      isNew: source.isNew,
      sortOrder: source.sortOrder,
      sourceUrl: source.sourceUrl,
      retailTry: source.retailTry,
      importWarnings: source.importWarnings,
      fabric: source.fabric ?? undefined,
      packaging: source.packaging ?? undefined,
      printType: source.printType ?? undefined,
      priceEurOverride: source.priceEurOverride ?? undefined,
      translations: {
        create: source.translations.map((t) => ({
          locale: t.locale,
          name: `${t.name} (kopya)`,
          shortDescription: t.shortDescription,
          description: t.description,
          seoTitle: t.seoTitle,
          seoDescription: t.seoDescription,
        })),
      },
      variants: {
        create: source.variants.map((v) => ({
          color: v.color,
          colorTr: v.colorTr,
          colorHex: v.colorHex,
          sizes: v.sizes,
          images: v.images,
          sortOrder: v.sortOrder,
        })),
      },
    },
    select: { id: true },
  });

  revalidatePath("/admin/products");
  return { ok: true, message: "Ürün kopyalandı (taslak).", id: copy.id };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  return { ok: true, message: "Ürün silindi." };
}

/* --------------------------------------------------------- toplu düzenleme */

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1, "En az bir ürün seçin"),
  price100: decimalish.optional(),
  price300: decimalish.optional(),
  price500: decimalish.optional(),
  price1000: decimalish.optional(),
  gsm: intish.optional(),
  moq: intish.optional(),
  leadTimeDays: z.string().trim().max(40).optional(),
  categoryId: z.string().optional(),
  status: z.string().optional(),
  fabricTr: z.string().trim().optional(),
  fabricEn: z.string().trim().optional(),
});

export type BulkPatch = z.input<typeof bulkSchema>;

/**
 * Seçilen ürünlere aynı değeri yazar (brief §9).
 * Sadece DOLU gelen alanlar yazılır; boş bırakılan alanlar dokunulmadan kalır.
 * Kaç ürünün etkileneceği çağrı öncesi panelde gösterilir ve onay alınır.
 */
export async function bulkUpdate(patch: BulkPatch): Promise<ActionResult & { count?: number }> {
  await requireAdmin();

  const parsed = bulkSchema.safeParse(patch);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  }
  const p = parsed.data;

  const data: Record<string, unknown> = {};
  if (p.price100 != null) data.price100 = p.price100;
  if (p.price300 != null) data.price300 = p.price300;
  if (p.price500 != null) data.price500 = p.price500;
  if (p.price1000 != null) data.price1000 = p.price1000;
  if (p.gsm != null) data.gsm = p.gsm;
  if (p.moq != null) data.moq = p.moq;
  if (p.leadTimeDays) data.leadTimeDays = p.leadTimeDays;
  if (p.categoryId) data.categoryId = p.categoryId;
  if (p.status) data.status = p.status;
  if (p.fabricTr || p.fabricEn) {
    data.fabric = {
      en: p.fabricEn || p.fabricTr,
      tr: p.fabricTr || p.fabricEn,
      de: p.fabricEn || p.fabricTr,
      ar: p.fabricEn || p.fabricTr,
    };
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, message: "Değiştirilecek alan girilmedi." };
  }

  const result = await prisma.product.updateMany({
    where: { id: { in: p.ids } },
    data: data as never,
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/bulk");
  return { ok: true, message: `${result.count} ürün güncellendi.`, count: result.count };
}

/** Bir hücreyi tek başına günceller (Excel hissi veren tablo için). */
export async function updateProductField(
  id: string,
  field: string,
  value: string,
): Promise<ActionResult> {
  await requireAdmin();

  const allowed = new Set([
    "price100",
    "price300",
    "price500",
    "price1000",
    "gsm",
    "moq",
    "leadTimeDays",
    "status",
    "sortOrder",
  ]);
  if (!allowed.has(field)) return { ok: false, message: "Bu alan düzenlenemez." };

  const trimmed = value.trim();
  let parsedValue: unknown;

  if (field.startsWith("price")) {
    const normalized = trimmed.replace(",", ".");
    if (trimmed === "") parsedValue = null;
    else if (Number.isNaN(Number(normalized)) || Number(normalized) < 0)
      return { ok: false, message: "Geçerli bir fiyat girin." };
    else parsedValue = normalized;
  } else if (field === "gsm" || field === "moq" || field === "sortOrder") {
    if (trimmed === "") parsedValue = field === "sortOrder" ? 0 : null;
    else if (!/^\d+$/.test(trimmed)) return { ok: false, message: "Tam sayı girin." };
    else parsedValue = Number(trimmed);
  } else if (field === "status") {
    if (!["published", "draft", "archived"].includes(trimmed))
      return { ok: false, message: "Geçersiz durum." };
    parsedValue = trimmed;
  } else {
    parsedValue = trimmed || null;
  }

  await prisma.product.update({ where: { id }, data: { [field]: parsedValue } as never });
  revalidatePath("/admin/bulk");
  return { ok: true, message: "Kaydedildi." };
}
