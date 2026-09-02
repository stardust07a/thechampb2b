/**
 * Trendyol ürün dökümünü katalog seçimi olarak uygular.
 *
 * Girdi: data/urunler-secim.xlsx — SKU seviyesinde döküm (13.253 satır).
 * `Model Kodu` ürünü, `Durum` sütunu satırın durumunu verir.
 *
 * Kurallar (kullanıcı kararı):
 *  1. Bir modelin BÜTÜN satırları "Ürün arşivlendi" ise ürün arşive alınır —
 *     silinmez, panelde "Arşiv" filtresinde kalır ve tek tıkla geri açılır.
 *  2. En az bir aktif satırı olan model yayında kalır.
 *  3. Sıralama Excel satır sırasıdır: EN ÜSTTEKİ EN YENİ. Katalogtaki
 *     "Newest" sıralaması bunu kullanır.
 *  4. Excel'de hiç bulunmayan ürün olursa arşive alınır ve raporlanır.
 *
 * Çalıştır: npm run data:selection
 */

import "dotenv/config";

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import ExcelJS from "exceljs";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const ROOT = resolve(import.meta.dirname, "..");
const XLSX = resolve(ROOT, "data/urunler-secim.xlsx");
const REPORT = resolve(ROOT, "data/selection-report.json");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

/** Bir satırın arşiv durumunu gösteren metinler. */
function isArchivedStatus(value: string): boolean {
  return value.toLocaleLowerCase("tr").includes("arşiv");
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text.trim();
    if ("result" in value) return String(value.result ?? "").trim();
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((r) => r.text).join("").trim();
    }
  }
  return String(value).trim();
}

async function main() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(XLSX);
  const sheet = workbook.worksheets[0];

  const header: Record<string, number> = {};
  sheet.getRow(1).eachCell((cell, index) => {
    header[cellText(cell.value)] = index;
  });

  const modelCol = header["Model Kodu"];
  const statusCol = header["Durum"];
  if (!modelCol) throw new Error('"Model Kodu" sütunu bulunamadı.');

  /** modelKodu -> { ilk görüldüğü satır, hepsi arşiv mi } */
  const models = new Map<string, { firstRow: number; allArchived: boolean }>();

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const model = cellText(row.getCell(modelCol).value);
    if (!model) continue;

    const archived = statusCol ? isArchivedStatus(cellText(row.getCell(statusCol).value)) : false;
    const existing = models.get(model);
    if (existing) {
      // tek bir aktif satır ürünü aktif yapar
      existing.allArchived = existing.allArchived && archived;
    } else {
      models.set(model, { firstRow: r, allArchived: archived });
    }
  }

  // Excel satır sırası -> sıra numarası (üstteki en yeni = 0)
  const ordered = [...models.entries()].sort((a, b) => a[1].firstRow - b[1].firstRow);
  const rank = new Map(ordered.map(([model], index) => [model, index]));

  console.log(`Excel: ${models.size} benzersiz model`);

  const products = await prisma.product.findMany({
    select: { id: true, productCode: true, modelCode: true, status: true },
  });

  const toPublish: { id: string; sortOrder: number }[] = [];
  const toArchive: { id: string; code: string; reason: string }[] = [];

  for (const product of products) {
    const model = product.modelCode ? models.get(product.modelCode) : undefined;

    if (!model) {
      toArchive.push({
        id: product.id,
        code: product.productCode,
        reason: "Excel listesinde yok",
      });
      continue;
    }
    if (model.allArchived) {
      toArchive.push({
        id: product.id,
        code: product.productCode,
        reason: "Excel'de tüm satırları arşivlenmiş",
      });
      continue;
    }
    toPublish.push({ id: product.id, sortOrder: rank.get(product.modelCode!) ?? 9999 });
  }

  console.log(`  yayında kalacak: ${toPublish.length}`);
  console.log(`  arşive alınacak: ${toArchive.length}`);

  // Arşivlenecekler
  if (toArchive.length > 0) {
    await prisma.product.updateMany({
      where: { id: { in: toArchive.map((p) => p.id) } },
      data: { status: "archived" },
    });
  }

  // Yayında kalacaklar — sıra numaraları tek tek yazılır. Uzak/serverless
  // veritabanlarında büyük bir transaction varsayılan süreyi aşabildiği için
  // küçük ve tekrar çalıştırılabilir gruplar kullanılır.
  const CHUNK = 25;
  for (let i = 0; i < toPublish.length; i += CHUNK) {
    const slice = toPublish.slice(i, i + CHUNK);
    await Promise.all(
      slice.map((p) =>
        prisma.product.update({
          where: { id: p.id },
          data: { status: "published", sortOrder: p.sortOrder },
        }),
      ),
    );
    if ((i + CHUNK) % 100 === 0) console.log(`  ${Math.min(i + CHUNK, toPublish.length)}/${toPublish.length}`);
  }

  // Görseli olmayanlar yayında kalmasın (brief §7)
  const noImages = await prisma.product.updateMany({
    where: { status: "published", variants: { none: {} } },
    data: { status: "draft" },
  });

  const counts = {
    yayinda: await prisma.product.count({ where: { status: "published" } }),
    arsiv: await prisma.product.count({ where: { status: "archived" } }),
    taslak: await prisma.product.count({ where: { status: "draft" } }),
  };

  writeFileSync(
    REPORT,
    JSON.stringify(
      {
        uygulandi: new Date().toISOString(),
        excelModelSayisi: models.size,
        siralama: "Excel satır sırası — en üstteki en yeni",
        yayinda: toPublish.length,
        gorselYokTaslagaAlindi: noImages.count,
        arsivlenen: toArchive.length,
        arsivlenenler: toArchive.map((p) => ({ kod: p.code, sebep: p.reason })),
        sonDurum: counts,
      },
      null,
      2,
    ),
  );

  console.log("\n✓ seçim uygulandı", counts);
  console.log(`→ ${REPORT}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
