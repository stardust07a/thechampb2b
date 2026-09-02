/**
 * Local medya panelindeki yuvaları ve kategori kapaklarını canlıya eşitler.
 *
 * Varsayılan çalışma rapordur; hiçbir şeyi değiştirmez:
 *   npx tsx scripts/sync-media-slots.ts
 *
 * Onaylı eşitleme:
 *   npx tsx scripts/sync-media-slots.ts --apply
 *
 * Local panel yüklemeleri `public/media/uploads` altında yaşar. --apply sırasında
 * yalnızca localde seçili olan bu dosyalar Vercel Blob'a yüklenir, ardından
 * MediaAsset ve Category.coverImage kayıtları tek transaction ile eşitlenir.
 */

import { createReadStream } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { put } from "@vercel/blob";
import { parse } from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client";

const ROOT = resolve(import.meta.dirname, "..");
const APPLY = process.argv.includes("--apply");

type Env = Record<string, string>;
type Slot = {
  key: string;
  url: string;
  kind: string;
  alt: unknown;
  sortOrder: number;
};

const CONTENT_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".webm": "video/webm",
  ".webp": "image/webp",
};

async function loadEnv(file: string): Promise<Env> {
  return parse(await readFile(resolve(ROOT, file)));
}

function required(env: Env, key: string, file: string): string {
  const value = env[key];
  if (!value) throw new Error(`${file} içinde ${key} eksik.`);
  return value;
}

function client(connectionString: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

function normalizeBase(value: string): string {
  return value.replace(/\/$/, "");
}

function productionUrl(localUrl: string, productionBase: string): string {
  if (localUrl.startsWith("/media/")) {
    return `${productionBase}${localUrl.slice("/media".length)}`;
  }
  if (localUrl.startsWith("http://127.0.0.1") || localUrl.startsWith("http://localhost")) {
    throw new Error(`Local adres canlıya taşınamaz: ${localUrl}`);
  }
  return localUrl;
}

function localUploadPath(localUrl: string): string | null {
  if (!localUrl.startsWith("/media/uploads/")) return null;
  const relative = localUrl.slice("/media/uploads/".length);
  if (!relative || relative.includes("..") || relative.includes("\\")) {
    throw new Error(`Güvensiz upload yolu: ${localUrl}`);
  }
  return resolve(ROOT, "public", "media", "uploads", relative);
}

function preview(url: string): string {
  const parsed = url.startsWith("http") ? new URL(url).pathname : url;
  const parts = parsed.split("/").filter(Boolean);
  return parts.slice(-3).join("/");
}

async function main() {
  const [localEnv, productionEnv] = await Promise.all([
    loadEnv(".env"),
    loadEnv(".env.production.vercel"),
  ]);

  const localUrl = required(localEnv, "DATABASE_URL", ".env");
  const productionDbUrl =
    productionEnv.DATABASE_URL_UNPOOLED ??
    required(productionEnv, "DATABASE_URL", ".env.production.vercel");
  const productionBase = normalizeBase(
    required(productionEnv, "NEXT_PUBLIC_MEDIA_BASE", ".env.production.vercel"),
  );
  const blobToken = required(
    productionEnv,
    "BLOB_READ_WRITE_TOKEN",
    ".env.production.vercel",
  );

  const localHost = new URL(localUrl).hostname;
  const productionHost = new URL(productionDbUrl).hostname;
  if (!new Set(["127.0.0.1", "localhost", "::1"]).has(localHost)) {
    throw new Error(`Local kaynak beklenmiyordu: ${localHost}`);
  }
  if (new Set(["127.0.0.1", "localhost", "::1"]).has(productionHost)) {
    throw new Error(`Canlı hedef local görünüyor: ${productionHost}`);
  }

  const local = client(localUrl);
  const production = client(productionDbUrl);

  try {
    const [localSlots, productionSlots, localCategories, productionCategories] =
      await Promise.all([
        local.mediaAsset.findMany({ orderBy: { key: "asc" } }),
        production.mediaAsset.findMany({ orderBy: { key: "asc" } }),
        local.category.findMany({
          orderBy: { slug: "asc" },
          select: { slug: true, coverImage: true },
        }),
        production.category.findMany({
          orderBy: { slug: "asc" },
          select: { slug: true, coverImage: true },
        }),
      ]);

    const expectedSlots: Slot[] = localSlots.map((slot) => ({
      key: slot.key,
      url: productionUrl(slot.url, productionBase),
      kind: slot.kind,
      alt: slot.alt,
      sortOrder: slot.sortOrder,
    }));
    const expectedByKey = new Map(expectedSlots.map((slot) => [slot.key, slot]));
    const productionByKey = new Map(productionSlots.map((slot) => [slot.key, slot]));

    const changed = expectedSlots.filter((slot) => {
      const current = productionByKey.get(slot.key);
      return (
        !current ||
        current.url !== slot.url ||
        current.kind !== slot.kind ||
        current.sortOrder !== slot.sortOrder ||
        JSON.stringify(current.alt) !== JSON.stringify(slot.alt)
      );
    });
    const removed = productionSlots.filter((slot) => !expectedByKey.has(slot.key));

    const expectedCategoryCovers = new Map(
      localCategories.map((category) => [
        category.slug,
        category.coverImage ? productionUrl(category.coverImage, productionBase) : null,
      ]),
    );
    const changedCategories = productionCategories.filter(
      (category) =>
        expectedCategoryCovers.has(category.slug) &&
        category.coverImage !== expectedCategoryCovers.get(category.slug),
    );

    const localUploads = new Map<string, string>();
    for (const slot of localSlots) {
      const path = localUploadPath(slot.url);
      if (path) localUploads.set(slot.url, path);
    }
    for (const category of localCategories) {
      if (!category.coverImage) continue;
      const path = localUploadPath(category.coverImage);
      if (path) localUploads.set(category.coverImage, path);
    }
    await Promise.all([...localUploads.values()].map((path) => access(path)));

    console.log(`Local yuva: ${localSlots.length}`);
    console.log(`Canlı yuva: ${productionSlots.length}`);
    console.log(`Değişecek yuva: ${changed.length}`);
    console.log(`Canlıdan kaldırılacak fazladan yuva: ${removed.length}`);
    console.log(`Değişecek kategori kapağı: ${changedCategories.length}`);
    console.log(`Blob'a yüklenecek seçili local dosya: ${localUploads.size}`);

    if (changed.length) {
      console.log("\nYuva farkları:");
      for (const slot of changed) {
        const before = productionByKey.get(slot.key);
        console.log(`  ${slot.key}: ${before ? preview(before.url) : "BOŞ"} -> ${preview(slot.url)}`);
      }
    }
    if (removed.length) {
      console.log("\nKaldırılacak fazladan yuvalar:");
      for (const slot of removed) console.log(`  ${slot.key}: ${preview(slot.url)}`);
    }

    if (!APPLY) {
      console.log("\nRapor modu: hiçbir şey değiştirilmedi. Eşitlemek için --apply kullanın.");
      return;
    }

    for (const [sourceUrl, path] of localUploads) {
      const pathname = `media/uploads/${sourceUrl.slice("/media/uploads/".length)}`;
      await put(pathname, createReadStream(path), {
        access: "public",
        token: blobToken,
        contentType: CONTENT_TYPES[extname(path).toLowerCase()] ?? "application/octet-stream",
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 31_536_000,
      });
      console.log(`  Blob ✓ ${pathname}`);
    }

    await production.$transaction(async (tx) => {
      for (const slot of expectedSlots) {
        await tx.mediaAsset.upsert({
          where: { key: slot.key },
          update: {
            url: slot.url,
            kind: slot.kind,
            alt: slot.alt ?? undefined,
            sortOrder: slot.sortOrder,
          },
          create: {
            key: slot.key,
            url: slot.url,
            kind: slot.kind,
            alt: slot.alt ?? undefined,
            sortOrder: slot.sortOrder,
          },
        });
      }

      if (removed.length) {
        await tx.mediaAsset.deleteMany({
          where: { key: { in: removed.map((slot) => slot.key) } },
        });
      }

      for (const [slug, coverImage] of expectedCategoryCovers) {
        await tx.category.updateMany({ where: { slug }, data: { coverImage } });
      }
    });

    console.log("\n✓ Local medya seçimi canlı veritabanına eşitlendi.");
  } finally {
    await Promise.allSettled([local.$disconnect(), production.$disconnect()]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
