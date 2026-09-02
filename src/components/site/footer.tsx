import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/section";
import { getSettings, whatsappLink } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";
import { Wordmark } from "./wordmark";

/**
 * Footer — brief §4.1/13.
 * Sitede e-posta adresi mutlaka görünür olacak (brief §17.11).
 */
export async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "footer" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tContact = await getTranslations({ locale, namespace: "contact" });
  const settings = await getSettings();

  const categories = await prisma.category
    .findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: { slug: true, translations: { where: { locale }, select: { name: true } } },
    })
    .catch(() => []);

  const social = Object.entries(settings.social).filter(([, url]) => url);

  return (
    <footer className="mt-auto border-t border-line bg-bg-2">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Wordmark className="h-6" />
            <p className="mt-5 max-w-xs text-sm text-muted">{t("tagline")}</p>
            <ul className="mt-6 space-y-3 text-sm">
              <li>
                <a
                  href={`mailto:${settings.inquiryEmail}`}
                  className="inline-flex items-center gap-2.5 text-muted transition-colors hover:text-fg"
                >
                  <Mail className="size-4 shrink-0" aria-hidden />
                  {settings.inquiryEmail}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${settings.phone.replace(/\s/g, "")}`}
                  className="tabular inline-flex items-center gap-2.5 text-muted transition-colors hover:text-fg"
                  dir="ltr"
                >
                  <Phone className="size-4 shrink-0" aria-hidden />
                  {settings.phone}
                </a>
              </li>
              <li>
                <a
                  href={whatsappLink(settings.whatsappNumber, "Hello THE CHAMP GLOBAL,")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 text-muted transition-colors hover:text-fg"
                >
                  <MessageCircle className="size-4 shrink-0" aria-hidden />
                  {tContact("whatsapp")}
                </a>
              </li>
              <li className="inline-flex items-center gap-2.5 text-muted">
                <MapPin className="size-4 shrink-0" aria-hidden />
                {settings.address}
              </li>
            </ul>
          </div>

          <nav aria-labelledby="footer-categories">
            <h2 id="footer-categories" className="eyebrow mb-5">
              {t("categories")}
            </h2>
            <ul className="space-y-2.5 text-sm">
              {categories.slice(0, 8).map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/products/${c.slug}`}
                    className="text-muted transition-colors hover:text-fg"
                  >
                    {c.translations[0]?.name ?? c.slug}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/products" className="text-fg transition-colors hover:text-muted">
                  {tNav("products")} →
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-company">
            <h2 id="footer-company" className="eyebrow mb-5">
              {t("company")}
            </h2>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/what-we-do" className="text-muted transition-colors hover:text-fg">
                  {tNav("whatWeDo")}
                </Link>
              </li>
              <li>
                <Link href="/manufacturing" className="text-muted transition-colors hover:text-fg">
                  {tNav("manufacturing")}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted transition-colors hover:text-fg">
                  {tNav("about")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted transition-colors hover:text-fg">
                  {tNav("contact")}
                </Link>
              </li>
              <li>
                <Link href="/inquiry" className="text-muted transition-colors hover:text-fg">
                  {tNav("inquiry")}
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="eyebrow mb-5">{t("legal")}</h2>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/privacy" className="text-muted transition-colors hover:text-fg">
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted transition-colors hover:text-fg">
                  {t("termsPage")}
                </Link>
              </li>
            </ul>

            {social.length > 0 ? (
              <>
                <h2 className="eyebrow mt-8 mb-4">{t("follow")}</h2>
                <ul className="flex flex-wrap gap-3 text-sm">
                  {social.map(([name, url]) => (
                    <li key={name}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="capitalize text-muted transition-colors hover:text-fg"
                      >
                        {name}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </div>

        <div className="hairline mt-14 flex flex-wrap items-center justify-between gap-4 pt-6 text-sm text-faint">
          <p>
            © {new Date().getFullYear()} THE CHAMP GLOBAL. {t("rights")}
          </p>
          <p>{t("madeIn")}</p>
        </div>
      </Container>
    </footer>
  );
}
