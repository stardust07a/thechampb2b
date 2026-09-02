import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import { Container, Section } from "@/components/ui/section";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { CatalogFilters } from "@/components/product/catalog-filters";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductCard } from "@/components/product/product-card";
import { LoadMore } from "@/components/product/load-more";
import { EmptyResults } from "@/components/product/empty-results";
import { getCategories, getCategoryBySlug, getFilterFacets, listProducts } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { parseFilters } from "../page";

/** Kategori sayfaları statik üretilir (brief §11: statik/ISR). */
export async function generateStaticParams() {
  const categories = await prisma.category
    .findMany({ where: { active: true }, select: { slug: true } })
    .catch(() => []);
  return routing.locales.flatMap((locale) =>
    categories.map((c) => ({ locale, category: c.slug })),
  );
}

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category: slug } = await params;
  const category = await getCategoryBySlug(slug, locale as Locale);
  if (!category) return {};
  const tr = category.translations[0];

  return {
    // seoTitle marka adını zaten içeriyor; layout şablonu ikinci kez eklemesin
    title: tr?.seoTitle ? { absolute: tr.seoTitle } : (tr?.name ?? slug),
    description: tr?.seoDescription ?? tr?.description ?? undefined,
    alternates: {
      canonical: `/${locale}/products/${slug}`,
      languages: Object.fromEntries([
        ...routing.locales.map((l) => [l, `/${l}/products/${slug}`]),
        ["x-default", `/${routing.defaultLocale}/products/${slug}`],
      ]),
    },
    openGraph: { title: tr?.name ?? slug, description: tr?.description ?? undefined },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw, category: slug } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const category = await getCategoryBySlug(slug, locale);
  if (!category || !category.active) notFound();

  const sp = await searchParams;
  const filters = { ...parseFilters(sp), category: slug };

  const t = await getTranslations({ locale, namespace: "catalog" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const settings = await getSettings();

  const perPage = 48;
  const pages = filters.page ?? 1;

  const [result, facets, allCategories] = await Promise.all([
    listProducts(locale, { ...filters, page: 1, perPage: perPage * pages }),
    getFilterFacets(locale),
    getCategories(locale),
  ]);

  const tr = category.translations[0];
  const name = tr?.name ?? slug;

  return (
    <Section className="pt-6 md:pt-8">
      <Container>
        <Breadcrumbs
          locale={locale}
          items={[
            { href: "/products", label: tNav("products") },
            { href: `/products/${slug}`, label: name },
          ]}
        />

        <header className="mt-8 mb-10 max-w-3xl">
          <h1 className="chrome-text text-h1">{name}</h1>
          {tr?.description ? <p className="mt-4 text-muted">{tr.description}</p> : null}
          <p className="tabular mt-3 text-sm text-faint">
            {t("resultsCount", { count: result.total })}
          </p>
        </header>

        <CatalogFilters
          variant="bar"
          total={result.total}
          lockedCategory={slug}
          facets={{
            categories: allCategories.map((c) => ({
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
          lockedCategory={slug}
          facets={{
            categories: allCategories.map((c) => ({
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
