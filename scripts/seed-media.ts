/**
 * Medya yuvalarını firmanın KENDİ ürün çekimleriyle doldurur.
 *
 * Neden internetten değil: stok/arama sonucu görseller telifli olur ve ticari
 * bir B2B sitesinde kullanmak hukuki risk yaratır. Firmanın 12.500 kendi
 * fotoğrafı var; bunlar hem sahipli hem marka diliyle uyumlu. Fabrika
 * fotoğrafları geldiğinde panelden (Medya ekranı) tek tıkla değiştirilir.
 *
 * Sadece BOŞ yuvaları doldurur — panelden yüklenmiş bir görseli ezmez.
 * Çalıştır: npm run media:seed   (--force ile hepsini yeniden yazar)
 */

import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const FORCE = process.argv.includes("--force");
const BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE ?? "/media").replace(/\/$/, "");

const url = (mediaKey: string) => `${BASE}/full/${mediaKey}`;

/**
 * Sayfa yuvaları için kaynak kategoriler. Konuya en yakın ürün grubundan
 * seçim yapılır ki görsel metinle çelişmesin.
 */
const PAGE_SOURCES: { slot: string; category: string; offset: number }[] = [
  { slot: "page:home:banner2", category: "sweatshirts", offset: 3 },
  { slot: "page:about:hero", category: "co-ord-sets", offset: 0 },
  { slot: "page:what-we-do:hero", category: "tshirts", offset: 5 },
  { slot: "page:what-we-do:closing", category: "knitwear", offset: 0 },
  { slot: "page:manufacturing:hero", category: "sweatshirts", offset: 1 },
  { slot: "page:manufacturing:1", category: "tshirts", offset: 1 },
  { slot: "page:manufacturing:2", category: "sweatshirts", offset: 6 },
  { slot: "page:manufacturing:3", category: "tracksuits", offset: 2 },
  { slot: "page:manufacturing:4", category: "polo-shirts", offset: 0 },
  { slot: "page:contact:side", category: "shirts", offset: 0 },
];

async function pickImage(categorySlug: string, offset: number): Promise<string | null> {
  const products = await prisma.product.findMany({
    where: {
      status: "published",
      category: { slug: categorySlug },
      variants: { some: {} },
    },
    orderBy: { sortOrder: "asc" },
    skip: offset,
    take: 1,
    select: { variants: { take: 1, orderBy: { sortOrder: "asc" }, select: { images: true } } },
  });
  return products[0]?.variants[0]?.images[0] ?? null;
}

async function fill(slotKey: string, mediaKey: string) {
  await prisma.mediaAsset.upsert({
    where: { key: slotKey },
    update: { url: url(mediaKey), kind: "image" },
    create: { key: slotKey, url: url(mediaKey), kind: "image" },
  });
}

async function main() {
  const existing = new Set((await prisma.mediaAsset.findMany({ select: { key: true } })).map((r) => r.key));

  let pages = 0;
  for (const source of PAGE_SOURCES) {
    if (!FORCE && existing.has(source.slot)) continue;
    const image = await pickImage(source.category, source.offset);
    if (!image) {
      console.warn(`  ! görsel bulunamadı: ${source.slot} (${source.category})`);
      continue;
    }
    await fill(source.slot, image);
    pages++;
  }
  console.log(`✓ sayfa görseli: ${pages}`);

  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: { id: true, slug: true, coverImage: true },
  });

  let covers = 0;
  for (const category of categories) {
    const slotKey = `category:${category.slug}`;
    if (!FORCE && existing.has(slotKey)) continue;
    const image = await pickImage(category.slug, 0);
    if (!image) {
      console.warn(`  ! kapak bulunamadı: ${category.slug}`);
      continue;
    }
    await fill(slotKey, image);
    await prisma.category.update({
      where: { id: category.id },
      data: { coverImage: url(image) },
    });
    covers++;
  }
  console.log(`✓ kategori kapağı: ${covers}`);

  const total = await prisma.mediaAsset.count();
  console.log(`\n✓ toplam dolu yuva: ${total}`);
  console.log("  Panelde: Yönetim → Medya. Fabrika fotoğrafları gelince oradan değiştirin.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
