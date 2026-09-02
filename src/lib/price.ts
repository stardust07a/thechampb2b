/**
 * Fiyat çözümleme — brief §7.
 *
 * Sıra: ürün fiyatı → yoksa kategori fiyatı → yoksa "Request price".
 * Ana para birimi USD; EUR `Setting.eurRate` üzerinden hesaplanır,
 * `Product.priceEurOverride` doluysa o kullanılır.
 *
 * İlk sürümde fiyat verisi girilmemiştir; bu katman veri gelir gelmez
 * kendiliğinden çalışmaya başlar.
 */

import type { Currency } from "./format";

export const TIERS = [100, 300, 500, 1000] as const;
export type Tier = (typeof TIERS)[number];

/** Prisma Decimal veya number kabul eder. */
type Decimalish = { toString(): string } | number | null | undefined;

function num(v: Decimalish): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v.toString());
  return Number.isFinite(n) ? n : null;
}

export type PriceSource = {
  price100?: Decimalish;
  price300?: Decimalish;
  price500?: Decimalish;
  price1000?: Decimalish;
};

export type ResolvedPrices = {
  /** USD birim fiyatlar; kademe girilmemişse null. */
  usd: Record<Tier, number | null>;
  eur: Record<Tier, number | null>;
  /** Hiçbir kademede fiyat yoksa false — "Request price" gösterilir. */
  hasAny: boolean;
  /** Kartlarda `from $X` için en yüksek adet kademesi (en düşük fiyat). */
  from: { usd: number | null; eur: number | null };
};

const EMPTY: Record<Tier, number | null> = { 100: null, 300: null, 500: null, 1000: null };

export function resolvePrices(
  product: PriceSource | null | undefined,
  category: PriceSource | null | undefined,
  eurRate: number,
  eurOverride?: Record<string, number> | null,
): ResolvedPrices {
  const usd = { ...EMPTY };
  const eur = { ...EMPTY };

  for (const tier of TIERS) {
    const key = `price${tier}` as keyof PriceSource;
    // ürün fiyatı öncelikli, yoksa kategori varsayılanı
    const value = num(product?.[key]) ?? num(category?.[key]);
    usd[tier] = value;

    if (value === null) continue;
    const override = eurOverride?.[String(tier)];
    eur[tier] =
      typeof override === "number" && Number.isFinite(override)
        ? round2(override)
        : round2(value * eurRate);
  }

  const hasAny = TIERS.some((t) => usd[t] !== null);
  // "from" = en yüksek adet kademesindeki (en ucuz) girilmiş fiyat
  const fromTier = [...TIERS].reverse().find((t) => usd[t] !== null);

  return {
    usd,
    eur,
    hasAny,
    from: {
      usd: fromTier ? usd[fromTier] : null,
      eur: fromTier ? eur[fromTier] : null,
    },
  };
}

export function pick(prices: ResolvedPrices, currency: Currency): Record<Tier, number | null> {
  return currency === "EUR" ? prices.eur : prices.usd;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
