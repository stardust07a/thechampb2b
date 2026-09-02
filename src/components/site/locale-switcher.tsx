"use client";

import { useParams } from "next/navigation";
import { useTransition } from "react";
import { Check, Globe } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_LABELS, LOCALE_SHORT, routing, type Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Dil seçici. Engelleyici modal YOK (brief §17.5) — sadece menü.
 * Dil URL'de tutulur, localStorage'da değil (brief §17.7).
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [pending, startTransition] = useTransition();
  const current = (params.locale as Locale) ?? routing.defaultLocale;

  function switchTo(next: Locale) {
    startTransition(() => {
      // aynı sayfada kal, sadece locale değiştir
      router.replace(
        // @ts-expect-error dinamik segmentler pathname ile birlikte taşınır
        { pathname, params },
        { locale: next },
      );
    });
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-1.5", className)}
          aria-label={t("language")}
          disabled={pending}
        >
          <Globe aria-hidden />
          <span className="tabular">{LOCALE_SHORT[current]}</span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-44 rounded-[--radius-inner] border border-line bg-surface-2 p-1.5 shadow-card"
        >
          {routing.locales.map((locale) => (
            <DropdownMenu.Item
              key={locale}
              onSelect={() => switchTo(locale)}
              lang={locale}
              dir={locale === "ar" ? "rtl" : "ltr"}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 rounded-[8px] px-3 py-2",
                "text-sm outline-none transition-colors",
                locale === current ? "text-fg" : "text-muted",
                "focus:bg-surface focus:text-fg data-[highlighted]:bg-surface data-[highlighted]:text-fg",
              )}
            >
              <span>{LOCALE_LABELS[locale]}</span>
              {locale === current ? <Check className="size-4" aria-hidden /> : null}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
