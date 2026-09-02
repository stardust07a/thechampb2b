"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { useCurrency } from "@/components/site/currency-provider";
import { pick, TIERS, type ResolvedPrices } from "@/lib/price";
import type { Locale } from "@/i18n/routing";

/**
 * 4 kademeli fiyat tablosu — brief §7.
 * Fiyat girilmemişse tablo yerine "Request price" butonu çıkar ve teklif
 * sepetine yönlendirir. Fiyat girildiği anda tablo kendiliğinden görünür.
 */
export function PriceTable({
  prices,
  locale,
  moq,
}: {
  prices: ResolvedPrices;
  locale: Locale;
  moq: number;
}) {
  const t = useTranslations("price");
  const { currency } = useCurrency();
  const values = pick(prices, currency);

  if (!prices.hasAny) {
    return (
      <div className="rounded-[--radius-card] border border-line bg-surface p-6">
        <p className="text-sm text-muted">{t("note")}</p>
        <Button asChild variant="solid" size="md" className="mt-5">
          <Link href="/inquiry">{t("requestPrice")}</Link>
        </Button>
        <p className="mt-4 text-xs text-faint">{t("terms")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[--radius-card] border border-line bg-surface">
      <table className="w-full text-sm">
        <caption className="sr-only">
          {t("tier")} / {t("unitPrice")}
        </caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="px-5 py-3 text-start text-xs font-medium text-muted">
              {t("tier")}
            </th>
            <th scope="col" className="px-5 py-3 text-end text-xs font-medium text-muted">
              {t("unitPrice")}
            </th>
          </tr>
        </thead>
        <tbody>
          {TIERS.map((tier) => {
            const value = values[tier];
            return (
              <tr key={tier} className="border-b border-line-soft last:border-0">
                <th
                  scope="row"
                  className="tabular px-5 py-3 text-start font-normal text-muted"
                >
                  {t(`tier${tier}` as "tier100")}
                </th>
                <td className="tabular px-5 py-3 text-end font-medium text-fg">
                  {value !== null ? formatPrice(value, currency, locale) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="border-t border-line bg-surface-2 px-5 py-4">
        <p className="text-xs text-faint">{t("terms")}</p>
        <p className="mt-2 text-xs text-muted">{t("note")}</p>
        <p className="tabular mt-2 text-xs text-faint">MOQ {moq}</p>
      </div>
    </div>
  );
}
