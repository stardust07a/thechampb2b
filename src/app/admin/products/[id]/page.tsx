import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/shell";
import { ProductForm, type ProductFormData } from "@/components/admin/product-form";
import { LOCALES } from "@/lib/locales";

export const dynamic = "force-dynamic";

function dec(v: { toString(): string } | null): string {
  return v === null ? "" : Number(v.toString()).toFixed(2);
}

function l10n(v: unknown): Record<string, string> {
  return v && typeof v === "object" ? (v as Record<string, string>) : {};
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { slug: true } },
        translations: true,
        variants: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.category.findMany({
      orderBy: { order: "asc" },
      select: { id: true, slug: true, translations: { where: { locale: "tr" }, select: { name: true } } },
    }),
  ]);

  if (!product) notFound();

  const translations: ProductFormData["translations"] = {};
  for (const locale of LOCALES) {
    const t = product.translations.find((x) => x.locale === locale);
    translations[locale] = {
      name: t?.name ?? "",
      shortDescription: t?.shortDescription ?? "",
      description: t?.description ?? "",
      seoTitle: t?.seoTitle ?? "",
      seoDescription: t?.seoDescription ?? "",
    };
  }

  const data: ProductFormData = {
    id: product.id,
    productCode: product.productCode,
    modelCode: product.modelCode ?? "",
    slug: product.slug,
    categoryId: product.categoryId,
    categorySlug: product.category.slug,
    subcategory: product.subcategory ?? "",
    section: product.section,
    audience: product.audience,
    status: product.status,
    gsm: product.gsm?.toString() ?? "",
    moq: product.moq?.toString() ?? "",
    leadTimeDays: product.leadTimeDays ?? "",
    privateLabel:
      product.privateLabel === null ? "inherit" : product.privateLabel ? "yes" : "no",
    price100: dec(product.price100),
    price300: dec(product.price300),
    price500: dec(product.price500),
    price1000: dec(product.price1000),
    isBestSeller: product.isBestSeller,
    isFeatured: product.isFeatured,
    isNew: product.isNew,
    sortOrder: product.sortOrder,
    fabric: l10n(product.fabric),
    packaging: l10n(product.packaging),
    printType: l10n(product.printType),
    translations,
    variants: product.variants.map((v) => ({
      color: v.color,
      colorHex: v.colorHex,
      sizes: v.sizes,
      images: v.images,
    })),
    internal: {
      sourceUrl: product.sourceUrl,
      retailTry: product.retailTry ? Number(product.retailTry.toString()).toFixed(2) : null,
      warnings: product.importWarnings,
    },
  };

  return (
    <AdminShell user={session?.user ?? {}}>
      <header className="mb-6">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Ürünler
        </Link>
        <h1 className="mt-3 text-h2 font-bold">
          {translations.tr.name || product.productCode}
        </h1>
        <p className="tabular mt-1.5 text-sm text-muted">{product.productCode}</p>
      </header>

      <ProductForm
        product={data}
        categories={categories.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.translations[0]?.name ?? c.slug,
        }))}
      />
    </AdminShell>
  );
}
