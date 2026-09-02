import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { routing, type Locale } from "@/i18n/routing";
import { Container, Section } from "@/components/ui/section";
import { RichText } from "@/components/site/rich-text";
import { EditorialHero } from "@/components/site/editorial-hero";
import { BRAND_STORY } from "@/content/brand";
import { getSlot } from "@/lib/media-slots";

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
    title: t("aboutTitle"),
    description: t("aboutDescription"),
    alternates: {
      canonical: `/${locale}/about`,
      languages: Object.fromEntries([
        ...routing.locales.map((l) => [l, `/${l}/about`]),
        ["x-default", `/${routing.defaultLocale}/about`],
      ]),
    },
  };
}

/** /about — marka metni brief §13.1/13.2. Sloganlar her dilde İngilizce kalır. */
export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "about" });
  const tBrand = await getTranslations({ locale, namespace: "brand" });
  const hero = await getSlot("page:about:hero");

  return (
    <>
      <EditorialHero
        media={hero}
        eyebrow={t("title")}
        title={tBrand("tagline")}
        titleClassName="max-w-[16ch] md:text-[clamp(2.7rem,5.8vw,4.5rem)]"
      />

      <Section>
        <Container>
          <div className="max-w-3xl space-y-7 text-[17px] leading-relaxed text-muted">
            {BRAND_STORY[locale].map((paragraph, i) => (
              <p key={i}>
                <RichText text={paragraph} />
              </p>
            ))}
          </div>

          <p className="chrome-text mt-16 max-w-4xl text-[clamp(1.35rem,3.6vw,2.25rem)] font-bold leading-tight">
            {tBrand("closing")}
          </p>
        </Container>
      </Section>
    </>
  );
}
