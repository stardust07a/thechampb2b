"use client";

import { useTranslations } from "next-intl";
import { useCurrency } from "./currency-provider";
import { cn } from "@/lib/utils";

/** USD / EUR geçişi — seçim cookie'de saklanır (brief §7). */
export function CurrencySwitcher({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const { currency, setCurrency } = useCurrency();

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-[--radius-pill] border border-line p-0.5",
        className,
      )}
      role="group"
      dir="ltr"
      aria-label={t("currency")}
    >
      {(["USD", "EUR"] as const).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => setCurrency(c)}
          aria-pressed={currency === c}
          className={cn(
            "tabular rounded-[--radius-pill] px-3 py-1 text-xs font-medium transition-colors duration-200",
            currency === c ? "bg-solid text-on-solid" : "text-muted hover:text-fg",
          )}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
