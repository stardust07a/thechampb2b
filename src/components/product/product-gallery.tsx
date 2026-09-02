"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { IMAGE_PLACEHOLDER, mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { colorLabel } from "@/lib/taxonomy";
import type { AppLocale } from "@/lib/locales";

export type GalleryVariant = {
  color: string;
  colorTr: string | null;
  colorHex: string | null;
  images: string[];
  sizes: string[];
};

/**
 * Ürün galerisi — brief §4.4.
 * Renk seçimi galeriyi değiştirir; seçili renk üst bileşene bildirilir ki
 * "teklife ekle" doğru varyantı kaydetsin.
 */
export function ProductGallery({
  variants,
  productName,
  activeIndex,
}: {
  variants: GalleryVariant[];
  productName: string;
  activeIndex: number;
}) {
  const t = useTranslations("product");
  const tCommon = useTranslations("common");
  const [imageIndex, setImageIndex] = useState(0);
  const pointerStartX = useRef<number | null>(null);

  const variant = variants[activeIndex] ?? variants[0];
  const images = variant?.images ?? [];
  const current = mediaUrl(images[imageIndex] ?? images[0], "full");

  const selectRelativeImage = (direction: -1 | 1) => {
    if (images.length < 2) return;
    setImageIndex((currentIndex) => (currentIndex + direction + images.length) % images.length);
  };

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-4 overflow-hidden lg:flex-row-reverse lg:items-start">
      <div
        className="relative aspect-[2/3] w-full min-w-0 touch-pan-y overflow-hidden rounded-[--radius-card] border border-line bg-surface lg:flex-1"
        onPointerDown={(event) => {
          pointerStartX.current = event.clientX;
        }}
        onPointerUp={(event) => {
          const start = pointerStartX.current;
          const end = event.clientX;
          pointerStartX.current = null;
          if (start === null) return;
          const distance = end - start;
          if (Math.abs(distance) < 42) return;
          selectRelativeImage(distance < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          pointerStartX.current = null;
        }}
      >
        {current ? (
          <Image
            src={current}
            alt={`${productName} — ${variant?.color ?? ""}`}
            fill
            priority
            sizes="(min-width:1024px) 46vw, 100vw"
            placeholder="blur"
            blurDataURL={IMAGE_PLACEHOLDER}
            className="object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center bg-surface-2">
            <span className="text-sm text-faint">{t("gallery")}</span>
          </div>
        )}

        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => selectRelativeImage(-1)}
              aria-label={tCommon("previous")}
              className="absolute start-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/55 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/75"
            >
              <ChevronLeft className="size-5 rtl:-scale-x-100" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => selectRelativeImage(1)}
              aria-label={tCommon("next")}
              className="absolute end-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/55 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/75"
            >
              <ChevronRight className="size-5 rtl:-scale-x-100" aria-hidden />
            </button>
            <span className="absolute bottom-3 start-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-xs tabular text-white backdrop-blur-md rtl:translate-x-1/2">
              {imageIndex + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        /* Bazı ürünlerde 24+ görsel var. Mobilde yatay şerit, masaüstünde
           ana görselin yüksekliğini aşmayan kaydırılabilir dikey sütun —
           yoksa liste sayfayı aşağı doğru uzatıyordu. */
        <ul
          className={cn(
            "no-scrollbar hidden w-full min-w-0 max-w-full snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-0.5 pb-1",
            "lg:flex lg:max-h-[min(70svh,42rem)] lg:w-20 lg:shrink-0 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto",
          )}
          aria-label={t("gallery")}
        >
          {images.map((key, i) => {
            const thumb = mediaUrl(key, "thumb");
            if (!thumb) return null;
            return (
              <li key={key} className="shrink-0 snap-start">
                <button
                  type="button"
                  onClick={() => setImageIndex(i)}
                  aria-label={t("imageOf", { index: i + 1, total: images.length })}
                  aria-current={i === imageIndex}
                  className={cn(
                    "relative block aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-[--radius-inner] border sm:w-16",
                    "transition-colors duration-200 lg:w-full",
                    i === imageIndex ? "border-chrome-2" : "border-line hover:border-chrome-1",
                  )}
                >
                  <Image
                    src={thumb}
                    alt=""
                    aria-hidden
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/** Renk noktaları — galeriyle aynı state'i paylaşır. */
export function ColorPicker({
  variants,
  activeIndex,
  onChange,
  locale,
}: {
  variants: GalleryVariant[];
  activeIndex: number;
  onChange: (index: number) => void;
  locale: string;
}) {
  const t = useTranslations("product");
  const active = variants[activeIndex];

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow">{t("selectColour")}</p>
        <p className="text-sm text-fg">
          {active ? colorLabel(active.color, locale as AppLocale) : ""}
        </p>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2.5">
        {variants.map((v, i) => (
          <li key={`${v.color}-${i}`}>
            <button
              type="button"
              onClick={() => onChange(i)}
              title={colorLabel(v.color, locale as AppLocale)}
              aria-label={colorLabel(v.color, locale as AppLocale)}
              aria-pressed={i === activeIndex}
              className={cn(
                "grid size-11 place-items-center rounded-full border-2 transition-colors duration-200",
                i === activeIndex ? "border-chrome-2" : "border-transparent hover:border-line",
              )}
            >
              <span
                className="size-6 rounded-full border border-line"
                style={{ background: v.colorHex ?? "var(--surface-2)" }}
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
