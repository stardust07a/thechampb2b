import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { EditorialHero } from "@/components/site/editorial-hero";
import { Container, Section, SectionHeader } from "@/components/ui/section";
import { CAPABILITIES } from "@/content/brand";
import { ECOSYSTEM_STEPS } from "@/content/what-we-do";
import { getSettings } from "@/lib/settings";
import { formatNumber } from "@/lib/format";
import { getAllSlots, slotAlt } from "@/lib/media-slots";

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
    title: t("manufacturingTitle"),
    description: t("manufacturingDescription"),
    alternates: {
      canonical: `/${locale}/manufacturing`,
      languages: Object.fromEntries([
        ...routing.locales.map((l) => [l, `/${l}/manufacturing`]),
        ["x-default", `/${routing.defaultLocale}/manufacturing`],
      ]),
    },
  };
}

/**
 * /manufacturing — brief §4.6.
 * Fabrika görselleri ve sertifikalar henüz gelmedi (brief §16); veri girilene
 * kadar o bölümler render EDİLMEZ — boş kutu bırakılmaz (brief §7).
 */
export default async function ManufacturingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "manufacturing" });
  const tTerms = await getTranslations({ locale, namespace: "terms" });
  const tHome = await getTranslations({ locale, namespace: "home" });
  const settings = await getSettings();
  const slots = await getAllSlots();
  const hero = slots.get("page:manufacturing:hero") ?? null;
  const gallery = ["1", "2", "3", "4"]
    .map((n) => slots.get(`page:manufacturing:${n}`))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  // Üretim süreci = ekosistemin 03-08 adımları
  const processSteps = ECOSYSTEM_STEPS.filter((s) =>
    ["03", "04", "05", "06", "07", "08"].includes(s.number),
  );

  const facts = [
    { label: tHome("trust.founded"), value: String(settings.foundedYear) },
    {
      label: tHome("trust.moq"),
      value: `${formatNumber(settings.moqPieces, locale)} ${tHome("trust.pieces")}`,
    },
    settings.monthlyCapacity
      ? {
          label: tHome("trust.capacity"),
          value: `${formatNumber(settings.monthlyCapacity, locale)} ${tHome("trust.pieces")}`,
        }
      : null,
    settings.bulkLeadTimeDays
      ? { label: t("bulkLeadTime"), value: settings.bulkLeadTimeDays }
      : null,
    settings.sampleLeadTimeDays
      ? { label: t("sampleLeadTime"), value: settings.sampleLeadTimeDays }
      : null,
  ].filter((f): f is { label: string; value: string } => f !== null);

  return (
    <>
      <EditorialHero
        media={hero}
        eyebrow={t("title")}
        title={t("subtitle")}
        titleClassName="max-w-[18ch] md:text-[clamp(2.5rem,5.2vw,3.75rem)]"
      />

      <Section>
        <Container>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {facts.map((f) => (
              <div
                key={f.label}
                className="rounded-[--radius-card] border border-line bg-surface p-6"
              >
                <dt className="eyebrow">{f.label}</dt>
                <dd className="tabular mt-3 text-h2 font-bold text-fg">{f.value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      <Section bleed className="border-y border-line">
        <Container>
          <SectionHeader title={t("capabilities")} />
          <ul className="grid gap-x-10 gap-y-9 md:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES[locale].map((c, i) => (
              <li
                key={c.title}
                className="hairline rise pt-5"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <p className="tabular text-sm text-faint">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 text-h3 text-fg">{c.title}</h3>
                <p className="mt-2.5 text-sm text-muted">{c.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {gallery.length > 0 ? (
        <Section>
          <Container>
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {gallery.map((item) => (
                <li
                  key={item.key}
                  className="relative aspect-[3/4] overflow-hidden rounded-[--radius-card] border border-line bg-surface"
                >
                  <Image
                    src={item.url}
                    alt={slotAlt(item, locale)}
                    fill
                    sizes="(min-width:768px) 24vw, 45vw"
                    className="object-cover"
                    unoptimized={item.url.startsWith("http")}
                  />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      <Section>
        <Container>
          <SectionHeader title={t("process")} />
          <ol className="relative border-s border-line-soft ps-6 md:ps-10">
            {processSteps.map((step, i) => (
              <li
                key={step.number}
                className="rise relative pb-10 last:pb-0"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span
                  aria-hidden
                  className="absolute -start-[calc(1.5rem+4px)] top-2.5 size-2 rounded-full bg-chrome-1 md:-start-[calc(2.5rem+4px)]"
                />
                <p className="tabular text-sm text-faint">{step.number}</p>
                <h3 className="chrome-text mt-2 text-h3 tracking-[0.01em]">{step.title}</h3>
                <p className="mt-2 max-w-2xl text-sm text-muted">{step.intro[locale]}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section bleed className="border-y border-line">
        <Container>
          <SectionHeader title={t("terms")} />
          <ul className="max-w-3xl">
            {[
              tTerms("moq", { count: formatNumber(settings.moqPieces, locale) }),
              tTerms("logoPrint", { count: formatNumber(settings.logoPrintFrom, locale) }),
              tTerms("customDesign", { count: formatNumber(settings.customDesignFrom, locale) }),
              tTerms("labelChange", { count: formatNumber(settings.labelChangeFrom, locale) }),
              tTerms("shipping"),
              tTerms("logistics"),
              tTerms("exw"),
            ].map((line) => (
              <li key={line} className="hairline py-4 text-muted">
                {line}
              </li>
            ))}
          </ul>

          <div className="mt-12 flex flex-wrap gap-3">
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
      </Section>

      {settings.certificates.length > 0 ? (
        <Section>
          <Container>
            <SectionHeader title={t("certificates")} />
            <ul className="flex flex-wrap gap-3">
              {settings.certificates.map((c) => (
                <li
                  key={c}
                  className="rounded-[--radius-pill] border border-line px-4 py-2 text-sm text-muted"
                >
                  {c}
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}
    </>
  );
}
