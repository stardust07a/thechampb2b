import "server-only";
import ExcelJS from "exceljs";

/**
 * Excel içe aktarma — brief §6.3 / §6.2/7.
 *
 * Beklenen sayfalar (hepsi opsiyonel; hangisi varsa o işlenir):
 *   "Kategori Fiyat"    slug | 100 | 300 | 500 | 1000
 *   "Kategori Üretim"   slug | kumaş TR | kumaş EN | gramaj | moq | termin |
 *                       paketleme TR | paketleme EN | private label | baskı TR | baskı EN
 *   "Ürün İstisnaları"  ürün kodu | 100 | 300 | 500 | 1000 | kumaş TR | gramaj | moq | termin
 *   "Ayarlar"           anahtar | değer
 *
 * Başlık satırı adları esnek eşlenir (büyük/küçük harf ve boşluk fark etmez).
 * Bu modül SADECE okur ve doğrular; yazma işlemi ayrı bir transaction'da yapılır.
 */

export type RowIssue = { sheet: string; row: number; column: string; message: string };

export type CategoryPricePatch = {
  slug: string;
  price100: string | null;
  price300: string | null;
  price500: string | null;
  price1000: string | null;
};

export type CategoryProductionPatch = {
  slug: string;
  fabric: Record<string, string> | null;
  gsm: number | null;
  moq: number | null;
  leadTimeDays: string | null;
  packaging: Record<string, string> | null;
  privateLabel: boolean | null;
  printType: Record<string, string> | null;
};

export type ProductPatch = {
  productCode: string;
  price100: string | null;
  price300: string | null;
  price500: string | null;
  price1000: string | null;
  fabric: Record<string, string> | null;
  gsm: number | null;
  moq: number | null;
  leadTimeDays: string | null;
};

export type SettingPatch = { key: string; value: unknown };

export type ParsedWorkbook = {
  categoryPrices: CategoryPricePatch[];
  categoryProduction: CategoryProductionPatch[];
  products: ProductPatch[];
  settings: SettingPatch[];
  issues: RowIssue[];
  sheetsFound: string[];
};

function norm(s: unknown): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]/g, "");
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text.trim();
    if ("result" in value) return String(value.result ?? "").trim();
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((r) => r.text).join("").trim();
    }
    if (value instanceof Date) return value.toISOString();
  }
  return String(value).trim();
}

/** Başlık satırından sütun adı -> index haritası kurar. */
function headerMap(sheet: ExcelJS.Worksheet): Map<string, number> {
  const map = new Map<string, number>();
  const header = sheet.getRow(1);
  header.eachCell((cell, col) => {
    const key = norm(cellText(cell.value));
    if (key && !map.has(key)) map.set(key, col);
  });
  return map;
}

/** Aday adlardan ilk bulunan sütunu döner. */
function col(map: Map<string, number>, ...candidates: string[]): number | null {
  for (const c of candidates) {
    const hit = map.get(norm(c));
    if (hit) return hit;
  }
  return null;
}

function readDecimal(
  raw: string,
  sheet: string,
  row: number,
  column: string,
  issues: RowIssue[],
): string | null {
  if (raw === "") return null;
  const normalized = raw.replace(/\s/g, "").replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) {
    issues.push({ sheet, row, column, message: `Geçersiz fiyat: "${raw}"` });
    return null;
  }
  return value.toFixed(2);
}

function readInt(
  raw: string,
  sheet: string,
  row: number,
  column: string,
  issues: RowIssue[],
): number | null {
  if (raw === "") return null;
  const value = Number(raw.replace(/\s/g, ""));
  if (!Number.isInteger(value) || value < 0) {
    issues.push({ sheet, row, column, message: `Tam sayı bekleniyor: "${raw}"` });
    return null;
  }
  return value;
}

function l10nOrNull(tr: string, en: string): Record<string, string> | null {
  if (!tr && !en) return null;
  const primary = en || tr;
  return { en: primary, tr: tr || primary, de: primary, ar: primary };
}

export async function parseWorkbook(buffer: ArrayBuffer): Promise<ParsedWorkbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const issues: RowIssue[] = [];
  const result: ParsedWorkbook = {
    categoryPrices: [],
    categoryProduction: [],
    products: [],
    settings: [],
    issues,
    sheetsFound: workbook.worksheets.map((w) => w.name),
  };

  for (const sheet of workbook.worksheets) {
    const key = norm(sheet.name);
    const map = headerMap(sheet);

    /* ------------------------------------------------ Kategori Fiyat */
    if (key.includes("kategorifiyat") || key.includes("categoryprice")) {
      const slugCol = col(map, "slug", "kategori", "category");
      const c100 = col(map, "100", "100+", "price100");
      const c300 = col(map, "300", "300+", "price300");
      const c500 = col(map, "500", "500+", "price500");
      const c1000 = col(map, "1000", "1000+", "price1000");

      if (!slugCol) {
        issues.push({ sheet: sheet.name, row: 1, column: "slug", message: "Slug sütunu bulunamadı." });
        continue;
      }

      sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;
        const slug = cellText(row.getCell(slugCol).value);
        if (!slug) return;
        result.categoryPrices.push({
          slug,
          price100: c100 ? readDecimal(cellText(row.getCell(c100).value), sheet.name, rowNumber, "100+", issues) : null,
          price300: c300 ? readDecimal(cellText(row.getCell(c300).value), sheet.name, rowNumber, "300+", issues) : null,
          price500: c500 ? readDecimal(cellText(row.getCell(c500).value), sheet.name, rowNumber, "500+", issues) : null,
          price1000: c1000 ? readDecimal(cellText(row.getCell(c1000).value), sheet.name, rowNumber, "1000+", issues) : null,
        });
      });
      continue;
    }

    /* --------------------------------------------- Kategori Üretim */
    if (key.includes("kategoriuretim") || key.includes("categoryproduction")) {
      const slugCol = col(map, "slug", "kategori", "category");
      if (!slugCol) {
        issues.push({ sheet: sheet.name, row: 1, column: "slug", message: "Slug sütunu bulunamadı." });
        continue;
      }
      const cFabricTr = col(map, "kumastr", "kumas", "fabrictr", "fabric");
      const cFabricEn = col(map, "kumasen", "fabricen");
      const cGsm = col(map, "gramaj", "gsm");
      const cMoq = col(map, "moq", "minimumsiparis");
      const cLead = col(map, "termin", "leadtime", "termingun");
      const cPackTr = col(map, "paketlemetr", "paketleme", "packagingtr", "packaging");
      const cPackEn = col(map, "paketlemeen", "packagingen");
      const cPl = col(map, "privatelabel", "privatelabeluygun");
      const cPrintTr = col(map, "baskitr", "baski", "printtypetr", "printtype");
      const cPrintEn = col(map, "baskien", "printtypeen");

      sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;
        const slug = cellText(row.getCell(slugCol).value);
        if (!slug) return;

        const plRaw = cPl ? norm(cellText(row.getCell(cPl).value)) : "";
        const privateLabel =
          plRaw === "" ? null : ["evet", "var", "yes", "true", "1", "x"].includes(plRaw);

        result.categoryProduction.push({
          slug,
          fabric: l10nOrNull(
            cFabricTr ? cellText(row.getCell(cFabricTr).value) : "",
            cFabricEn ? cellText(row.getCell(cFabricEn).value) : "",
          ),
          gsm: cGsm ? readInt(cellText(row.getCell(cGsm).value), sheet.name, rowNumber, "gramaj", issues) : null,
          moq: cMoq ? readInt(cellText(row.getCell(cMoq).value), sheet.name, rowNumber, "moq", issues) : null,
          leadTimeDays: cLead ? cellText(row.getCell(cLead).value) || null : null,
          packaging: l10nOrNull(
            cPackTr ? cellText(row.getCell(cPackTr).value) : "",
            cPackEn ? cellText(row.getCell(cPackEn).value) : "",
          ),
          privateLabel,
          printType: l10nOrNull(
            cPrintTr ? cellText(row.getCell(cPrintTr).value) : "",
            cPrintEn ? cellText(row.getCell(cPrintEn).value) : "",
          ),
        });
      });
      continue;
    }

    /* -------------------------------------------- Ürün İstisnaları */
    if (key.includes("urunistisna") || key.includes("productexception") || key.includes("urun")) {
      const codeCol = col(map, "uruncodu", "urunkodu", "kod", "productcode", "code", "sku");
      if (!codeCol) {
        issues.push({
          sheet: sheet.name,
          row: 1,
          column: "ürün kodu",
          message: "Ürün kodu sütunu bulunamadı.",
        });
        continue;
      }
      const c100 = col(map, "100", "100+", "price100");
      const c300 = col(map, "300", "300+", "price300");
      const c500 = col(map, "500", "500+", "price500");
      const c1000 = col(map, "1000", "1000+", "price1000");
      const cFabricTr = col(map, "kumastr", "kumas", "fabrictr", "fabric");
      const cFabricEn = col(map, "kumasen", "fabricen");
      const cGsm = col(map, "gramaj", "gsm");
      const cMoq = col(map, "moq");
      const cLead = col(map, "termin", "leadtime");

      sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;
        const productCode = cellText(row.getCell(codeCol).value);
        if (!productCode) return;

        result.products.push({
          productCode,
          price100: c100 ? readDecimal(cellText(row.getCell(c100).value), sheet.name, rowNumber, "100+", issues) : null,
          price300: c300 ? readDecimal(cellText(row.getCell(c300).value), sheet.name, rowNumber, "300+", issues) : null,
          price500: c500 ? readDecimal(cellText(row.getCell(c500).value), sheet.name, rowNumber, "500+", issues) : null,
          price1000: c1000 ? readDecimal(cellText(row.getCell(c1000).value), sheet.name, rowNumber, "1000+", issues) : null,
          fabric: l10nOrNull(
            cFabricTr ? cellText(row.getCell(cFabricTr).value) : "",
            cFabricEn ? cellText(row.getCell(cFabricEn).value) : "",
          ),
          gsm: cGsm ? readInt(cellText(row.getCell(cGsm).value), sheet.name, rowNumber, "gramaj", issues) : null,
          moq: cMoq ? readInt(cellText(row.getCell(cMoq).value), sheet.name, rowNumber, "moq", issues) : null,
          leadTimeDays: cLead ? cellText(row.getCell(cLead).value) || null : null,
        });
      });
      continue;
    }

    /* ------------------------------------------------------ Ayarlar */
    if (key.includes("ayar") || key.includes("setting")) {
      const keyCol = col(map, "anahtar", "key", "ayar") ?? 1;
      const valueCol = col(map, "deger", "value", "değer") ?? 2;

      sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;
        const settingKey = cellText(row.getCell(keyCol).value);
        const raw = cellText(row.getCell(valueCol).value);
        if (!settingKey || raw === "") return;

        // sayıya benziyorsa sayı, "evet/hayır" ise boolean, değilse metin
        const asNumber = Number(raw.replace(",", "."));
        const lower = norm(raw);
        let value: unknown = raw;
        if (raw !== "" && Number.isFinite(asNumber) && /^[\d.,\s]+$/.test(raw)) value = asNumber;
        else if (["evet", "true", "var"].includes(lower)) value = true;
        else if (["hayir", "false", "yok"].includes(lower)) value = false;

        result.settings.push({ key: settingKey, value });
      });
    }
  }

  return result;
}
