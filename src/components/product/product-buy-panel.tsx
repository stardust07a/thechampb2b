"use client";

import { useState } from "react";
import { MessageCircle, Minus, Plus, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ColorPicker, ProductGallery, type GalleryVariant } from "./product-gallery";
import { PriceTable } from "./price-table";
import { useInquiry } from "@/components/site/inquiry-store";
import type { ResolvedPrices } from "@/lib/price";
import type { Locale } from "@/i18n/routing";

/**
 * Ürün detayının etkileşimli yarısı: renk seçimi galeriyle ve teklif satırıyla
 * bağlıdır, WhatsApp mesajı seçili renk + adet + sayfa linkiyle dolar
 * (brief §4.4, §8.1).
 */
export function ProductBuyPanel({
  locale,
  prices,
  variants,
  productId,
  productCode,
  productName,
  slug,
  categorySlug,
  sizeRange,
  whatsappNumber,
  pageUrl,
  moq,
}: {
  locale: Locale;
  prices: ResolvedPrices;
  variants: GalleryVariant[];
  productId: string;
  productCode: string;
  productName: string;
  slug: string;
  categorySlug: string;
  sizeRange: string | null;
  whatsappNumber: string;
  pageUrl: string;
  moq: number;
}) {
  const t = useTranslations("product");
  const { add } = useInquiry();
  const [activeIndex, setActiveIndex] = useState(0);
  const [quantity, setQuantity] = useState<string>("");
  const [activeSize, setActiveSize] = useState(variants[0]?.sizes[0] ?? "");

  const variant = variants[activeIndex];
  const sizes = variant?.sizes ?? [];
  const selectedSize = sizes.includes(activeSize) ? activeSize : (sizes[0] ?? "");
  const qty = Number(quantity) || 0;

  const message = [
    `Hello THE CHAMP GLOBAL,`,
    `I would like a quotation for:`,
    ``,
    `${productCode} — ${productName}`,
    variant ? `Colour: ${variant.color}` : null,
    selectedSize ? `Size: ${selectedSize}` : sizeRange ? `Sizes: ${sizeRange}` : null,
    qty > 0 ? `Quantity: ${qty} pcs` : null,
    ``,
    pageUrl,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const whatsappHref = `https://wa.me/${whatsappNumber.replace(/[^\d]/g, "")}?text=${encodeURIComponent(message)}`;

  return (
    <div className="grid min-w-0 gap-10 lg:grid-cols-2 lg:gap-14">
      <ProductGallery
        key={activeIndex}
        variants={variants}
        productName={productName}
        activeIndex={activeIndex}
      />

      <div className="min-w-0 space-y-8">
        {variants.length > 0 ? (
          <ColorPicker
            variants={variants}
            activeIndex={activeIndex}
            onChange={(index) => {
              setActiveIndex(index);
              setActiveSize(variants[index]?.sizes[0] ?? "");
            }}
            locale={locale}
          />
        ) : null}

        <PriceTable prices={prices} locale={locale} moq={moq} />

        <div className="space-y-5 rounded-[--radius-card] border border-line bg-surface p-5 md:p-6">
          <div>
            <p className="eyebrow">{t("selectSize")}</p>
            {sizes.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t("selectSize")}>
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setActiveSize(size)}
                    aria-pressed={selectedSize === size}
                    className={`min-w-12 rounded-[--radius-inner] border px-4 py-2.5 text-sm font-medium transition-colors ${
                      selectedSize === size
                        ? "border-fg bg-fg text-bg"
                        : "border-line bg-surface-2 text-muted hover:border-chrome-1 hover:text-fg"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">{sizeRange ?? t("sizeNotSpecified")}</p>
            )}
          </div>

          <div>
            <Label htmlFor="qty">{t("quantityForSize", { size: selectedSize || "—" })}</Label>
            <div className="flex max-w-56 items-stretch">
              <button
                type="button"
                onClick={() => setQuantity(String(Math.max(0, qty - 1)))}
                disabled={qty <= 0}
                aria-label={t("decreaseQuantity")}
                className="grid size-11 shrink-0 place-items-center rounded-s-[--radius-inner] border border-e-0 border-line bg-surface-2 text-muted transition-colors hover:text-fg disabled:opacity-40"
              >
                <Minus aria-hidden className="size-4" />
              </button>
              <Input
                id="qty"
                inputMode="numeric"
                pattern="[0-9]*"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value.replace(/[^\d]/g, ""))}
                placeholder={String(moq)}
                className="tabular rounded-none text-center"
              />
              <button
                type="button"
                onClick={() => setQuantity(String(qty + 1))}
                aria-label={t("increaseQuantity")}
                className="grid size-11 shrink-0 place-items-center rounded-e-[--radius-inner] border border-s-0 border-line bg-surface-2 text-muted transition-colors hover:text-fg"
              >
                <Plus aria-hidden className="size-4" />
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-faint">{t("quantityHint", { moq })}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="solid"
            size="lg"
            disabled={!selectedSize || qty <= 0}
            onClick={() => {
              add({
                productId,
                productCode,
                productName,
                slug,
                categorySlug,
                color: variant?.color ?? null,
                colorHex: variant?.colorHex ?? null,
                sizeRun: selectedSize,
                imageKey: variant?.images[0] ?? null,
                quantity: qty,
              });
              toast.success(t("addedToInquiry"), {
                description: `${productName} · ${selectedSize} · ${qty} ${t("pieces")}`,
              });
            }}
          >
            <ShoppingBag aria-hidden />
            {t("addSelectedToInquiry")}
          </Button>
          <Button asChild variant="primary" size="lg">
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle aria-hidden />
              {t("askWhatsapp")}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
