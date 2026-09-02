/**
 * PDF katalog için JPEG küçük görseller.
 *
 * @react-pdf/renderer WebP okumaz. Her ürünün ilk varyantının ilk görselini
 * daha önce indirilmiş `thumb` WebP dosyasından JPEG'e çevirir — yeniden
 * indirme yapmaz, ağa çıkmaz.
 *
 * Çıktı: public/media/pdf/{productCode}.jpg
 * Çalıştır: npx tsx scripts/pdf-thumbs.ts
 */

import "dotenv/config";

import { existsSync } from "node:fs";
import { mkdir, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const ROOT = resolve(import.meta.dirname, "..");
const SRC = resolve(ROOT, "data/products.normalized.json");
const THUMB_ROOT = resolve(ROOT, "public/media/thumb");
const OUT_ROOT = resolve(ROOT, "public/media/pdf");

const FORCE = process.argv.includes("--force");

async function main() {
  const data = JSON.parse(await readFile(SRC, "utf8")) as {
    products: { productCode: string; variants: { colorSlug: string }[] }[];
  };

  await mkdir(OUT_ROOT, { recursive: true });

  let written = 0;
  let skipped = 0;
  let missing = 0;

  for (const product of data.products) {
    const target = resolve(OUT_ROOT, `${product.productCode}.jpg`);
    if (!FORCE && existsSync(target)) {
      skipped++;
      continue;
    }

    const variant = product.variants[0];
    if (!variant) {
      missing++;
      continue;
    }

    const dir = resolve(THUMB_ROOT, product.productCode, variant.colorSlug);
    if (!existsSync(dir)) {
      missing++;
      continue;
    }

    // klasördeki ilk görseli al (1.webp genelde ana kare)
    const files = (await readdir(dir)).filter((f) => f.endsWith(".webp")).sort();
    if (files.length === 0) {
      missing++;
      continue;
    }

    await sharp(resolve(dir, files[0]))
      .resize({ width: 260, withoutEnlargement: true })
      .jpeg({ quality: 72, progressive: true })
      .toFile(target);
    written++;
  }

  console.log(`✓ PDF küçük görselleri: yazılan ${written}, atlanan ${skipped}, eksik ${missing}`);
  console.log(`→ ${OUT_ROOT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
