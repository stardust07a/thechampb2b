import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/shell";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { AdminProductFilters } from "@/components/admin/product-filters";
import { Pagination } from "@/components/admin/pagination";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PER_PAGE = 40;

const STATUS_LABELS: Record<string, string> = {
  published: "Yayında",
  draft: "Taslak",
  archived: "Arşiv",
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : undefined);

  const q = one("q");
  const status = one("status");
  const categorySlug = one("category");
  const missing = one("missing");
  const page = Math.max(1, Number(one("page") ?? 1) || 1);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (categorySlug) where.category = { slug: categorySlug };
  if (q) {
    where.OR = [
      { productCode: { contains: q, mode: "insensitive" } },
      { modelCode: { contains: q, mode: "insensitive" } },
      { slug: { contains: q.toLowerCase() } },
      { translations: { some: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }
  if (missing === "price") {
    where.price100 = null;
    where.price300 = null;
    where.price500 = null;
    where.price1000 = null;
    where.category = {
      ...(where.category as object),
      price100: null,
      price300: null,
      price500: null,
      price1000: null,
    };
  }
  if (missing === "images") where.variants = { none: {} };
  if (missing === "warnings") where.NOT = { importWarnings: { isEmpty: true } };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where: where as never,
      orderBy: [{ status: "asc" }, { sortOrder: "asc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        productCode: true,
        slug: true,
        status: true,
        section: true,
        price1000: true,
        isBestSeller: true,
        isFeatured: true,
        isNew: true,
        importWarnings: true,
        category: {
          select: { slug: true, translations: { where: { locale: "tr" }, select: { name: true } } },
        },
        translations: { where: { locale: "tr" }, select: { name: true } },
        variants: { take: 1, orderBy: { sortOrder: "asc" }, select: { images: true } },
        _count: { select: { variants: true } },
      },
    }),
    prisma.product.count({ where: where as never }),
    prisma.category.findMany({
      orderBy: { order: "asc" },
      select: { slug: true, translations: { where: { locale: "tr" }, select: { name: true } } },
    }),
  ]);

  return (
    <AdminShell user={session?.user ?? {}}>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h2 font-bold">Ürünler</h1>
          <p className="tabular mt-1.5 text-sm text-muted">{total} kayıt</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-[--radius-pill] bg-solid px-5 py-2.5 text-sm font-medium text-on-solid"
        >
          <Plus className="size-4" aria-hidden />
          Yeni ürün
        </Link>
      </header>

      <AdminProductFilters
        categories={categories.map((c) => ({
          slug: c.slug,
          name: c.translations[0]?.name ?? c.slug,
        }))}
      />

      <div className="mt-6 overflow-x-auto rounded-[--radius-card] border border-line">
        <table className="w-full min-w-[52rem] text-sm">
          <thead className="bg-surface-2 text-start">
            <tr className="text-xs uppercase tracking-[0.06em] text-muted">
              <th scope="col" className="px-4 py-3 text-start font-medium">Ürün</th>
              <th scope="col" className="px-4 py-3 text-start font-medium">Kod</th>
              <th scope="col" className="px-4 py-3 text-start font-medium">Kategori</th>
              <th scope="col" className="px-4 py-3 text-start font-medium">Durum</th>
              <th scope="col" className="px-4 py-3 text-end font-medium">1000+ $</th>
              <th scope="col" className="px-4 py-3 text-start font-medium">Rozet</th>
              <th scope="col" className="px-4 py-3 text-end font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody className="bg-surface">
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted">
                  Bu filtreye uyan ürün yok.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const image = mediaUrl(p.variants[0]?.images[0], "thumb");
                return (
                  <tr key={p.id} className="border-t border-line-soft">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="flex items-center gap-3 hover:text-fg"
                      >
                        <span className="relative block aspect-[2/3] w-9 shrink-0 overflow-hidden rounded-[6px] bg-surface-2">
                          {image ? (
                            <Image src={image} alt="" fill sizes="36px" className="object-cover" />
                          ) : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block max-w-[22rem] truncate text-fg">
                            {p.translations[0]?.name ?? p.slug}
                          </span>
                          <span className="tabular block text-xs text-faint">
                            {p._count.variants} renk
                            {p.importWarnings.length > 0
                              ? ` · ${p.importWarnings.length} uyarı`
                              : ""}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="tabular px-4 py-3 text-muted">{p.productCode}</td>
                    <td className="px-4 py-3 text-muted">
                      {p.category.translations[0]?.name ?? p.category.slug}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-[--radius-pill] px-2.5 py-1 text-xs",
                          p.status === "published" && "bg-success/12 text-success",
                          p.status === "draft" && "bg-surface-2 text-muted",
                          p.status === "archived" && "bg-danger/12 text-danger",
                        )}
                      >
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="tabular px-4 py-3 text-end text-muted">
                      {p.price1000 ? Number(p.price1000).toFixed(2) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="tabular text-xs text-faint">
                        {[p.isBestSeller && "BS", p.isFeatured && "FT", p.isNew && "NEW"]
                          .filter(Boolean)
                          .join(" ") || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <ProductRowActions id={p.id} status={p.status} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} perPage={PER_PAGE} total={total} />
    </AdminShell>
  );
}
