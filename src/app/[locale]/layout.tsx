import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Outfit, Tajawal } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Toaster } from "sonner";

import "../globals.css";
import { dirFor, routing, type Locale } from "@/i18n/routing";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ThemeScript } from "@/components/site/theme-script";
import { CurrencyProvider } from "@/components/site/currency-provider";
import { InquiryProvider } from "@/components/site/inquiry-store";
import { getSettings, whatsappLink } from "@/lib/settings";

/** Brief §3.2: tek aile Outfit, Arapça için Tajawal. Subset: latin, latin-ext, arabic. */
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  display: "swap",
  weight: ["300", "400", "500", "700", "800"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    metadataBase: new URL(base),
    title: {
      default: `THE CHAMP GLOBAL — ${t("homeTitle")}`,
      template: "%s | THE CHAMP GLOBAL",
    },
    description: t("homeDescription"),
    applicationName: "THE CHAMP GLOBAL",
    openGraph: {
      siteName: "THE CHAMP GLOBAL",
      type: "website",
      locale,
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const settings = await getSettings();
  const t = await getTranslations({ locale, namespace: "nav" });

  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      className={`${outfit.variable} ${tajawal.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <CurrencyProvider defaultCurrency={settings.defaultCurrency}>
            <InquiryProvider>
              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-[--radius-inner] focus:bg-surface-2 focus:px-4 focus:py-2 focus:text-sm"
              >
                {t("skipToContent")}
              </a>
              <Header
                whatsappHref={whatsappLink(
                  settings.whatsappNumber,
                  "Hello THE CHAMP GLOBAL, I would like to request a quotation.",
                )}
              />
              <main id="main" className="flex-1">
                {children}
              </main>
              <Footer locale={locale as Locale} />
              <Toaster
                position="bottom-right"
                dir={dirFor(locale)}
                toastOptions={{
                  classNames: {
                    toast:
                      "!bg-[var(--surface-2)] !border-[var(--border)] !text-[var(--text)] !rounded-[var(--radius-sm)]",
                    description: "!text-[var(--text-muted)]",
                  },
                }}
              />
            </InquiryProvider>
          </CurrencyProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
