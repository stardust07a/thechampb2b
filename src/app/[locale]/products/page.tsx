import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { alternatesFor } from "@/lib/alternates";
import { Container, Section } from "@/components/ui/section";
import { CatalogFilters } from "@/components/product/catalog-filters";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductCard } from "@/components/product/product-card";
import { LoadMore } from "@/components/product/load-more";
import { EmptyResults } from "@/components/product/empty-results";
import { getFilterFacets, listProducts, PER_PAGE, type ProductFilters } from "@/lib/products";
import { getSettings } from "@/lib/settings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("catalogTitle"),
    description: t("catalogDescription"),
    alternates: alternatesFor(locale, "/products"),
  };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** URL parametrelerini güvenli biçimde filtreye çevirir. */
export function parseFilters(sp: Record<string, string | string[] | undefined>): ProductFilters {
  const one = (k: string) => {
    const v = sp[k];
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  };
  const sortRaw = one("sort");
  const sort = (["newest", "bestsellers", "price", "alpha"] as const).find((s) => s === sortRaw);
  const pageRaw = Number(one("page") ?? 1);

  return {
    q: one("q"),
    category: one("category"),
    section: one("section"),
    subcategory: one("subcategory"),
    color: one("color"),
    size: one("size"),
    sort,
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1,
  };
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const sp = await searchParams;
  const filters = parseFilters(sp);

  const t = await getTranslations({ locale, namespace: "catalog" });
  const settings = await getSettings();

  // "Load more" tıklandığında page artar ve o sayfaya kadar olan her şey gelir
  const perPage = PER_PAGE;
  const pages = filters.page ?? 1;

  const [result, facets] = await Promise.all([
    listProducts(locale, { ...filters, page: 1, perPage: perPage * pages }),
    getFilterFacets(locale),
  ]);

  return (
    <Section className="pt-10 md:pt-14">
      <Container>
        <header className="mb-10">
          <h1 className="chrome-text text-h1">{t("title")}</h1>
          <p className="mt-3 text-muted">{t("subtitle", { count: result.total })}</p>
        </header>

        <CatalogFilters
          variant="bar"
          total={result.total}
          facets={{
            categories: facets.categories.map((c) => ({
              slug: c.slug,
              name: c.translations[0]?.name ?? c.slug,
              count: c._count.products,
            })),
            sections: facets.sections,
            subcategories: facets.subcategories,
            colors: facets.colors,
            sizes: facets.sizes,
          }}
        />

        <div className="mt-10 lg:grid lg:grid-cols-[15rem_1fr] lg:gap-10">
          <CatalogFilters
            total={result.total}
            facets={{
              categories: facets.categories.map((c) => ({
              slug: c.slug,
              name: c.translations[0]?.name ?? c.slug,
              count: c._count.products,
            })),
              sections: facets.sections,
              subcategories: facets.subcategories,
              colors: facets.colors,
              sizes: facets.sizes,
            }}
          />

          <div className="min-w-0">
            {result.items.length === 0 ? (
              <EmptyResults />
            ) : (
              <>
                <ProductGrid>
                  {result.items.map((p, i) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      locale={locale}
                      eurRate={settings.eurRate}
                      priority={i < 4}
                    />
                  ))}
                </ProductGrid>

                <div className="mt-14 flex flex-col items-center gap-4">
                  <p className="tabular text-sm text-muted">
                    {t("showing", { shown: result.items.length, total: result.total })}
                  </p>
                  {result.items.length < result.total ? (
                    <LoadMore nextPage={pages + 1} />
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
