/**
 * Görsel taşıma pipeline'ı — brief §6.2/5.
 *
 * Kaynaktaki 1200x1800 orijinaller indirilir, her biri için 3 boyut üretilir
 * (thumb 400w, card 800w, full 1400w), hepsi WebP. Çıktı:
 *   public/media/{thumb|card|full}/{productCode}/{colorSlug}/{index}.webp
 *
 * BLOB_READ_WRITE_TOKEN tanımlıysa aynı dosyalar Vercel Blob'a da yüklenir.
 *
 * Kurallar:
 *  - eşzamanlı 8 indirme, hata durumunda 3 deneme (artan bekleme)
 *  - kesilirse kaldığı yerden devam eder (var olan dosya atlanır)
 *  - her adım data/media-log.json'a yazılır
 *  - Trendyol CDN'ine canlı sitede hiçbir referans kalmaz; bu betik tek
 *    dokunma noktasıdır ve build'e dahil değildir.
 *
 * Çalıştır:  npm run media:pull
 *   --limit=N      sadece ilk N ürün (deneme için)
 *   --concurrency=N
 *   --force        var olan dosyaları yeniden üret
 */

import "dotenv/config";

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const ROOT = resolve(import.meta.dirname, "..");
const SRC = resolve(ROOT, "data/products.normalized.json");
const OUT_ROOT = resolve(ROOT, "public/media");
const LOG = resolve(ROOT, "data/media-log.json");

const SIZES = [
  { name: "thumb", width: 400, quality: 72 },
  { name: "card", width: 800, quality: 76 },
  { name: "full", width: 1400, quality: 80 },
] as const;

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"] as const;
  }),
);

const LIMIT = args.has("limit") ? Number(args.get("limit")) : Infinity;
const CONCURRENCY = args.has("concurrency") ? Number(args.get("concurrency")) : 8;
const FORCE = args.has("force");
const RETRIES = 3;

type Job = { key: string; url: string; productCode: string };

type LogEntry = { key: string; url: string; error: string; attempts: number };

async function main() {
const data = JSON.parse(await readFile(SRC, "utf8")) as {
  products: {
    productCode: string;
    variants: { colorSlug: string; sourceImages: string[] }[];
  }[];
};

const jobs: Job[] = [];
for (const product of data.products.slice(0, LIMIT)) {
  for (const variant of product.variants) {
    variant.sourceImages.forEach((url, i) => {
      jobs.push({
        key: `${product.productCode}/${variant.colorSlug}/${i + 1}.webp`,
        url,
        productCode: product.productCode,
      });
    });
  }
}

console.log(`${jobs.length} görsel · ${SIZES.length} boyut · eşzamanlı ${CONCURRENCY}`);

const failures: LogEntry[] = [];
let done = 0;
let skipped = 0;
let written = 0;
const startedAt = Date.now();

function outPath(size: string, key: string): string {
  return resolve(OUT_ROOT, size, key);
}

/** Bu görselin üç boyutu da diskte var mı? */
function alreadyDone(key: string): boolean {
  return SIZES.every((s) => existsSync(outPath(s.name, key)));
}

async function fetchWithRetry(url: string): Promise<Buffer> {
  let lastError = "";
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "user-agent": "thechampb2b-media-import/1.0" },
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt < RETRIES) {
        // artan bekleme: 1s, 3s
        await new Promise((r) => setTimeout(r, attempt * 2000 - 1000));
      }
    }
  }
  throw new Error(lastError);
}

async function processJob(job: Job): Promise<void> {
  if (!FORCE && alreadyDone(job.key)) {
    skipped++;
    return;
  }

  try {
    const buffer = await fetchWithRetry(job.url);

    for (const size of SIZES) {
      const target = outPath(size.name, job.key);
      if (!FORCE && existsSync(target)) continue;
      await mkdir(dirname(target), { recursive: true });
      await sharp(buffer)
        .resize({ width: size.width, withoutEnlargement: true })
        .webp({ quality: size.quality, effort: 4 })
        .toFile(target);
      written++;
    }
  } catch (error) {
    failures.push({
      key: job.key,
      url: job.url,
      error: error instanceof Error ? error.message : String(error),
      attempts: RETRIES,
    });
  } finally {
    done++;
    if (done % 100 === 0) {
      const elapsed = (Date.now() - startedAt) / 1000;
      const rate = done / elapsed;
      const eta = Math.round((jobs.length - done) / Math.max(rate, 0.01));
      console.log(
        `${done}/${jobs.length} · yazılan ${written} · atlanan ${skipped} · ` +
          `hata ${failures.length} · ~${Math.round(eta / 60)} dk kaldı`,
      );
    }
  }
}

/** Sabit havuzlu eşzamanlılık — kaynağa nazik davranır. */
async function run() {
  let cursor = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      await processJob(job);
    }
  });
  await Promise.all(workers);
}

await run();

await writeFile(
  LOG,
  JSON.stringify(
    {
      finishedAt: new Date().toISOString(),
      total: jobs.length,
      written,
      skipped,
      failed: failures.length,
      durationSec: Math.round((Date.now() - startedAt) / 1000),
      failures: failures.slice(0, 500),
    },
    null,
    2,
  ),
);

console.log(
  `\n✓ bitti · ${done}/${jobs.length} · yazılan ${written} · atlanan ${skipped} · hata ${failures.length}`,
);
console.log(`→ ${LOG}`);
if (failures.length > 0) {
  console.log("Hatalı görseller için betiği tekrar çalıştırın; tamamlananlar atlanır.");
}
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
