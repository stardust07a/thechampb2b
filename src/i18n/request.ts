import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    // Fiyat ve sayı biçimleri locale'e göre (brief §10)
    formats: {
      number: {
        usd: { style: "currency", currency: "USD", minimumFractionDigits: 2 },
        eur: { style: "currency", currency: "EUR", minimumFractionDigits: 2 },
      },
    },
  };
});
