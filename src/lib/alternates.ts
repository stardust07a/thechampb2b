import { routing } from "@/i18n/routing";

/**
 * Her sayfada canonical + hreflang (brief §11).
 * `path` locale önekini İÇERMEZ: "" (ana sayfa), "/products", "/contact" gibi.
 */
export function alternatesFor(locale: string, path = "") {
  return {
    canonical: `/${locale}${path}`,
    languages: Object.fromEntries([
      ...routing.locales.map((l) => [l, `/${l}${path}`]),
      ["x-default", `/${routing.defaultLocale}${path}`],
    ]),
  };
}
