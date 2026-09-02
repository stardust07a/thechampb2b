"use client";

import { ShoppingCart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { usePathname } from "@/i18n/navigation";
import { useInquiry } from "./inquiry-store";

/**
 * Telefonda sepette ürün olduğunda her sayfadan ulaşılabilen alt eylem çubuğu.
 * Statik boşluk, sabit çubuğun sayfanın sonundaki içeriği kapatmasını engeller.
 */
export function MobileCartBar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const { count, totalQuantity, ready } = useInquiry();
  const visible = ready && count > 0 && pathname !== "/inquiry";

  return (
    <>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {ready && count > 0 ? t("cartSummary", { count, quantity: totalQuantity }) : ""}
      </span>

      {visible ? (
        <>
          <div className="h-24 md:hidden" aria-hidden />
          <div
            className="fixed inset-x-0 bottom-0 z-[70] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
          >
            <a
              href={`/${locale}/inquiry`}
              className="mx-auto flex min-h-14 w-full max-w-md touch-manipulation items-center gap-3 rounded-[--radius-card] border border-line bg-surface-2 px-4 py-3 text-fg shadow-card transition-transform duration-150 active:scale-[0.98]"
              aria-label={`${t("goToCart")}. ${t("cartSummary", { count, quantity: totalQuantity })}`}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-[--radius-inner] bg-solid text-on-solid">
                <ShoppingCart className="size-4" strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{t("goToCart")}</span>
                <span className="tabular block text-xs text-fg/70">
                  {t("cartSummary", { count, quantity: totalQuantity })}
                </span>
              </span>
              <span className="tabular grid min-w-7 place-items-center rounded-[--radius-pill] bg-solid px-2 py-1 text-xs font-semibold text-on-solid">
                {count}
              </span>
            </a>
          </div>
        </>
      ) : null}
    </>
  );
}
