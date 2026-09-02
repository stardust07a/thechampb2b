"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * "Load more" — sayfa numarasını URL'e yazar (brief §4.2: durum URL'de,
 * paylaşılabilir). Sayfa başına 48 ürün; 819'u tek DOM'a basmayız.
 */
export function LoadMore({ nextPage }: { nextPage: number }) {
  const t = useTranslations("catalog");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function loadMore() {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(nextPage));
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  }

  return (
    <Button variant="primary" size="lg" onClick={loadMore} disabled={pending}>
      {t("loadMore")}
    </Button>
  );
}
