import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { ProductCardData } from "@/lib/products";
import { IMAGE_PLACEHOLDER, mediaUrl } from "@/lib/media";
import { resolvePrices } from "@/lib/price";
import { cn } from "@/lib/utils";
import { colorLabel } from "@/lib/taxonomy";
import { AddToInquiry } from "./add-to-inquiry";
import { PriceFrom } from "./price-display";

/**
 * Ürün kartı — brief §3.3 / §17.9.
 * Kartın tamamı tek bir <a>; içine <button> yerleştirilmez. Teklife ekleme
 * butonu bağlantının DIŞINDA, kardeş öğe olarak durur.
 */
export async function ProductCard({
  product,
  locale,
  eurRate,
  priority = false,
  sizes = "(min-width:1280px) 22vw, (min-width:768px) 30vw, 45vw",
}: {
  product: ProductCardData;
  locale: Locale;
  eurRate: number;
  priority?: boolean;
  sizes?: string;
}) {
  const t = await getTranslations({ locale, namespace: "product" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const name = product.translations[0]?.name ?? product.slug;
  const categoryName = product.category.translations[0]?.name ?? product.category.slug;
  const variant = product.variants[0];
  const image = mediaUrl(variant?.images[0], "card");

  const prices = resolvePrices(
    product,
    product.category,
    eurRate,
    product.priceEurOverride as Record<string, number> | null,
  );
  const sizeList = variant?.sizes ?? [];
  const sizeLabel =
    sizeList.length > 1 ? `${sizeList[0]}–${sizeList[sizeList.length - 1]}` : sizeList[0];

  return (
    <article className="group flex h-full flex-col">
      <Link
        href={`/products/${product.category.slug}/${product.slug}`}
        className={cn(
          "relative flex flex-1 flex-col overflow-hidden rounded-[--radius-card] border border-line",
          "bg-surface transition-colors duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:border-chrome-1",
        )}
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-[--radius-inner]">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              sizes={sizes}
              priority={priority}
              loading={priority ? undefined : "lazy"}
              placeholder="blur"
              blurDataURL={IMAGE_PLACEHOLDER}
              className={cn(
                "object-cover transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)]",
                "group-hover:scale-[1.03]",
              )}
            />
          ) : (
            <div className="grid size-full place-items-center bg-surface-2">
              <span className="tabular text-xs text-faint">{product.productCode}</span>
            </div>
          )}

          {product.isNew ? (
            <span className="absolute start-3 top-3 rounded-[--radius-pill] bg-solid px-2.5 py-1 text-[11px] font-semibold text-on-solid">
              {tCommon("new")}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <p className="tabular text-[11px] tracking-wide text-faint">{product.productCode}</p>
          <h3 className="mt-1.5 line-clamp-2 text-[15px] font-medium text-fg">{name}</h3>
          <p className="mt-1 text-xs text-muted">{categoryName}</p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5" aria-label={t("colours")}>
              {product.variants.slice(0, 5).map((v, i) => (
                <span
                  key={`${v.color}-${i}`}
                  title={colorLabel(v.color, locale)}
                  className="size-3 rounded-full border border-line"
                  style={{ background: v.colorHex ?? "var(--surface-2)" }}
                />
              ))}
              {product.variants.length > 5 ? (
                <span className="tabular text-[11px] text-faint">
                  +{product.variants.length - 5}
                </span>
              ) : null}
            </div>
            {sizeLabel ? (
              <span className="tabular text-[11px] text-faint">{sizeLabel}</span>
            ) : null}
          </div>

          <p className="mt-auto pt-3 text-sm">
            <PriceFrom usd={prices.from.usd} eur={prices.from.eur} />
          </p>
        </div>
      </Link>

      {/* Bağlantının dışında — iç içe interaktif öğe olmaz */}
      <AddToInquiry
        className="mt-2"
        size="sm"
        variant="outline"
        item={{
          productId: product.id,
          productCode: product.productCode,
          productName: name,
          slug: product.slug,
          categorySlug: product.category.slug,
          color: variant?.color ?? null,
          colorHex: variant?.colorHex ?? null,
          sizeRun: sizeLabel ?? null,
          imageKey: variant?.images[0] ?? null,
        }}
      />
    </article>
  );
}
