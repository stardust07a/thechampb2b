import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/section";
import { RichText } from "@/components/site/rich-text";
import { EditorialHero } from "@/components/site/editorial-hero";
import { ECOSYSTEM_INTRO, ECOSYSTEM_STEPS } from "@/content/what-we-do";
import { getAllSlots } from "@/lib/media-slots";

export const revalidate = 86400;

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("whatWeDoTitle"),
    description: t("whatWeDoDescription"),
    alternates: {
      canonical: `/${locale}/what-we-do`,
      languages: Object.fromEntries([
        ...routing.locales.map((l) => [l, `/${l}/what-we-do`]),
        ["x-default", `/${routing.defaultLocale}/what-we-do`],
      ]),
    },
  };
}

/**
 * /what-we-do — brief §13.4.
 * Adım başlıkları her dilde İngilizce kalır; alt başlık, açıklama ve maddeler
 * çevrilir. Adımlar ince dikey bir çizgiyle birbirine bağlanır ("tek zincir")
 * ve scroll'da 40ms gecikmeyle sırayla belirir.
 */
export default async function WhatWeDoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "whatWeDo" });
  const tHome = await getTranslations({ locale, namespace: "home" });
  const slots = await getAllSlots();
  const hero = slots.get("page:what-we-do:hero") ?? null;
  const closing = slots.get("page:what-we-do:closing") ?? null;

  return (
    <>
      <EditorialHero
        media={hero}
        eyebrow={t("title")}
        title={t("subtitle")}
        titleClassName="max-w-[20ch] md:text-[clamp(2.4rem,5.2vw,3.75rem)]"
        body={
          <p>
            <RichText text={ECOSYSTEM_INTRO[locale]} />
          </p>
        }
      />

      <Section>
        <Container>
          {/* Zincir: her adım bloğu, solunda ince dikey çizgi taşır */}
          <ol className="relative border-s border-line-soft ps-6 md:ps-10">
            {ECOSYSTEM_STEPS.map((step, i) => (
              <li
                key={step.number}
                className="rise relative pb-14 last:pb-0"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* çizgi üzerindeki nokta */}
                <span
                  aria-hidden
                  className="absolute -start-[calc(1.5rem+4px)] top-2 size-2 rounded-full bg-chrome-1 md:-start-[calc(2.5rem+4px)]"
                />

                <p className="tabular text-[2.5rem] font-bold leading-none text-faint md:text-[3.5rem]">
                  {step.number}
                </p>

                <h2 className="chrome-text mt-4 text-h3 tracking-[0.01em] md:text-[1.75rem]">
                  {step.title}
                </h2>
                <p className="mt-1.5 text-sm text-muted">{step.subtitle[locale]}</p>

                <p className="mt-5 max-w-2xl leading-relaxed text-fg">{step.intro[locale]}</p>

                {step.highlight ? (
                  <div className="mt-8 max-w-2xl border-s-2 border-chrome-1 ps-5">
                    {step.highlight[locale].map((line) => (
                      <p
                        key={line}
                        className="text-[clamp(1.1rem,2.6vw,1.5rem)] font-semibold leading-snug text-fg"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                ) : null}

                <ul className="mt-7 max-w-2xl">
                  {step.bullets[locale].map((b) => (
                    <li key={b} className="hairline py-3 text-sm text-muted">
                      {b}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* Kapanış bloğu — sloganlar her dilde İngilizce */}
      <section className="relative isolate overflow-hidden border-t border-line py-16 text-center md:py-24">
        {closing ? (
          <>
            <Image
              src={closing.url}
              alt=""
              aria-hidden
              fill
              sizes="100vw"
              className="-z-10 object-cover object-center"
              unoptimized={closing.url.startsWith("http")}
            />
            <div
              aria-hidden
              className="absolute inset-0 -z-10"
              style={{ background: "var(--hero-scrim-v)" }}
            />
          </>
        ) : (
          <div aria-hidden className="absolute inset-0 -z-10 bg-bg-2" />
        )}
        <Container className="flex flex-col items-center">
          <h2 className="chrome-text text-[clamp(1.75rem,5vw,3rem)] leading-tight">
            {t("closingTitle")}
          </h2>

          <p className="mt-8 max-w-3xl text-muted">{t("closingVerbs")}</p>

          <p className="mt-14 text-h3 font-bold text-fg">{t("closingBrand")}</p>
          <p className="mt-2 text-muted">{t("closingLine")}</p>

          <div className="mt-10 space-y-1.5 text-sm text-muted">
            {t("closingPoem")
              .split("\n")
              .map((line) => (
                <p key={line}>{line}</p>
              ))}
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <Button asChild variant="solid" size="lg">
              <Link href="/inquiry">{tHome("requestQuote")}</Link>
            </Button>
            <Button asChild variant="primary" size="lg">
              <Link href="/products">
                {tHome("exploreCatalog")}
                <ArrowRight className="rtl:-scale-x-100" aria-hidden />
              </Link>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
