import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // panel ve iç uçlar dizine girmez
        disallow: ["/api/", "/admin", "/admin/", "/en/inquiry", "/tr/inquiry", "/de/inquiry", "/ar/inquiry"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
