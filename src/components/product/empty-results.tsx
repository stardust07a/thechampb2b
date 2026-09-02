"use client";

import { SearchX } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/** Boş sonuç durumu — brief §4.2 (search-ux). */
export function EmptyResults() {
  const t = useTranslations("catalog");
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-md rounded-[--radius-card] border border-line bg-surface px-6 py-16 text-center">
      <SearchX className="mx-auto size-7 text-faint" aria-hidden />
      <h2 className="mt-5 text-h3 text-fg">{t("noResults")}</h2>
      <p className="mt-3 text-sm text-muted">{t("noResultsBody")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="solid" size="md" onClick={() => router.replace(pathname)}>
          {t("resetAndBrowse")}
        </Button>
        <Button asChild variant="outline" size="md">
          <Link href="/contact">{t("askInstead")}</Link>
        </Button>
      </div>
    </div>
  );
}
