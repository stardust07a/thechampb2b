import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Geliştirme sitesini aynı Wi-Fi/LAN üzerindeki cihazlardan açarken Next'in
  // dev asset ve HMR isteklerini engellememesi gerekir.
  allowedDevOrigins: ["192.168.2.24"],
  // Telefonda yerel önizleme yapılırken görünen kırmızı Next geliştirme rozeti
  // gerçek site arayüzüyle karışmasın. Derleme hataları yine gösterilir.
  devIndicators: false,
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

export default withNextIntl(nextConfig);
