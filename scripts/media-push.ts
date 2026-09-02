/**
 * `public/media` içeriğini Vercel Blob'a taşır.
 *
 * Vercel'de `public/` klasörü deploy paketine girer ama 1,6 GB'lık görseli
 * oraya koymak ne mümkün ne de doğru: her deploy'da yeniden yüklenir ve
 * boyut sınırına takılır. Görseller Blob'da durur, site `NEXT_PUBLIC_MEDIA_BASE`
 * üzerinden okur.
 *
 * Kurallar:
 *  - kesilirse kaldığı yerden devam eder (Blob'da var olan dosya atlanır)
 *  - eşzamanlı yükleme, hata durumunda 3 deneme
 *  - `--only=thumb,card` ile klasör seçilebilir
 *
 * Çalıştır:
 *   BLOB_READ_WRITE_TOKEN="..." npm run media:push
 *   npm run media:push -- --only=thumb,card,pdf,hero   (full olmadan, daha hızlı)
 *   npm run media:push -- --dry                         (sadece rapor)
 */

import "dotenv/config";

import { createReadStream, statSync } from "node:fs";
import { readdir, writeFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const MEDIA = resolve(ROOT, "public/media");
const LOG = resolve(ROOT, "data/media-push-log.json");

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"] as const;
  }),
);

const DRY = args.has("dry");
const CONCURRENCY = Number(args.get("concurrency") ?? 12);
const ONLY = args.get("only")?.split(",").map((s) => s.trim()).filter(Boolean);
const RETRIES = 3;

const CONTENT_TYPES: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

async function listFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listFiles(full)));
    else out.push(full);
  }
  return out;
}

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token && !DRY) {
    console.error("BLOB_READ_WRITE_TOKEN tanımlı değil.");
    console.error("Vercel → Storage → Blob → token'ı alıp .env'e ekleyin.");
    process.exit(1);
  }

  let files = await listFiles(MEDIA);
  if (ONLY) {
    files = files.filter((f) => {
      const top = relative(MEDIA, f).split(sep)[0];
      return ONLY.includes(top);
    });
  }
  // uploads/ zaten Blob'da (panelden yüklenmiş) — tekrar göndermeye gerek yok
  files = files.filter((f) => relative(MEDIA, f).split(sep)[0] !== "uploads");

  const totalBytes = files.reduce((a, f) => a + statSync(f).size, 0);
  console.log(
    `${files.length.toLocaleString("tr")} dosya · ${(totalBytes / 1024 ** 3).toFixed(2)} GB` +
      (ONLY ? ` · sadece: ${ONLY.join(", ")}` : ""),
  );

  if (DRY) {
    console.log("(--dry: hiçbir şey yüklenmedi)");
    return;
  }

  const { put, list } = await import("@vercel/blob");

  // Blob'da hâlihazırda olanları topla — kesilen yüklemeyi sürdürebilmek için
  console.log("Blob içeriği okunuyor…");
  const existing = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = await list({ token, prefix: "media/", cursor, limit: 1000 });
    for (const b of page.blobs) existing.add(b.pathname);
    cursor = page.cursor;
  } while (cursor);
  console.log(`  Blob'da mevcut: ${existing.size.toLocaleString("tr")}`);

  let done = 0;
  let uploaded = 0;
  let skipped = 0;
  const failures: { file: string; error: string }[] = [];
  const startedAt = Date.now();

  async function upload(file: string) {
    const key = `media/${relative(MEDIA, file).split(sep).join("/")}`;
    if (existing.has(key)) {
      skipped++;
      return;
    }

    const ext = file.split(".").pop()?.toLowerCase() ?? "";
    for (let attempt = 1; attempt <= RETRIES; attempt++) {
      try {
        await put(key, createReadStream(file), {
          access: "public",
          token,
          contentType: CONTENT_TYPES[ext] ?? "application/octet-stream",
          addRandomSuffix: false,
          cacheControlMaxAge: 31_536_000,
        });
        uploaded++;
        return;
      } catch (error) {
        if (attempt === RETRIES) {
          failures.push({
            file: key,
            error: error instanceof Error ? error.message : String(error),
          });
          return;
        }
        await new Promise((r) => setTimeout(r, attempt * 1500));
      }
    }
  }

  let cursorIndex = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (cursorIndex < files.length) {
        const file = files[cursorIndex++];
        await upload(file);
        done++;
        if (done % 250 === 0) {
          const elapsed = (Date.now() - startedAt) / 1000;
          const eta = Math.round((files.length - done) / Math.max(done / elapsed, 0.01) / 60);
          console.log(
            `  ${done}/${files.length} · yüklenen ${uploaded} · atlanan ${skipped} · ` +
              `hata ${failures.length} · ~${eta} dk`,
          );
        }
      }
    }),
  );

  await writeFile(
    LOG,
    JSON.stringify(
      {
        finishedAt: new Date().toISOString(),
        total: files.length,
        uploaded,
        skipped,
        failed: failures.length,
        durationSec: Math.round((Date.now() - startedAt) / 1000),
        failures: failures.slice(0, 200),
      },
      null,
      2,
    ),
  );

  console.log(`\n✓ bitti · yüklenen ${uploaded} · atlanan ${skipped} · hata ${failures.length}`);
  console.log(`→ ${LOG}`);
  if (failures.length > 0) {
    console.log("Betiği tekrar çalıştırın; yüklenmiş dosyalar atlanır.");
  } else {
    console.log("\nSonraki adım: NEXT_PUBLIC_MEDIA_BASE değerini Blob adresine çevirin:");
    console.log('  NEXT_PUBLIC_MEDIA_BASE="https://<store-id>.public.blob.vercel-storage.com/media"');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
