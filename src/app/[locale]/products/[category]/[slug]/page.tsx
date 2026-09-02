import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { routing, type Locale } from "@/i18n/routing";
import { Container, Section, SectionHeader } from "@/components/ui/section";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { ProductBuyPanel } from "@/components/product/product-buy-panel";
import { ProductCard } from "@/components/product/product-card";
import { ProductGrid } from "@/components/product/product-grid";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { resolvePrices, TIERS } from "@/lib/price";
import { mediaUrl } from "@/lib/media";
import { SECTION_LABELS, label } from "@/lib/taxonomy";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

/**
 * Ürün detay — GERÇEK URL, modal DEĞİL (brief §4.4, §17.1).
 * 819 × 4 dil = 3276 sayfa; hepsini build'de üretmek yerine ISR ile
 * ilk istekte üretilip önbelleğe alınır.
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, category, slug } = await params;
  const product = await getProductBySlug(slug, locale as Locale);
  if (!product) return {};

  const tr = product.translations[0];
  const image = mediaUrl(product.variants[0]?.images[0], "full");
  const path = `/products/${category}/${slug}`;

  return {
    // seoTitle marka adını zaten içeriyor; layout şablonu ikinci kez eklemesin
    title: tr?.seoTitle ? { absolute: tr.seoTitle } : (tr?.name ?? slug),
    description: tr?.seoDescription ?? tr?.shortDescription ?? undefined,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: Object.fromEntries([
        ...routing.locales.map((l) => [l, `/${l}${path}`]),
        ["x-default", `/${routing.defaultLocale}${path}`],
      ]),
    },
    openGraph: {
      type: "website",
      title: tr?.name ?? slug,
      description: tr?.shortDescription ?? undefined,
      // WhatsApp / Instagram link önizlemesi için ürün görseli (brief §11)
      images: image ? [{ url: image.startsWith("http") ? image : `${SITE}${image}` }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: tr?.name ?? slug,
      images: image ? [image.startsWith("http") ? image : `${SITE}${image}`] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>;
}) {
  const { locale: raw, category: categorySlug, slug } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const product = await getProductBySlug(slug, locale);
  if (!product || product.category.slug !== categorySlug) notFound();

  const t = await getTranslations({ locale, namespace: "product" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tPrice = await getTranslations({ locale, namespace: "price" });
  const settings = await getSettings();

  const tr = product.translations[0];
  const name = tr?.name ?? slug;
  const categoryName = product.category.translations[0]?.name ?? categorySlug;

  // Ürün alanı boşsa kategori varsayılanı devralınır (brief §5)
  const spec = {
    fabric: (product.fabric ?? product.category.fabric) as Record<string, string> | null,
    gsm: product.gsm ?? product.category.gsm,
    // Ticari ayarlardaki global minimum hiçbir ürün/kategori kaydı tarafından
    // aşağı çekilemez. Eski içe aktarımlardaki 50/100 gibi değerler bu yüzden
    // public ürün sayfasında yeniden görünmez.
    moq: Math.max(product.moq ?? 0, product.category.moq ?? 0, settings.moqPieces),
    leadTimeDays: product.leadTimeDays ?? product.category.leadTimeDays,
    packaging: (product.packaging ?? product.category.packaging) as Record<string, string> | null,
    privateLabel: product.privateLabel ?? product.category.privateLabel,
    printType: (product.printType ?? product.category.printType) as Record<string, string> | null,
  };

  const prices = resolvePrices(
    product,
    product.category,
    settings.eurRate,
    product.priceEurOverride as Record<string, number> | null,
  );

  const allSizes = [...new Set(product.variants.flatMap((v) => v.sizes))];
  const sizeRange =
    allSizes.length > 1 ? `${allSizes[0]}–${allSizes[allSizes.length - 1]}` : (allSizes[0] ?? null);

  const related = await getRelatedProducts(categorySlug, product.id, locale, 4);
  const pageUrl = `${SITE}/${locale}/products/${categorySlug}/${slug}`;
  const ogImage = mediaUrl(product.variants[0]?.images[0], "full");

  const specRows = [
    { label: t("fabric"), value: spec.fabric?.[locale] ?? null },
    { label: t("gsm"), value: spec.gsm ? `${spec.gsm} gsm` : null },
    { label: t("sizeRange"), value: sizeRange },
    { label: t("colours"), value: t("colourCount", { count: product.variants.length }) },
    { label: t("moq"), value: `${spec.moq}` },
    {
      label: t("leadTime"),
      value: spec.leadTimeDays ? t("leadTimeDays", { days: spec.leadTimeDays }) : null,
    },
    { label: t("packaging"), value: spec.packaging?.[locale] ?? null },
    { label: t("printType"), value: spec.printType?.[locale] ?? null },
    {
      label: t("privateLabel"),
      value: spec.privateLabel ? t("privateLabelYes") : t("privateLabelNo"),
    },
  ].filter((r) => r.value);

  /* ------------------------------------------------------------- JSON-LD */
  const priceSpecs = TIERS.map((tier) => ({
    "@type": "UnitPriceSpecification",
    price: prices.usd[tier],
    priceCurrency: "USD",
    eligibleQuantity: { "@type": "QuantitativeValue", minValue: tier, unitCode: "C62" },
  })).filter((s) => s.price !== null);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name,
        sku: product.productCode,
        description: tr?.shortDescription ?? undefined,
        image: ogImage
          ? [ogImage.startsWith("http") ? ogImage : `${SITE}${ogImage}`]
          : undefined,
        brand: { "@type": "Brand", name: "THE CHAMP GLOBAL" },
        category: categoryName,
        color: product.variants.map((v) => v.color),
        ...(priceSpecs.length > 0
          ? {
              offers: {
                "@type": "Offer",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
                url: pageUrl,
                priceSpecification: priceSpecs,
              },
            }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: tNav("products"), item: `${SITE}/${locale}/products` },
          {
            "@type": "ListItem",
            position: 2,
            name: categoryName,
            item: `${SITE}/${locale}/products/${categorySlug}`,
          },
          { "@type": "ListItem", position: 3, name, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <>
      {/* JSON-LD sunucuda HTML'e basılır. `next/script` ile basılırsa
          etiket ancak hydration sonrası eklenir; JS çalıştırmayan tarayıcılar
          ve sosyal/ARAMA crawler'ları veriyi hiç görmez. */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Section className="pt-6 md:pt-8">
        <Container>
          <Breadcrumbs
            locale={locale}
            items={[
              { href: "/products", label: tNav("products") },
              { href: `/products/${categorySlug}`, label: categoryName },
              { href: `/products/${categorySlug}/${slug}`, label: name },
            ]}
          />

          <header className="mt-8 mb-10 max-w-3xl">
            <p className="tabular eyebrow">
              {product.productCode} · {categoryName} · {label(SECTION_LABELS, product.section, locale)}
            </p>
            <h1 className="mt-4 text-h1 text-fg">{name}</h1>
            {tr?.shortDescription ? (
              <p className="mt-4 text-muted">{tr.shortDescription}</p>
            ) : null}
          </header>

          <ProductBuyPanel
            locale={locale}
            prices={prices}
            productId={product.id}
            productCode={product.productCode}
            productName={name}
            slug={slug}
            categorySlug={categorySlug}
            sizeRange={sizeRange}
            whatsappNumber={settings.whatsappNumber}
            pageUrl={pageUrl}
            moq={spec.moq}
            variants={product.variants.map((v) => ({
              color: v.color,
              colorTr: v.colorTr,
              colorHex: v.colorHex,
              images: v.images,
              sizes: v.sizes,
            }))}
          />

          <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-16">
            <section aria-labelledby="specs">
              <h2 id="specs" className="eyebrow mb-5">
                {t("specs")}
              </h2>
              <dl className="text-sm">
                {specRows.map((row) => (
                  <div key={row.label} className="hairline flex gap-6 py-3.5">
                    <dt className="w-40 shrink-0 text-muted">{row.label}</dt>
                    <dd className="text-fg">{row.value}</dd>
                  </div>
                ))}
                {allSizes.length > 0 ? (
                  <div className="hairline flex gap-6 py-3.5">
                    <dt className="w-40 shrink-0 text-muted">{t("sizes")}</dt>
                    <dd className="tabular text-fg">{allSizes.join(" · ")}</dd>
                  </div>
                ) : null}
              </dl>
              <p className="mt-6 text-xs text-faint">{tPrice("terms")}</p>
            </section>

            {tr?.description ? (
              <section aria-labelledby="description">
                <h2 id="description" className="eyebrow mb-5">
                  {t("description")}
                </h2>
                <div className="space-y-4 text-sm leading-relaxed text-muted">
                  {tr.description.split("\n\n").map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </Container>
      </Section>

      {related.length > 0 ? (
        <Section bleed className="border-t border-line">
          <Container>
            <SectionHeader title={t("related")} />
            <ProductGrid>
              {related.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  locale={locale}
                  eurRate={settings.eurRate}
                />
              ))}
            </ProductGrid>
          </Container>
        </Section>
      ) : null}
    </>
  );
}
