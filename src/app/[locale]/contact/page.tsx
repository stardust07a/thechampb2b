import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { alternatesFor } from "@/lib/alternates";
import { Container, Section } from "@/components/ui/section";
import { InquiryFormSection } from "@/components/site/inquiry-form-section";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("contactTitle"),
    description: t("contactDescription"),
    alternates: alternatesFor(locale, "/contact"),
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "contact" });

  return (
    <>
      <Section className="pb-0 pt-10 md:pt-14">
        <Container>
          <header className="max-w-2xl">
            <h1 className="chrome-text text-h1">{t("title")}</h1>
            <p className="mt-4 text-muted">{t("subtitle")}</p>
          </header>
        </Container>
      </Section>
      <InquiryFormSection locale={locale} />
    </>
  );
}
