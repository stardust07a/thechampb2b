import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * `headers()` derleme anında değerlendirilip route manifest'ine gömülür.
 * `NODE_ENV` bu dosya yüklendiğinde henüz güvenilir değil; Next'in verdiği
 * FAZ bilgisi kesin sonucu verir.
 */
function buildConfig(phase: string): NextConfig {
  const isProd = phase !== PHASE_DEVELOPMENT_SERVER;

  /**
   * İçerik Güvenliği Politikası.
   *
   * Sıkı ama çalışır olması için gerçek ihtiyaçlara göre yazıldı:
   *  - `'unsafe-inline'` script'te ZORUNLU: tema seçimi ilk boyamadan önce
   *    çalışan satır içi bir script ile yazılıyor (flash olmasın diye) ve
   *    Next.js hydration verisini satır içi script olarak basıyor.
   *  - `'unsafe-eval'` sadece geliştirmede; Turbopack HMR onu istiyor.
   *  - `style-src 'unsafe-inline'`: Tailwind ve bileşenler satır içi `style`
   *    kullanıyor (hero gradyanları, ilerleme çubukları).
   *  - `img-src` / `media-src` Vercel Blob'u ve data/blob URI'lerini kapsar.
   *  - `frame-ancestors 'none'` clickjacking'i kapatır (X-Frame-Options'ın
   *    modern karşılığı).
   */
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
    "media-src 'self' blob: https://*.public.blob.vercel-storage.com",
    "connect-src 'self' https://*.public.blob.vercel-storage.com " +
      "https://blob.vercel-storage.com" +
      (isProd ? "" : " ws: wss:"),
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  const securityHeaders = [
    { key: "Content-Security-Policy", value: csp },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // Sitenin ihtiyacı olmayan tarayıcı yetkilerini kapat
    {
      key: "Permissions-Policy",
      value:
        "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
    },
    { key: "X-DNS-Prefetch-Control", value: "on" },
    // HSTS yalnızca yayında: yerel geliştirme http üzerinden çalışıyor.
    ...(isProd
      ? [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ]
      : []),
  ];

  return {
    // Geliştirme sitesini aynı Wi-Fi/LAN üzerindeki cihazlardan açarken Next'in
    // dev asset ve HMR isteklerini engellememesi gerekir.
    allowedDevOrigins: ["192.168.2.24"],
    // Telefonda yerel önizleme yapılırken görünen kırmızı Next geliştirme rozeti
    // gerçek site arayüzüyle karışmasın. Derleme hataları yine gösterilir.
    devIndicators: false,
    poweredByHeader: false,

    async headers() {
      return [
        { source: "/:path*", headers: securityHeaders },
        {
          // Panel ve yönetim uçları hiçbir yerde önbelleğe alınmasın
          source: "/admin/:path*",
          headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
        },
        {
          source: "/api/admin/:path*",
          headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
        },
      ];
    },

    images: {
      // Görseller kendi CDN'imizden gelir. Trendyol'a referans YOK (brief §17.3).
      formats: ["image/avif", "image/webp"],
      qualities: [75, 90],
      remotePatterns: [
        { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      ],
      deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536, 1920],
      imageSizes: [96, 160, 240, 320, 400, 560, 800],
    },

    experimental: {
      optimizePackageImports: ["lucide-react"],
      serverActions: {
        // Panelde 4 dilli uzun ürün metinleri gönderiliyor; varsayılan 1 MB dar.
        // Dosyalar zaten Server Action'dan geçmiyor (bkz. media-slot.tsx).
        bodySizeLimit: "4mb",
      },
    },
  };
}

export default function config(phase: string) {
  return withNextIntl(buildConfig(phase));
}
