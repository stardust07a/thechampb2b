"use client";

import { useLocale, useTranslations } from "next-intl";

import { useCurrency } from "@/components/site/currency-provider";
import { formatPrice } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

/**
 * Fiyat gösterimi istemcide yapılır.
 *
 * Sunucu her iki para birimini de hesaplayıp gönderir; hangisinin görüneceğine
 * tarayıcı karar verir. Böylece sayfalar `cookies()` okumak zorunda kalmaz ve
 * statik/ISR olarak üretilebilir (brief §11), para birimi geçişi de sunucuya
 * gitmeden anında olur.
 */
export function PriceFrom({ usd, eur }: { usd: number | null; eur: number | null }) {
  const t = useTranslations("price");
  const locale = useLocale() as Locale;
  const { currency } = useCurrency();

  const value = currency === "EUR" ? eur : usd;

  if (value === null) {
    return <span className="text-muted">{t("requestPrice")}</span>;
  }

  return (
    <span className="tabular font-medium text-fg">
      {t("from", { price: formatPrice(value, currency, locale) })}
    </span>
  );
}
