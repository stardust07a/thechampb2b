import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/shell";
import { CategoryManager, type CategoryRow } from "@/components/admin/category-manager";
import { LOCALES } from "@/lib/locales";

export const dynamic = "force-dynamic";

function dec(v: { toString(): string } | null): string {
  return v === null ? "" : Number(v.toString()).toFixed(2);
}

function l10n(v: unknown): Record<string, string> {
  return v && typeof v === "object" ? (v as Record<string, string>) : {};
}

export default async function CategoriesPage() {
  const session = await auth();

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      translations: true,
      _count: { select: { products: true } },
    },
  });

  const rows: CategoryRow[] = categories.map((c) => {
    const names: Record<string, string> = {};
    const descriptions: Record<string, string> = {};
    const seoTitles: Record<string, string> = {};
    const seoDescriptions: Record<string, string> = {};
    for (const locale of LOCALES) {
      const t = c.translations.find((x) => x.locale === locale);
      names[locale] = t?.name ?? "";
      descriptions[locale] = t?.description ?? "";
      seoTitles[locale] = t?.seoTitle ?? "";
      seoDescriptions[locale] = t?.seoDescription ?? "";
    }

    return {
      id: c.id,
      slug: c.slug,
      order: c.order,
      active: c.active,
      productCount: c._count.products,
      gsm: c.gsm?.toString() ?? "",
      moq: c.moq?.toString() ?? "",
      leadTimeDays: c.leadTimeDays ?? "",
      privateLabel: c.privateLabel,
      price100: dec(c.price100),
      price300: dec(c.price300),
      price500: dec(c.price500),
      price1000: dec(c.price1000),
      fabric: l10n(c.fabric),
      packaging: l10n(c.packaging),
      printType: l10n(c.printType),
      names,
      descriptions,
      seoTitles,
      seoDescriptions,
    };
  });

  return (
    <AdminShell user={session?.user ?? {}}>
      <header className="mb-6">
        <h1 className="text-h2 font-bold">Kategoriler</h1>
        <p className="mt-1.5 text-sm text-muted">
          Kategori fiyatları ve üretim bilgisi, o kategorideki ürünler boş bıraktığında
          varsayılan olarak kullanılır.
        </p>
      </header>

      <CategoryManager categories={rows} />
    </AdminShell>
  );
}
