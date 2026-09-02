import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeader } from "@/components/ui/section";
import { ECOSYSTEM_STEPS } from "@/content/what-we-do";

/**
 * Ana sayfadaki kısaltılmış "What We Do" bloğu — brief §13.4:
 * sadece numara + İngilizce başlık + tek cümle, CTA /what-we-do'ya bağlanır.
 */
export async function EcosystemStrip({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <Section>
      <Container>
        <SectionHeader
          eyebrow={t("ecosystemSubtitle")}
          title={t("ecosystemTitle")}
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/what-we-do">
                {t("ecosystemCta")}
                <ArrowRight className="rtl:-scale-x-100" aria-hidden />
              </Link>
            </Button>
          }
        />

        <ol className="grid gap-x-8 gap-y-9 md:grid-cols-2 lg:grid-cols-3">
          {ECOSYSTEM_STEPS.map((step, i) => (
            <li
              key={step.number}
              className="hairline rise pt-5"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <p className="tabular text-sm text-faint">{step.number}</p>
              <h3 className="chrome-text mt-2.5 text-[15px] font-semibold tracking-[0.01em]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-muted">{step.intro[locale]}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
