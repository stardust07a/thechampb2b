import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/shell";
import { HomeSections, type HomeSectionData } from "@/components/admin/home-sections";

export const dynamic = "force-dynamic";

const SECTION_LABELS: Record<string, string> = {
  bestsellers: "Best Sellers",
  featured: "Featured Products",
  new: "New Arrivals",
};

const DEFAULT_TITLES: Record<string, Record<string, string>> = {
  bestsellers: { en: "Best Sellers", tr: "Çok Satanlar", de: "Bestseller", ar: "الأكثر مبيعاً" },
  featured: {
    en: "Featured Products",
    tr: "Öne Çıkan Ürünler",
    de: "Ausgewählte Produkte",
    ar: "منتجات مميزة",
  },
  new: { en: "New Arrivals", tr: "Yeni Gelenler", de: "Neuheiten", ar: "وصل حديثاً" },
};

export default async function AdminHomeSectionsPage() {
  const session = await auth();

  const rows = await prisma.homeSection.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r]));

  // Seçili ürünlerin tamamını tek sorguda çek
  const allIds = rows.flatMap((r) => r.productIds);
  const products =
    allIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: allIds } },
          select: {
            id: true,
            productCode: true,
            slug: true,
            translations: { where: { locale: "tr" }, select: { name: true } },
            variants: { take: 1, orderBy: { sortOrder: "asc" }, select: { images: true } },
          },
        })
      : [];
  const productById = new Map(
    products.map((p) => [
      p.id,
      {
        id: p.id,
        productCode: p.productCode,
        name: p.translations[0]?.name ?? p.slug,
        imageKey: p.variants[0]?.images[0] ?? null,
      },
    ]),
  );

  const sections: HomeSectionData[] = (["bestsellers", "featured", "new"] as const).map((key) => {
    const row = byKey.get(key);
    return {
      key,
      label: SECTION_LABELS[key],
      enabled: row?.enabled ?? true,
      limit: row?.limit ?? 8,
      titles: (row?.titles as Record<string, string>) ?? DEFAULT_TITLES[key],
      products: (row?.productIds ?? [])
        .map((id) => productById.get(id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p)),
    };
  });

  return (
    <AdminShell user={session?.user ?? {}}>
      <header className="mb-6">
        <h1 className="text-h2 font-bold">Ana sayfa ürünleri</h1>
        <p className="mt-1.5 text-sm text-muted">
          Üç bölümün içeriğini ve sırasını buradan belirleyin. Bir ürün birden fazla
          bölümde yer alabilir. Ürün seçilmeyen bölüm ana sayfada hiç gösterilmez.
        </p>
      </header>

      <HomeSections sections={sections} />
    </AdminShell>
  );
}
