import "server-only";
import { cache } from "react";

import { prisma } from "./prisma";
import type { AppLocale } from "./locales";

/**
 * Panelden yönetilen görsel ve video "yuvaları".
 *
 * Site üzerinde sabit yerler vardır (kategori kapağı, sayfa hero'su, üretim
 * videoları). Her yuvanın bir anahtarı olur; panelden dosya yüklenince o
 * anahtara yazılır. Yuva boşsa ilgili bölüm SAYFAYA HİÇ BASILMAZ (brief §7) —
 * kırık görsel veya boş kutu bırakılmaz.
 *
 * Anahtar biçimi:
 *   category:<slug>        kategori kapak görseli
 *   page:<sayfa>:<ad>      sayfa görseli  (page:about:hero)
 *   video:<n>              9:16 üretim videosu
 */

export type SlotKind = "image" | "video";

export type MediaSlotValue = {
  key: string;
  url: string;
  kind: SlotKind;
  alt: Record<string, string> | null;
  sortOrder: number;
};

/** Sayfa görselleri — panelde bu sırayla listelenir. */
export const PAGE_SLOTS: {
  key: string;
  page: string;
  label: string;
  hint: string;
  aspect: "wide" | "portrait" | "square";
}[] = [
  {
    key: "page:about:hero",
    page: "Hakkımızda sayfası",
    label: "Üst görsel",
    hint: "Marka hikâyesinin üstünde tam genişlikte görünür.",
    aspect: "wide",
  },
  {
    key: "page:what-we-do:hero",
    page: "Ne Yapıyoruz sayfası",
    label: "Üst görsel",
    hint: "11 adımın üstünde, başlığın altında.",
    aspect: "wide",
  },
  {
    key: "page:what-we-do:closing",
    page: "Ne Yapıyoruz sayfası",
    label: "Kapanış görseli",
    hint: "ONE ECOSYSTEM bloğunun arkasında.",
    aspect: "wide",
  },
  {
    key: "page:manufacturing:hero",
    page: "Üretim sayfası",
    label: "Üst görsel",
    hint: "Sayfa başlığının arkasında.",
    aspect: "wide",
  },
  {
    key: "page:manufacturing:1",
    page: "Üretim sayfası",
    label: "Üretim karesi 1",
    hint: "Kabiliyetler bölümünün yanındaki galeri.",
    aspect: "portrait",
  },
  {
    key: "page:manufacturing:2",
    page: "Üretim sayfası",
    label: "Üretim karesi 2",
    hint: "Galeri.",
    aspect: "portrait",
  },
  {
    key: "page:manufacturing:3",
    page: "Üretim sayfası",
    label: "Üretim karesi 3",
    hint: "Galeri.",
    aspect: "portrait",
  },
  {
    key: "page:manufacturing:4",
    page: "Üretim sayfası",
    label: "Üretim karesi 4",
    hint: "Galeri.",
    aspect: "portrait",
  },
  {
    key: "page:contact:side",
    page: "İletişim sayfası",
    label: "Yan görsel",
    hint: "İletişim formunun yanında.",
    aspect: "portrait",
  },
  {
    key: "page:home:banner2",
    page: "Ana sayfa",
    label: "Banner 2 arka planı",
    hint: '"Markanıza özel üretim" bölümünün arka planı.',
    aspect: "wide",
  },
];

/** Kaç video yuvası açık — kullanıcının 6-7 dikey videosu var. */
export const VIDEO_SLOT_COUNT = 8;

export const videoSlotKey = (index: number) => `video:${index + 1}`;
export const categorySlotKey = (slug: string) => `category:${slug}`;

/** Tüm yuvaları tek sorguda okur; istek boyunca önbelleklenir. */
export const getAllSlots = cache(async (): Promise<Map<string, MediaSlotValue>> => {
  try {
    const rows = await prisma.mediaAsset.findMany({ orderBy: { sortOrder: "asc" } });
    return new Map(
      rows.map((r) => [
        r.key,
        {
          key: r.key,
          url: r.url,
          kind: (r.kind === "video" ? "video" : "image") as SlotKind,
          alt: (r.alt as Record<string, string> | null) ?? null,
          sortOrder: r.sortOrder,
        },
      ]),
    );
  } catch {
    // Veritabanı yoksa site yine ayağa kalksın
    return new Map();
  }
});

export async function getSlot(key: string): Promise<MediaSlotValue | null> {
  return (await getAllSlots()).get(key) ?? null;
}

/** Sıralı video listesi — boş yuvalar atlanır. */
export async function getVideos(): Promise<MediaSlotValue[]> {
  const slots = await getAllSlots();
  return Array.from({ length: VIDEO_SLOT_COUNT }, (_, i) => slots.get(videoSlotKey(i)))
    .filter((v): v is MediaSlotValue => Boolean(v))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Yuvanın alt metnini seçili dilde döner. */
export function slotAlt(slot: MediaSlotValue | null, locale: AppLocale): string {
  if (!slot?.alt) return "";
  return slot.alt[locale] ?? slot.alt.en ?? "";
}
