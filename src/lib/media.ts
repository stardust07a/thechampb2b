/**
 * Görsel yolu çözümleme.
 *
 * Veritabanında sadece kendi anahtarlarımız durur:
 *   `TC-TSH-0001/black/1.webp`
 * Taban adres ortam değişkeninden gelir; yerelde `/media`, yayında Vercel Blob.
 * Trendyol CDN'ine hiçbir referans yoktur (brief §17.3).
 */

const BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE ?? "/media").replace(/\/$/, "");

export type MediaSize = "thumb" | "card" | "full";

const SIZE_DIR: Record<MediaSize, string> = {
  thumb: "thumb",
  card: "card",
  full: "full",
};

export function mediaUrl(key: string | undefined | null, size: MediaSize = "card"): string | null {
  if (!key) return null;
  // Panelden yüklenen dosyalar tam adres olarak saklanır (Blob URL'i veya
  // /media/uploads/...). Bunlar boyut klasörüne girmez, olduğu gibi kullanılır.
  if (key.startsWith("http://") || key.startsWith("https://") || key.startsWith("/")) {
    return key;
  }
  return `${BASE}/${SIZE_DIR[size]}/${key}`;
}

/** Görsel yoksa kart boş kutu bırakmasın diye ince bir yer tutucu. */
export const IMAGE_PLACEHOLDER =
  "data:image/svg+xml;base64," +
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="4" height="6"><rect width="4" height="6" fill="#131315"/></svg>`,
  ).toString("base64");
