import { Download, RefreshCw } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/shell";
import { LOCALES, LOCALE_NAMES } from "@/lib/locales";

export const dynamic = "force-dynamic";

/** PDF katalog üretimi — brief §12. */
export default async function CatalogPdfPage() {
  const session = await auth();

  const categories = await prisma.category.findMany({
    where: { active: true, products: { some: { status: "published" } } },
    orderBy: { order: "asc" },
    select: {
      slug: true,
      translations: { where: { locale: "tr" }, select: { name: true } },
      _count: { select: { products: { where: { status: "published" } } } },
    },
  });

  return (
    <AdminShell user={session?.user ?? {}}>
      <header className="mb-6">
        <h1 className="text-h2 font-bold">PDF katalog</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          Katalog paneldeki güncel veriden üretilir ve bir saat önbelleğe alınır.
          Fiyat veya ürün değiştirdikten sonra &quot;Yeniden üret&quot; ile önbelleği
          atlayabilirsiniz.
        </p>
      </header>

      <section className="mb-8 rounded-[--radius-card] border border-line bg-surface p-6">
        <h2 className="eyebrow mb-4">Tam katalog</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LOCALES.map((locale) => (
            <li
              key={locale}
              className="rounded-[--radius-inner] border border-line bg-bg-2 p-4"
            >
              <p className="text-sm font-medium text-fg">{LOCALE_NAMES[locale]}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={`/api/catalog/${locale}`}
                  className="inline-flex items-center gap-1.5 rounded-[--radius-pill] bg-solid px-3 py-1.5 text-xs font-medium text-on-solid"
                >
                  <Download className="size-3.5" aria-hidden />
                  İndir
                </a>
                <a
                  href={`/api/catalog/${locale}?refresh=1`}
                  className="inline-flex items-center gap-1.5 rounded-[--radius-pill] border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-chrome-1 hover:text-fg"
                >
                  <RefreshCw className="size-3.5" aria-hidden />
                  Yeniden üret
                </a>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-faint">
          Arapça katalog gövdesi İngilizce üretilir — PDF motoru Arapça harf
          birleştirmesini desteklemiyor. Sitenin Arapça tarafı tam çeviridir.
        </p>
      </section>

      <section className="rounded-[--radius-card] border border-line bg-surface p-6">
        <h2 className="eyebrow mb-4">Kategori bazlı</h2>
        <ul className="divide-y divide-line-soft">
          {categories.map((c) => (
            <li key={c.slug} className="flex flex-wrap items-center gap-3 py-3">
              <span className="min-w-40 flex-1 text-sm text-fg">
                {c.translations[0]?.name ?? c.slug}
              </span>
              <span className="tabular text-xs text-faint">
                {c._count.products} ürün
              </span>
              <span className="flex gap-2">
                {LOCALES.map((locale) => (
                  <a
                    key={locale}
                    href={`/api/catalog/${locale}?category=${c.slug}`}
                    className="rounded-[--radius-pill] border border-line px-2.5 py-1 text-xs uppercase text-muted transition-colors hover:border-chrome-1 hover:text-fg"
                  >
                    {locale}
                  </a>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </AdminShell>
  );
}
