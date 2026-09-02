import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { isRtl, type Locale } from "@/i18n/routing";

/**
 * Breadcrumb. RTL'de ayraç aynalanır (brief §10).
 * JSON-LD BreadcrumbList ürün/kategori sayfalarında ayrıca basılır.
 */
export async function Breadcrumbs({
  locale,
  items,
}: {
  locale: Locale;
  items: { href: string; label: string }[];
}) {
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <nav aria-label={t("breadcrumb")}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <li>
          <Link href="/" className="transition-colors hover:text-fg">
            {t("home")}
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={item.href} className="flex items-center gap-1.5">
            <ChevronRight
              className={`size-3.5 text-faint ${isRtl(locale) ? "-scale-x-100" : ""}`}
              aria-hidden
            />
            {i === items.length - 1 ? (
              <span aria-current="page" className="text-fg">
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className="transition-colors hover:text-fg">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
