import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { alternatesFor } from "@/lib/alternates";
import { Container, Section } from "@/components/ui/section";
import { InquiryList } from "@/components/site/inquiry-list";
import { getSettings } from "@/lib/settings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("inquiryTitle"),
    description: t("inquiryDescription"),
    alternates: alternatesFor(locale, "/inquiry"),
    robots: { index: false, follow: true },
  };
}

export default async function InquiryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "inquiry" });
  const settings = await getSettings();

  return (
    <Section className="pt-10 md:pt-14">
      <Container>
        <header className="mb-12 max-w-2xl">
          <h1 className="chrome-text text-h1">{t("title")}</h1>
          <p className="mt-4 text-muted">{t("subtitle")}</p>
        </header>

        <InquiryList
          whatsappNumber={settings.whatsappNumber}
          inquiryEmail={settings.inquiryEmail}
          moq={settings.moqPieces}
          siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""}
        />
      </Container>
    </Section>
  );
}
