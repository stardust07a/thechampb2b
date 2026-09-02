import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Download } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { alternatesFor } from "@/lib/alternates";
import { Container, Section, SectionHeader } from "@/components/ui/section";
import { Hero } from "@/components/site/hero";
import { ProductCard } from "@/components/product/product-card";
import { ProductRail, RailItem } from "@/components/product/product-grid";
import { EcosystemStrip } from "@/components/site/ecosystem-strip";
import { InquiryFormSection } from "@/components/site/inquiry-form-section";
import { getCategories, getHomeSection, listProducts } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { getSlot, getVideos, slotAlt } from "@/lib/media-slots";
import { VideoReel } from "@/components/site/video-reel";
import { HomeSectionNav, type HomeSectionLink } from "@/components/site/home-section-nav";
import { IMAGE_PLACEHOLDER, mediaUrl } from "@/lib/media";
import { formatNumber } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    alternates: alternatesFor(locale, ""),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "home" });
  const tTerms = await getTranslations({ locale, namespace: "terms" });
  const settings = await getSettings();

  const [categories, bestsellers, featured, newArrivals, heroPool, videos, banner2] =
    await Promise.all([
      getCategories(locale),
      getHomeSection("bestsellers", locale),
      getHomeSection("featured", locale),
      getHomeSection("new", locale),
      listProducts(locale, { perPage: 1, sort: "newest" }),
      getVideos(),
      getSlot("page:home:banner2"),
    ]);

  const totalProducts = heroPool.total;

  const railProps = { locale, eurRate: settings.eurRate };

  const stats = [
    { label: t("trust.founded"), value: String(settings.foundedYear) },
    {
      label: t("trust.capacity"),
      value: settings.monthlyCapacity
        ? `${formatNumber(settings.monthlyCapacity, locale)} ${t("trust.pieces")}`
        : t("trust.capacityPending"),
    },
    {
      label: t("trust.moq"),
      value: `${formatNumber(settings.moqPieces, locale)} ${t("trust.pieces")}`,
    },
    {
      label: t("trust.countries"),
      value: settings.exportCountries
        ? formatNumber(settings.exportCountries, locale)
        : t("trust.countriesPending"),
    },
  ];

  const whyKeys = [
    "onePartner",
    "lowMoq",
    "privateLabel",
    "ownFabric",
    "quality",
    "global",
  ] as const;

  const sectionLinks: HomeSectionLink[] = [
    { id: "home-categories", label: t("categoriesTitle") },
    ...(videos.length > 0
      ? [{ id: "home-videos", label: t("videoNavLabel") }]
      : []),
    { id: "home-what-we-do", label: t("ecosystemTitle") },
    { id: "home-production", label: t("productionTitle") },
    { id: "home-why", label: t("whyTitle") },
    { id: "home-catalog", label: t("catalogTitle") },
    { id: "contact", label: t("contactTitle") },
  ];

  return (
    <>
      <Hero locale={locale} />
      <HomeSectionNav label={t("sectionNavigation")} sections={sectionLinks} />

      {/* 3 — Güven şeridi */}
      <section
        id="home-content"
        className="scroll-mt-16 border-b border-line bg-bg-2 md:scroll-mt-18"
      >
        <Container>
          <dl className="grid grid-cols-2 divide-line md:grid-cols-4 md:divide-x rtl:md:divide-x-reverse">
            {stats.map((s) => (
              <div key={s.label} className="px-2 py-8 text-center md:px-6">
                <dt className="eyebrow">{s.label}</dt>
                <dd className="tabular mt-2 text-h3 font-bold text-fg md:text-[1.75rem]">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* 4 — Kategoriler */}
      <Section id="home-categories" className="scroll-mt-20">
        <Container>
          <SectionHeader
            eyebrow={t("categoriesSubtitle", {
              count: formatNumber(categories.length, locale),
            })}
            title={t("categoriesTitle")}
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/products">
                  {t("viewAll")}
                  <ArrowRight className="rtl:-scale-x-100" aria-hidden />
                </Link>
              </Button>
            }
          />

          <ul className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-4">
            {categories.map((c) => {
              const cover = mediaUrl(c.coverImage, "card");
              return (
                <li key={c.slug}>
                  <Link
                    href={`/products/${c.slug}`}
                    className="group relative block overflow-hidden rounded-[--radius-card] border border-line bg-surface transition-colors duration-300 hover:border-chrome-1"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      {cover ? (
                        <Image
                          src={cover}
                          alt=""
                          aria-hidden
                          fill
                          sizes="(min-width:768px) 24vw, 45vw"
                          placeholder="blur"
                          blurDataURL={IMAGE_PLACEHOLDER}
                          className="object-cover transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div
                          aria-hidden
                          className="size-full bg-surface-2"
                          style={{
                            backgroundImage:
                              "radial-gradient(90% 70% at 50% 0%, rgb(126 129 140 / 0.12) 0%, transparent 65%)",
                          }}
                        />
                      )}
                      <div aria-hidden className="absolute inset-0 category-card-scrim" />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <h3 className="text-[15px] font-semibold text-fg">
                        {c.translations[0]?.name ?? c.slug}
                      </h3>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>

      {/* 5 — Best Sellers */}
      {bestsellers ? (
        <Section bleed className="border-y border-line">
          <Container>
            <SectionHeader title={bestsellers.title} />
          </Container>
          <Container className="px-0 md:px-0">
            <ProductRail>
              {bestsellers.products.map((p) => (
                <RailItem key={p.id}>
                  <ProductCard product={p} {...railProps} sizes="(min-width:1024px) 22vw, 62vw" />
                </RailItem>
              ))}
            </ProductRail>
          </Container>
        </Section>
      ) : null}

      {/* 6 — Banner 2: üretim kabiliyeti */}
      <section className="relative isolate scroll-mt-20 overflow-hidden border-b border-line">
        {banner2 ? (
          <>
            <Image
              src={banner2.url}
              alt=""
              aria-hidden
              fill
              quality={90}
              sizes="100vw"
              className="-z-10 object-cover object-center"
              unoptimized={banner2.url.startsWith("http")}
            />
            <div
              aria-hidden
              className="absolute inset-0 -z-10"
              style={{ background: "var(--hero-scrim)" }}
            />
          </>
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-bg-2"
            style={{
              backgroundImage:
                "radial-gradient(110% 100% at 100% 0%, rgb(126 129 140 / 0.14) 0%, transparent 62%)",
            }}
          />
        )}
        <Container className="py-20 md:py-28">
          <p className="eyebrow">{t("banner2.eyebrow")}</p>
          <h2 className="chrome-text mt-5 max-w-[14ch] text-[clamp(2rem,6vw,3.5rem)] leading-[1.05]">
            {t("banner2.title")}
          </h2>
          <p className="mt-5 max-w-2xl text-muted">
            {t("banner2.body", {
              moq: formatNumber(settings.moqPieces, locale),
              logo: formatNumber(settings.logoPrintFrom, locale),
              custom: formatNumber(settings.customDesignFrom, locale),
              label: formatNumber(settings.labelChangeFrom, locale),
            })}
          </p>
          <Button asChild variant="primary" size="lg" className="mt-9">
            <Link href="/manufacturing">
              {t("banner2.cta")}
              <ArrowRight className="rtl:-scale-x-100" aria-hidden />
            </Link>
          </Button>
        </Container>
      </section>

      {/* 7 — Featured */}
      {featured ? (
        <Section>
          <Container>
            <SectionHeader title={featured.title} />
          </Container>
          <Container className="px-0 md:px-0">
            <ProductRail>
              {featured.products.map((p) => (
                <RailItem key={p.id}>
                  <ProductCard product={p} {...railProps} sizes="(min-width:1024px) 22vw, 62vw" />
                </RailItem>
              ))}
            </ProductRail>
          </Container>
        </Section>
      ) : null}

      {/* 8 — New Arrivals */}
      {newArrivals ? (
        <Section bleed className="border-y border-line">
          <Container>
            <SectionHeader title={newArrivals.title} />
          </Container>
          <Container className="px-0 md:px-0">
            <ProductRail>
              {newArrivals.products.map((p) => (
                <RailItem key={p.id}>
                  <ProductCard product={p} {...railProps} sizes="(min-width:1024px) 22vw, 62vw" />
                </RailItem>
              ))}
            </ProductRail>
          </Container>
        </Section>
      ) : null}

      {/* Admin panelindeki dikey videolar: Banner 2 ile Ne Yapıyoruz arasında. */}
      {videos.length > 0 ? (
        <section
          id="home-videos"
          className="scroll-mt-20 overflow-hidden border-y border-line bg-bg py-14 md:py-20"
        >
          <Container>
            <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-muted">
              {t("videoShowcaseTitle")}
            </p>
          </Container>
          <div className="mt-8 md:mt-10">
            <VideoReel
              videos={videos.map((v) => ({
                key: v.key,
                url: v.url,
                alt: slotAlt(v, locale),
              }))}
            />
          </div>
        </section>
      ) : null}

      {/* 9 — What We Do kısaltılmış şerit */}
      <EcosystemStrip locale={locale} id="home-what-we-do" />

      {/* 10 — Üretim ve kalite */}
      <Section id="home-production" bleed className="scroll-mt-20 border-y border-line">
        <Container className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeader title={t("productionTitle")} className="mb-6" />
            <p className="max-w-xl text-muted">{t("productionBody")}</p>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                tTerms("moq", { count: formatNumber(settings.moqPieces, locale) }),
                tTerms("logoPrint", { count: formatNumber(settings.logoPrintFrom, locale) }),
                tTerms("customDesign", { count: formatNumber(settings.customDesignFrom, locale) }),
                tTerms("labelChange", { count: formatNumber(settings.labelChangeFrom, locale) }),
                tTerms("logistics"),
                tTerms("exw"),
              ].map((line) => (
                <li key={line} className="hairline flex items-start gap-3 pt-3 text-muted">
                  <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-chrome-1" />
                  {line}
                </li>
              ))}
            </ul>
            <Button asChild variant="primary" className="mt-9">
              <Link href="/manufacturing">
                {t("banner2.cta")}
                <ArrowRight className="rtl:-scale-x-100" aria-hidden />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 self-start">
            {[
              { label: t("trust.moq"), value: `${settings.moqPieces}` },
              { label: t("trust.founded"), value: `${settings.foundedYear}` },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-[--radius-card] border border-line bg-surface p-6"
              >
                <p className="eyebrow">{s.label}</p>
                <p className="tabular mt-3 text-h2 font-bold text-fg">{s.value}</p>
              </div>
            ))}
            <div className="col-span-2 rounded-[--radius-card] border border-line bg-surface p-6">
              <p className="eyebrow">{t("productStylesTitle")}</p>
              <p className="tabular mt-3 text-h2 font-bold text-fg">
                {formatNumber(totalProducts, locale)}
              </p>
              <p className="mt-1 text-sm text-muted">{t("productStylesSubtitle")}</p>
            </div>
          </div>
        </Container>

      </Section>

      {/* 11 — Neden THE CHAMP */}
      <Section id="home-why" className="scroll-mt-20">
        <Container>
          <SectionHeader title={t("whyTitle")} />
          <ul className="grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {whyKeys.map((key, i) => (
              <li key={key} className="hairline pt-5">
                <p className="tabular text-sm text-faint">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 text-h3 text-fg">{t(`why.${key}.title`)}</h3>
                <p className="mt-2.5 text-sm text-muted">{t(`why.${key}.body`)}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* 12 — Katalog indir */}
      <Section id="home-catalog" bleed className="scroll-mt-20 border-y border-line">
        <Container className="flex flex-wrap items-center justify-between gap-8">
          <div className="max-w-xl">
            <h2 className="chrome-text text-h2">{t("catalogTitle")}</h2>
            <p className="mt-4 text-muted">{t("catalogBody")}</p>
          </div>
          <Button asChild variant="solid" size="lg">
            <a href={`/api/catalog/${locale}`} download>
              <Download aria-hidden />
              {t("catalogCta")}
            </a>
          </Button>
        </Container>
      </Section>

      {/* 13 — İletişim / teklif formu */}
      <InquiryFormSection locale={locale} />
    </>
  );
}
