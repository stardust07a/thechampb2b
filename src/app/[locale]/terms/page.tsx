import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { routing, type Locale } from "@/i18n/routing";
import { alternatesFor } from "@/lib/alternates";
import { LegalPage } from "@/components/site/legal-page";
import { TERMS } from "@/content/legal";

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
  const doc = TERMS[locale as Locale];
  return {
    title: doc.title,
    description: doc.sections[0]?.body[0]?.slice(0, 160),
    alternates: alternatesFor(locale, "/terms"),
    robots: { index: true, follow: true },
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  return <LegalPage locale={locale} doc={TERMS[locale]} />;
}
