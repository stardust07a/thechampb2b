"use client";

import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useInquiry } from "./inquiry-store";
import { cn } from "@/lib/utils";

/** Header'daki sipariş sepeti ikonu — rozet sayaçlı. */
export function InquiryButton({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const { count, ready } = useInquiry();

  return (
    <Link
      href="/inquiry"
      aria-label={ready && count > 0 ? t("inquiryCount", { count }) : t("inquiry")}
      className={cn(
        "relative inline-flex size-11 items-center justify-center rounded-[--radius-inner] md:size-10",
        "text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-fg",
        className,
      )}
    >
      <ShoppingCart className="size-4" strokeWidth={2} aria-hidden />
      {ready && count > 0 ? (
        <span
          className={cn(
            "tabular absolute -end-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center",
            "rounded-[--radius-pill] bg-solid px-1 text-[11px] font-semibold text-on-solid",
          )}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}
