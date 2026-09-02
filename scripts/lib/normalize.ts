/**
 * Kaynak veriyi (Trendyol basliklari) B2B kataloguna donusturen kurallar.
 * Brief SS6.2 maddeleri 1-4, 8, 9.
 */

import {
  CATEGORY_SINGULAR,
  COLORS,
  COLOR_NOISE,
  DETAIL_LEXICON,
  FITS,
  KIDS_GENDER,
  LOCALES,
  MOTIF_FILLER,
  MOTIF_LEXICON,
  NAME_STOPWORDS,
  PRINT_KINDS,
  SECTIONS,
  type ColorDef,
  type L10n,
  type Locale,
} from "./lexicon";

/* ------------------------------------------------------------ yardimcilar */

/** Turkce'ye duyarli kucultme (I/İ tuzagi) + aksan sokme. */
export function fold(s: string): string {
  return s
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ğ/g, "g")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss")
    .trim();
}

export function slugify(s: string): string {
  return fold(s)
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export function titleCase(s: string): string {
  const small = new Set(["and", "of", "the", "with", "for", "in", "on"]);
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => {
      const lower = w.toLocaleLowerCase("en");
      if (i > 0 && small.has(lower)) return lower;
      if (/^[A-Z0-9]{2,}$/.test(w)) return w; // CHMP, WF, 3D
      return w.charAt(0).toLocaleUpperCase("en") + w.slice(1);
    })
    .join(" ");
}

function emptyL10n(): L10n {
  return { en: "", tr: "", de: "", ar: "" };
}

/* ------------------------------------------------------------------ renk */

export type NormalizedColor = {
  raw: string;
  canonical: string; // "Black"
  tr: string;
  de: string;
  ar: string;
  hex: string | null;
  mapped: boolean;
};

/** Renk adindan sayi/noktalama kuyrugunu ve renk olmayan ekleri temizler. */
function stripColorNoise(raw: string): string[] {
  const cleaned = fold(raw)
    .replace(/[.]+$/g, "")
    .replace(/[0-9]+$/g, "")
    .trim();
  // "siyah-beyaz" gibi ikili renkler ayri parcalara bolunur
  return cleaned
    .split(/[-/]| ve /)
    .map((p) => p.replace(/[0-9]+$/g, "").trim())
    .filter((p) => p.length > 0 && !COLOR_NOISE.has(p));
}

export function normalizeColor(raw: string): NormalizedColor {
  const parts = stripColorNoise(raw);
  const defs: ColorDef[] = [];
  const unmatched: string[] = [];

  // once cok kelimeli tam eslesme ("gri melanj", "acik mavi", "tas rengi")
  for (const part of parts) {
    const direct = COLORS[part];
    if (direct) {
      defs.push(direct);
      continue;
    }
    // "tas rengi" -> "tas", "petrol yesili" -> "petrol yesili" zaten var
    const withoutRengi = part.replace(/\s*rengi$/, "").trim();
    if (COLORS[withoutRengi]) {
      defs.push(COLORS[withoutRengi]);
      continue;
    }
    // son care: ilk kelime bir renkse onu al ("nefti yesil x" gibi)
    const words = part.split(/\s+/);
    const tail = words.slice(-1)[0];
    if (words.length > 1 && COLORS[tail]) {
      defs.push(COLORS[tail]);
      continue;
    }
    if (COLORS[words[0]]) {
      defs.push(COLORS[words[0]]);
      continue;
    }
    unmatched.push(part);
  }

  if (defs.length === 0) {
    const fallback = titleCase(raw.toLocaleLowerCase("tr"));
    return {
      raw,
      canonical: fallback,
      tr: fallback,
      de: fallback,
      ar: fallback,
      hex: null,
      mapped: false,
    };
  }

  const join = (k: keyof ColorDef) => defs.map((d) => d[k]).join(" / ");
  return {
    raw,
    canonical: join("en"),
    tr: join("tr"),
    de: join("de"),
    ar: defs.map((d) => d.ar).join(" / "),
    hex: defs[0].hex,
    mapped: unmatched.length === 0,
  };
}

/* ----------------------------------------------------------------- beden */

export const ADULT_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"];
export const COMBO_ORDER = ["XS/S", "S/M", "M/L", "L/XL", "XL/2XL"];
export const KIDS_ORDER = ["4-5", "6-7", "8-9", "10-11", "12-13", "14-15"];

const COMBO_ALIASES: Record<string, string> = {
  "XS-S": "XS/S",
  "XL-XXL": "XL/2XL",
  "XXL-L": "L/XL",
  "XL/L": "L/XL",
  "S-M": "S/M",
  "M-L": "M/L",
  "L-XL": "L/XL",
};

/** "S/B", "XL/P", "2XL/T", "32" gibi kirli degerlerin sadelestirilmesi. */
const SUFFIXED = /^(XS|S|M|L|XL|2XL|3XL|4XL|5XL|6XL)\/[A-Z]$/;

export type SizeResult = {
  sizes: string[];
  range: string | null;
  audience: "adult" | "kids";
  warnings: string[];
  /** bebek bedeni bulundu -> urun yayinlanmaz (brief SS6.2/9) */
  babySize: boolean;
};

function kidsCanonical(raw: string): string | null {
  const m = raw.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (!m) return null;
  const lo = Number(m[1]);
  const hi = Number(m[2]);
  const mid = (lo + hi) / 2;
  let best = KIDS_ORDER[0];
  let bestDist = Infinity;
  for (const c of KIDS_ORDER) {
    const [a, b] = c.split("-").map(Number);
    const d = Math.abs((a + b) / 2 - mid);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

export function normalizeSizes(rawSizes: string[], audienceHint: string): SizeResult {
  const warnings: string[] = [];
  const adult = new Set<string>();
  const combos = new Set<string>();
  const kids = new Set<string>();
  let babySize = false;
  let standart = false;

  for (const raw0 of rawSizes) {
    const raw = String(raw0).trim();
    if (!raw) continue;
    const upper = raw.toLocaleUpperCase("tr").replace(/\s+/g, " ");

    // bebek: "12-13 Ay"
    if (/\bAY\b/i.test(upper)) {
      babySize = true;
      continue;
    }

    // cocuk: "4-5 Yaş", "10-13"
    if (/YAŞ|YAS/i.test(upper) || (audienceHint === "kids" && /^\d+\s*[-–]\s*\d+$/.test(upper))) {
      const c = kidsCanonical(upper);
      if (c) kids.add(c);
      else warnings.push(`beden eslenmedi: ${raw}`);
      continue;
    }

    if (upper === "STANDART" || upper === "STANDARD") {
      standart = true;
      continue;
    }

    // saf sayi ("32") -> tekil, standart say
    if (/^\d+$/.test(upper)) {
      standart = true;
      warnings.push(`sayisal beden standart kabul edildi: ${raw}`);
      continue;
    }

    const normalizedXXL = upper.replace(/\bXXL\b/g, "2XL").replace(/\bXXXL\b/g, "3XL");

    if (ADULT_ORDER.includes(normalizedXXL)) {
      adult.add(normalizedXXL);
      continue;
    }
    if (COMBO_ORDER.includes(normalizedXXL)) {
      combos.add(normalizedXXL);
      continue;
    }
    if (COMBO_ALIASES[upper]) {
      combos.add(COMBO_ALIASES[upper]);
      continue;
    }
    if (COMBO_ALIASES[normalizedXXL]) {
      combos.add(COMBO_ALIASES[normalizedXXL]);
      continue;
    }
    // "S/B", "XL/P", "2XL/T" -> ekten arindir
    if (SUFFIXED.test(normalizedXXL)) {
      adult.add(normalizedXXL.split("/")[0]);
      continue;
    }
    warnings.push(`beden eslenmedi: ${raw}`);
  }

  const audience: "adult" | "kids" = kids.size > 0 ? "kids" : "adult";

  let sizes: string[];
  if (audience === "kids") {
    sizes = KIDS_ORDER.filter((s) => kids.has(s));
  } else if (adult.size > 0) {
    sizes = ADULT_ORDER.filter((s) => adult.has(s));
    if (combos.size > 0) sizes = sizes.concat(COMBO_ORDER.filter((s) => combos.has(s)));
  } else if (combos.size > 0) {
    sizes = COMBO_ORDER.filter((s) => combos.has(s));
  } else {
    sizes = standart ? ["Standart"] : [];
  }

  if (sizes.length === 0) {
    sizes = ["Standart"];
    warnings.push("beden bulunamadi, Standart atandi");
  }

  return { sizes, range: sizeRange(sizes, audience), audience, warnings, babySize };
}

/** Kart ve detayda gosterilecek aralik: "XS–2XL" / "4-5 → 14-15". */
export function sizeRange(sizes: string[], audience: "adult" | "kids"): string | null {
  if (sizes.length === 0) return null;
  if (sizes.length === 1) return sizes[0];
  if (audience === "kids") return `${sizes[0]} → ${sizes[sizes.length - 1]}`;
  const plain = sizes.filter((s) => ADULT_ORDER.includes(s));
  if (plain.length >= 2) return `${plain[0]}–${plain[plain.length - 1]}`;
  return sizes.join(" · ");
}

/* ------------------------------------------------------------- urun adi */

export type NameParts = {
  motifTokens: string[];
  printKind: keyof typeof PRINT_KINDS;
  fitKey: string | null;
  kidsGender: "girl" | "boy" | null;
};

const PRINT_MARKERS: Array<[RegExp, keyof typeof PRINT_KINDS]> = [
  [/3d\s*bask/i, "print3d"],
  [/nakis|nakış/i, "embroidery"],
  [/yazi\s*bask|yazili/i, "text"],
  [/desenli|desen/i, "pattern"],
  [/bask/i, "print"],
];

/** Baslik icindeki, motif olarak kullanilabilecek kelimeleri ayiklar. */
export function extractNameParts(
  nameTr: string,
  categorySlug: string,
  subcategory: string | null,
  section: string,
): NameParts {
  const head = nameTr.split(/[–—]/)[0];
  const folded = fold(nameTr);

  let printKind: keyof typeof PRINT_KINDS = "plain";
  for (const [re, kind] of PRINT_MARKERS) {
    if (re.test(folded)) {
      printKind = kind;
      break;
    }
  }

  let kidsGender: "girl" | "boy" | null = null;
  if (section === "Kids") {
    if (/\bkiz\b/.test(folded)) kidsGender = "girl";
    else if (/\berkek\b/.test(folded)) kidsGender = "boy";
  }

  const fitKey =
    subcategory && subcategory !== "Printed" && FITS[subcategory] ? subcategory : null;

  const motifTokens: string[] = [];
  const seen = new Set<string>();
  for (const rawWord of head.split(/[\s/\-–—]+/)) {
    const word = rawWord.replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, "");
    if (!word) continue;
    const key = fold(word);
    if (!key || key.length < 2) continue;
    if (NAME_STOPWORDS.has(key)) continue;
    if (MOTIF_FILLER.has(key)) continue;
    if (/^[\d%]+$/.test(key)) continue;
    if (COLORS[key]) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    motifTokens.push(word);
    if (motifTokens.length >= 3) break;
  }

  return { motifTokens, printKind, fitKey, kidsGender };
}

/* -------------------------------------------------- Turkce kalinti filtresi */

const TR_CHARS = /[ıİşŞğĞçÇöÖüÜ]/;
/** Turkce ek kuyruklari: konforlu, baskili, yazilik, arkasi ... */
const TR_SUFFIX = /(li|lu|lik|luk|siz|suz|mis|lar|ler|nin|nun|sal|ci|cu|deki|daki)$/;

/**
 * Bir motif kelimesi EN/DE/AR adinda kalabilir mi?
 * Sozlukte varsa evet (cevrilir). Yoksa: Turkce gorunuyorsa hayir, ozel isim /
 * Ingilizce baski adiysa evet (aynen gecer).
 */
function keepInForeignName(word: string): boolean {
  const key = fold(word);
  if (MOTIF_LEXICON[key]) return true;
  if (TR_CHARS.test(word)) return false;
  if (key.length > 4 && TR_SUFFIX.test(key)) return false;
  return true;
}

/** Kirpma sonrasi baglac/edat ile biten adlari toparlar ("Chess Is" -> "Chess"). */
const DANGLING = new Set([
  "is", "are", "am", "the", "a", "an", "of", "and", "or", "in", "on", "to",
  "my", "me", "you", "your", "it", "its", "we", "so", "no", "not", "for",
  "with", "at", "be", "do", "don't", "let", "let's", "i", "i'm", "it's",
]);

function trimDangling(words: string[]): string[] {
  const out = [...words];
  while (out.length > 0 && DANGLING.has(fold(out[out.length - 1]))) out.pop();
  return out;
}

/** Motif kelimesini hedef dile cevirir; sozlukte yoksa oldugu gibi birakir. */
function motifIn(word: string, locale: Locale): string {
  const key = fold(word);
  const hit = MOTIF_LEXICON[key];
  if (hit) return hit[locale];
  // sozlukte yok: ozel isim / marka / ingilizce kelime -> aynen, baslik formatinda
  return titleCase(word.toLocaleLowerCase("tr"));
}

const MAX_NAME_LEN = 40;

/**
 * Arapçada baskı motifi isme "…li/…lı" gibi bir sıfatla değil, bir edat
 * öbeğiyle bağlanır. Baskı türüne göre doğru öbek:
 */
const AR_PRINT_PREFIX: Record<string, string> = {
  print: "بطبعة",
  text: "بطباعة كتابية",
  pattern: "بنقشة",
  embroidery: "بتطريز",
  print3d: "بطباعة ثلاثية الأبعاد",
  plain: "بتصميم",
};

/**
 * 4 dilde urun adi kurar.
 * Kalip: [Bolum] [Kalip] [Motif] [Baski] [Kategori]
 * 40 karakteri asarsa sirasiyla kalip -> motif kuyrugu atilir.
 */
export function buildNames(
  parts: NameParts,
  categorySlug: string,
  section: string,
): { name: L10n; motifEn: string } {
  const cat = CATEGORY_SINGULAR[categorySlug];
  const out = emptyL10n();
  let motifEn = "";

  for (const locale of LOCALES) {
    const sectionWord =
      section === "Kids" && parts.kidsGender
        ? KIDS_GENDER[parts.kidsGender][locale]
        : SECTIONS[section][locale];
    const fitWord = parts.fitKey ? FITS[parts.fitKey][locale] : "";
    const printWord = PRINT_KINDS[parts.printKind][locale];
    const catWord = cat ? cat[locale] : categorySlug;

    // TR adinda Turkce kelime kalabilir; diger dillerde cevrilemeyen Turkce atilir
    const usable =
      locale === "tr" ? parts.motifTokens : parts.motifTokens.filter(keepInForeignName);
    let motifWords = trimDangling(usable.map((w) => motifIn(w, locale)).filter(Boolean));
    if (locale === "en") motifEn = motifWords.join(" ");

    // "Polo" kalibi + "Polo Shirt" kategorisi gibi tekrarlari eleme
    const fitUsable = fitWord && !catWord.toLocaleLowerCase("en").includes(fitWord.toLocaleLowerCase("en"));
    const printUsable =
      printWord && !motifWords.some((m) => fold(m) === fold(printWord));

    /**
     * Kelime sırası dile göre değişir.
     *
     * Latin dillerinde sıfat isimden önce gelir:
     *   Men Oversize Cherry Print Sweatshirt
     *
     * Arapçada isim ÖNCE gelir, sıfatlar arkasından sıralanır ve baskı
     * "بطبعة X" (X baskılı) biçiminde bağlanır:
     *   سويت شيرت رجالي أوفرسايز بطبعة Cherry
     */
    const assemble = (motifs: string[], withFit: boolean) => {
      const fit = withFit && fitUsable ? fitWord : "";

      if (locale === "ar") {
        const print = motifs.length
          ? `${AR_PRINT_PREFIX[parts.printKind] ?? "بطبعة"} ${motifs.join(" ")}`
          : printUsable
            ? printWord
            : "";
        return [catWord, sectionWord, fit, print]
          .filter((x) => x && x.trim())
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
      }

      return [sectionWord, fit, ...motifs, printUsable ? printWord : "", catWord]
        .filter((x) => x && x.trim())
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    };

    let candidate = assemble(motifWords, true);
    // kisaltma sirasi: motif kuyrugunu at, sonra kalibi at
    while (candidate.length > MAX_NAME_LEN && motifWords.length > 0) {
      motifWords = trimDangling(motifWords.slice(0, -1));
      candidate = assemble(motifWords, true);
    }
    if (candidate.length > MAX_NAME_LEN) candidate = assemble(motifWords, false);

    out[locale] = candidate;
  }

  return { name: out, motifEn };
}

/* ------------------------------------------------------- teknik detaylar */

/** nameTr kuyrugundaki segmentleri 4 dilde etiketlere cevirir. */
export function extractDetails(nameTr: string): { details: L10n[]; unmatched: string[] } {
  const tail = nameTr.split(/[–—]/).slice(1).join(" ");
  if (!tail.trim()) return { details: [], unmatched: [] };

  const details: L10n[] = [];
  const unmatched: string[] = [];
  const seen = new Set<string>();

  for (const seg of tail.split(",").map((s) => s.trim()).filter(Boolean)) {
    const key = fold(seg).replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);
    const hit = DETAIL_LEXICON[key];
    if (hit) {
      details.push(hit);
      continue;
    }
    // cok kelimeli segment: bilinen alt parcalari yakala
    let matchedAny = false;
    for (const [k, v] of Object.entries(DETAIL_LEXICON)) {
      if (k.length > 4 && key.includes(k) && !details.includes(v)) {
        details.push(v);
        matchedAny = true;
      }
    }
    if (!matchedAny) unmatched.push(seg);
  }

  return { details, unmatched };
}

/* ------------------------------------------------------------- kumas */

/** fabricHint + fabricTag -> 4 dilde kumas tanimi. */
export function buildFabric(
  fabricHint: string | null,
  fabricTag: string | null,
): L10n | null {
  const pieces: L10n[] = [];
  const push = (key: string) => {
    const hit = DETAIL_LEXICON[fold(key).replace(/\s+/g, " ")];
    if (hit && !pieces.includes(hit)) pieces.push(hit);
  };
  if (fabricHint) push(fabricHint);
  if (fabricTag) push(fabricTag);

  if (pieces.length === 0) {
    // sozlukte yoksa ham metni her dilde ayni birak (panelde duzeltilir)
    const raw = [fabricHint, fabricTag].filter(Boolean).join(", ");
    if (!raw) return null;
    return { en: raw, tr: raw, de: raw, ar: raw };
  }

  const out = emptyL10n();
  for (const locale of LOCALES) out[locale] = pieces.map((p) => p[locale]).join(", ");
  return out;
}
