import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/shell";
import { AdminProductFilters } from "@/components/admin/product-filters";
import { BulkEditor, type BulkRow } from "@/components/admin/bulk-editor";
import { Pagination } from "@/components/admin/pagination";

export const dynamic = "force-dynamic";

const PER_PAGE = 60;

function dec(v: { toString(): string } | null): string {
  return v === null ? "" : Number(v.toString()).toFixed(2);
}

export default async function BulkPage({
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
  const page = Math.max(1, Number(one("page") ?? 1) || 1);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (categorySlug) where.category = { slug: categorySlug };
  if (q) {
    where.OR = [
      { productCode: { contains: q, mode: "insensitive" } },
      { translations: { some: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where: where as never,
      orderBy: [{ category: { order: "asc" } }, { sortOrder: "asc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        productCode: true,
        status: true,
        price100: true,
        price300: true,
        price500: true,
        price1000: true,
        gsm: true,
        moq: true,
        leadTimeDays: true,
        slug: true,
        category: {
          select: { translations: { where: { locale: "tr" }, select: { name: true } }, slug: true },
        },
        translations: { where: { locale: "tr" }, select: { name: true } },
      },
    }),
    prisma.product.count({ where: where as never }),
    prisma.category.findMany({
      orderBy: { order: "asc" },
      select: {
        id: true,
        slug: true,
        translations: { where: { locale: "tr" }, select: { name: true } },
      },
    }),
  ]);

  const rows: BulkRow[] = products.map((p) => ({
    id: p.id,
    productCode: p.productCode,
    name: p.translations[0]?.name ?? p.slug,
    categoryName: p.category.translations[0]?.name ?? p.category.slug,
    status: p.status,
    price100: dec(p.price100),
    price300: dec(p.price300),
    price500: dec(p.price500),
    price1000: dec(p.price1000),
    gsm: p.gsm?.toString() ?? "",
    moq: p.moq?.toString() ?? "",
    leadTimeDays: p.leadTimeDays ?? "",
  }));

  return (
    <AdminShell user={session?.user ?? {}}>
      <header className="mb-6">
        <h1 className="text-h2 font-bold">Toplu düzenleme</h1>
        <p className="mt-1.5 text-sm text-muted">
          Hücreye tıklayıp doğrudan yazın (Enter kaydeder, Esc geri alır) veya birden fazla
          ürün seçip hepsine aynı değeri yazın. {total} kayıt.
        </p>
      </header>

      <div className="mb-6">
        <AdminProductFilters
          categories={categories.map((c) => ({
            slug: c.slug,
            name: c.translations[0]?.name ?? c.slug,
          }))}
        />
      </div>

      <BulkEditor
        rows={rows}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.translations[0]?.name ?? c.slug,
        }))}
      />

      <Pagination page={page} perPage={PER_PAGE} total={total} />
    </AdminShell>
  );
}
