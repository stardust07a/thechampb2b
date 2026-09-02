import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { routing } from "@/i18n/routing";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Dinamik sitemap — brief §11.
 * Tüm diller × (statik sayfalar + kategoriler + yayındaki ürünler).
 * Her giriş, diğer dillere `alternates.languages` ile bağlanır.
 */
export const revalidate = 3600;

function alternates(path: string) {
  return {
    languages: Object.fromEntries(
      routing.locales.map((l) => [l, `${SITE}/${l}${path}`]),
    ),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    prisma.category
      .findMany({ where: { active: true }, select: { slug: true } })
      .catch(() => []),
    prisma.product
      .findMany({
        where: { status: "published" },
        select: { slug: true, updatedAt: true, category: { select: { slug: true } } },
      })
      .catch(() => []),
  ]);

  const staticPaths = [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "/products", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/what-we-do", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/manufacturing", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/about", priority: 0.6, changeFrequency: "yearly" as const },
    { path: "/contact", priority: 0.7, changeFrequency: "yearly" as const },
    { path: "/privacy", priority: 0.2, changeFrequency: "yearly" as const },
    { path: "/terms", priority: 0.2, changeFrequency: "yearly" as const },
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const s of staticPaths) {
      entries.push({
        url: `${SITE}/${locale}${s.path}`,
        lastModified: new Date(),
        changeFrequency: s.changeFrequency,
        priority: s.priority,
        alternates: alternates(s.path),
      });
    }

    for (const c of categories) {
      const path = `/products/${c.slug}`;
      entries.push({
        url: `${SITE}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: alternates(path),
      });
    }

    for (const p of products) {
      const path = `/products/${p.category.slug}/${p.slug}`;
      entries.push({
        url: `${SITE}/${locale}${path}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: alternates(path),
      });
    }
  }

  return entries;
}
