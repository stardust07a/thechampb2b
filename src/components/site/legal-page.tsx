import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { Container, Section } from "@/components/ui/section";
import { getSettings } from "@/lib/settings";
import type { LegalDoc } from "@/content/legal";

/** Yasal metin şablonu — {email} yer tutucusu ayarlardan dolar. */
export async function LegalPage({ locale, doc }: { locale: Locale; doc: LegalDoc }) {
  const settings = await getSettings();
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const fill = (s: string) => s.replaceAll("{email}", settings.inquiryEmail);

  return (
    <Section className="pt-10 md:pt-14">
      <Container>
        <header className="mb-12 max-w-2xl">
          <h1 className="chrome-text text-h1">{doc.title}</h1>
          <p className="tabular mt-3 text-sm text-faint">
            <time dateTime={doc.updated}>{doc.updated}</time>
          </p>
        </header>

        <div className="max-w-2xl space-y-10">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-h3 text-fg">{section.heading}</h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted">
                {section.body.map((p, i) => (
                  <p key={i}>{fill(p)}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-16 text-sm text-faint">
          {tCommon("home")} ·{" "}
          <a href={`mailto:${settings.inquiryEmail}`} className="text-muted hover:text-fg">
            {settings.inquiryEmail}
          </a>
        </p>
      </Container>
    </Section>
  );
}
