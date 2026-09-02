import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/shell";
import { ProductForm, type ProductFormData } from "@/components/admin/product-form";
import { LOCALES } from "@/lib/locales";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const session = await auth();

  const [categories, lastCode] = await Promise.all([
    prisma.category.findMany({
      orderBy: { order: "asc" },
      select: {
        id: true,
        slug: true,
        translations: { where: { locale: "tr" }, select: { name: true } },
      },
    }),
    prisma.product.findFirst({
      orderBy: { productCode: "desc" },
      select: { productCode: true },
    }),
  ]);

  // Sıradaki kodu öner: TC-XXX-0123 kalıbının sayısal kuyruğunu bir artır
  const suggestedCode = (() => {
    const match = lastCode?.productCode.match(/^(.*?)(\d+)$/);
    if (!match) return "";
    const next = String(Number(match[2]) + 1).padStart(match[2].length, "0");
    return `${match[1]}${next}`;
  })();

  const translations: ProductFormData["translations"] = {};
  for (const locale of LOCALES) {
    translations[locale] = {
      name: "",
      shortDescription: "",
      description: "",
      seoTitle: "",
      seoDescription: "",
    };
  }

  const blank: ProductFormData = {
    productCode: suggestedCode,
    modelCode: "",
    slug: "",
    categoryId: "",
    categorySlug: "",
    subcategory: "",
    section: "Unisex",
    audience: "adult",
    status: "draft",
    gsm: "",
    moq: "",
    leadTimeDays: "",
    privateLabel: "inherit",
    price100: "",
    price300: "",
    price500: "",
    price1000: "",
    isBestSeller: false,
    isFeatured: false,
    isNew: true,
    sortOrder: 0,
    fabric: {},
    packaging: {},
    printType: {},
    translations,
    variants: [],
    internal: { sourceUrl: null, retailTry: null, warnings: [] },
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
        <h1 className="mt-3 text-h2 font-bold">Yeni ürün</h1>
        <p className="mt-1.5 text-sm text-muted">
          Taslak olarak kaydedin; görsel ve fiyat girildikten sonra yayına alın.
        </p>
      </header>

      <ProductForm
        product={blank}
        categories={categories.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.translations[0]?.name ?? c.slug,
        }))}
      />
    </AdminShell>
  );
}
