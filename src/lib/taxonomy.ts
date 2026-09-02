// OTOMATİK ÜRETİLDİ — scripts/lib/lexicon.ts kaynak alınarak.
// Yeniden üretmek için: npx tsx scripts/gen-taxonomy.ts
//
// Katalog filtrelerinde gösterilen etiketler. Filtrenin URL'e yazdığı DEĞER
// veritabanındaki kanonik İngilizce metindir; kullanıcıya gösterilen ETİKET
// buradan gelir. İkisini karıştırmayın — değer değişirse filtre bozulur.

import type { AppLocale } from "./locales";

export type TaxonomyLabel = Record<AppLocale, string>;

export const SECTION_LABELS: Record<string, TaxonomyLabel> = {
  "Women": {
    "en": "Women",
    "tr": "Kadın",
    "de": "Damen",
    "ar": "نسائي"
  },
  "Men": {
    "en": "Men",
    "tr": "Erkek",
    "de": "Herren",
    "ar": "رجالي"
  },
  "Unisex": {
    "en": "Unisex",
    "tr": "Unisex",
    "de": "Unisex",
    "ar": "للجنسين"
  },
  "Kids": {
    "en": "Kids",
    "tr": "Çocuk",
    "de": "Kinder",
    "ar": "أطفال"
  }
};

export const KIDS_GENDER_LABELS: Record<string, TaxonomyLabel> = {
  "girl": {
    "en": "Girls",
    "tr": "Kız Çocuk",
    "de": "Mädchen",
    "ar": "بناتي"
  },
  "boy": {
    "en": "Boys",
    "tr": "Erkek Çocuk",
    "de": "Jungen",
    "ar": "ولادي"
  }
};

export const SUBCATEGORY_LABELS: Record<string, TaxonomyLabel> = {
  "Printed": {
    "en": "Printed",
    "tr": "Baskılı",
    "de": "Bedruckt",
    "ar": "مطبوع"
  },
  "Oversize": {
    "en": "Oversize",
    "tr": "Oversize",
    "de": "Oversize",
    "ar": "أوفرسايز"
  },
  "Hoodie": {
    "en": "Hooded",
    "tr": "Kapüşonlu",
    "de": "Kapuzen",
    "ar": "بقبعة"
  },
  "Zip": {
    "en": "Zip-Up",
    "tr": "Fermuarlı",
    "de": "Zip",
    "ar": "بسحاب"
  },
  "Crop": {
    "en": "Crop",
    "tr": "Crop",
    "de": "Crop",
    "ar": "كروب"
  },
  "Polo": {
    "en": "Polo",
    "tr": "Polo Yaka",
    "de": "Polo",
    "ar": "بولو"
  },
  "Knit": {
    "en": "Knit",
    "tr": "Triko",
    "de": "Strick",
    "ar": "تريكو"
  },
  "Basic": {
    "en": "Basic",
    "tr": "Basic",
    "de": "Basic",
    "ar": "أساسي"
  },
  "Slim": {
    "en": "Slim Fit",
    "tr": "Dar Kesim",
    "de": "Slim Fit",
    "ar": "ضيق"
  },
  "Regular": {
    "en": "Regular Fit",
    "tr": "Rahat Kalıp",
    "de": "Regular Fit",
    "ar": "عادي"
  }
};

export const COLOR_LABELS: Record<string, TaxonomyLabel> = {
  "Black": {
    "en": "Black",
    "tr": "Siyah",
    "de": "Schwarz",
    "ar": "أسود"
  },
  "White": {
    "en": "White",
    "tr": "Beyaz",
    "de": "Weiß",
    "ar": "أبيض"
  },
  "Off White": {
    "en": "Off White",
    "tr": "Kırık Beyaz",
    "de": "Off White",
    "ar": "أبيض مكسور"
  },
  "Ecru": {
    "en": "Ecru",
    "tr": "Ekru",
    "de": "Ecru",
    "ar": "إيكرو"
  },
  "Beige": {
    "en": "Beige",
    "tr": "Bej",
    "de": "Beige",
    "ar": "بيج"
  },
  "Cream": {
    "en": "Cream",
    "tr": "Krem",
    "de": "Creme",
    "ar": "كريمي"
  },
  "Bone": {
    "en": "Bone",
    "tr": "Kemik",
    "de": "Knochenweiß",
    "ar": "عاجي"
  },
  "Gray": {
    "en": "Gray",
    "tr": "Gri",
    "de": "Grau",
    "ar": "رمادي"
  },
  "Light Gray": {
    "en": "Light Gray",
    "tr": "Açık Gri",
    "de": "Hellgrau",
    "ar": "رمادي فاتح"
  },
  "Gray Melange": {
    "en": "Gray Melange",
    "tr": "Gri Melanj",
    "de": "Grau Meliert",
    "ar": "رمادي ميلانج"
  },
  "Melange": {
    "en": "Melange",
    "tr": "Melanj",
    "de": "Meliert",
    "ar": "ميلانج"
  },
  "Snow Melange": {
    "en": "Snow Melange",
    "tr": "Kar Melanj",
    "de": "Schnee Meliert",
    "ar": "ميلانج ثلجي"
  },
  "Anthracite": {
    "en": "Anthracite",
    "tr": "Antrasit",
    "de": "Anthrazit",
    "ar": "فحمي"
  },
  "Smoke Gray": {
    "en": "Smoke Gray",
    "tr": "Füme",
    "de": "Rauchgrau",
    "ar": "رمادي دخاني"
  },
  "Smoke Melange": {
    "en": "Smoke Melange",
    "tr": "Füme Melanj",
    "de": "Rauch Meliert",
    "ar": "دخاني ميلانج"
  },
  "Navy": {
    "en": "Navy",
    "tr": "Lacivert",
    "de": "Marineblau",
    "ar": "كحلي"
  },
  "Marine": {
    "en": "Marine",
    "tr": "Marine",
    "de": "Marine",
    "ar": "بحري"
  },
  "Blue": {
    "en": "Blue",
    "tr": "Mavi",
    "de": "Blau",
    "ar": "أزرق"
  },
  "Light Blue": {
    "en": "Light Blue",
    "tr": "Açık Mavi",
    "de": "Hellblau",
    "ar": "أزرق فاتح"
  },
  "Dark Blue": {
    "en": "Dark Blue",
    "tr": "Koyu Mavi",
    "de": "Dunkelblau",
    "ar": "أزرق داكن"
  },
  "Baby Blue": {
    "en": "Baby Blue",
    "tr": "Bebe Mavi",
    "de": "Babyblau",
    "ar": "أزرق طفولي"
  },
  "Indigo": {
    "en": "Indigo",
    "tr": "İndigo",
    "de": "Indigo",
    "ar": "نيلي"
  },
  "Saxe Blue": {
    "en": "Saxe Blue",
    "tr": "Saks",
    "de": "Sachsenblau",
    "ar": "أزرق ساكس"
  },
  "Petrol": {
    "en": "Petrol",
    "tr": "Petrol",
    "de": "Petrol",
    "ar": "بترولي"
  },
  "Petrol Green": {
    "en": "Petrol Green",
    "tr": "Petrol Yeşili",
    "de": "Petrolgrün",
    "ar": "أخضر بترولي"
  },
  "Red": {
    "en": "Red",
    "tr": "Kırmızı",
    "de": "Rot",
    "ar": "أحمر"
  },
  "Burgundy": {
    "en": "Burgundy",
    "tr": "Bordo",
    "de": "Bordeaux",
    "ar": "نبيتي"
  },
  "Pink": {
    "en": "Pink",
    "tr": "Pembe",
    "de": "Rosa",
    "ar": "وردي"
  },
  "Light Pink": {
    "en": "Light Pink",
    "tr": "Açık Pembe",
    "de": "Hellrosa",
    "ar": "وردي فاتح"
  },
  "Powder Pink": {
    "en": "Powder Pink",
    "tr": "Pudra",
    "de": "Puderrosa",
    "ar": "وردي باهت"
  },
  "Rose": {
    "en": "Rose",
    "tr": "Gül Kurusu",
    "de": "Altrosa",
    "ar": "وردي عتيق"
  },
  "Salmon": {
    "en": "Salmon",
    "tr": "Somon",
    "de": "Lachs",
    "ar": "سلموني"
  },
  "Cantaloupe": {
    "en": "Cantaloupe",
    "tr": "Kavun İçi",
    "de": "Melone",
    "ar": "شمّامي"
  },
  "Green": {
    "en": "Green",
    "tr": "Yeşil",
    "de": "Grün",
    "ar": "أخضر"
  },
  "Bottle Green": {
    "en": "Bottle Green",
    "tr": "Nefti Yeşil",
    "de": "Flaschengrün",
    "ar": "أخضر داكن"
  },
  "Khaki": {
    "en": "Khaki",
    "tr": "Haki",
    "de": "Khaki",
    "ar": "كاكي"
  },
  "Benetton Green": {
    "en": "Benetton Green",
    "tr": "Benetton",
    "de": "Benettongrün",
    "ar": "أخضر بينيتون"
  },
  "Yellow": {
    "en": "Yellow",
    "tr": "Sarı",
    "de": "Gelb",
    "ar": "أصفر"
  },
  "Light Yellow": {
    "en": "Light Yellow",
    "tr": "Açık Sarı",
    "de": "Hellgelb",
    "ar": "أصفر فاتح"
  },
  "Orange": {
    "en": "Orange",
    "tr": "Turuncu",
    "de": "Orange",
    "ar": "برتقالي"
  },
  "Purple": {
    "en": "Purple",
    "tr": "Mor",
    "de": "Lila",
    "ar": "بنفسجي"
  },
  "Brown": {
    "en": "Brown",
    "tr": "Kahve",
    "de": "Braun",
    "ar": "بني"
  },
  "Tan": {
    "en": "Tan",
    "tr": "Taba",
    "de": "Cognac",
    "ar": "تان"
  },
  "Cinnamon": {
    "en": "Cinnamon",
    "tr": "Tarçın",
    "de": "Zimt",
    "ar": "قرفة"
  },
  "Mink": {
    "en": "Mink",
    "tr": "Vizon",
    "de": "Nerz",
    "ar": "منك"
  },
  "Stone": {
    "en": "Stone",
    "tr": "Taş",
    "de": "Stein",
    "ar": "حجري"
  },
  "Multicolour": {
    "en": "Multicolour",
    "tr": "Çok Renkli",
    "de": "Mehrfarbig",
    "ar": "متعدد الألوان"
  }
};

/** Etiketi çevir; sözlükte yoksa ham değeri döndür (filtre yine çalışır). */
export function label(
  map: Record<string, TaxonomyLabel>,
  value: string,
  locale: AppLocale,
): string {
  return map[value]?.[locale] ?? value;
}

/** "Black / White" gibi birleşik renk adlarını parça parça çevirir. */
export function colorLabel(value: string, locale: AppLocale): string {
  return value
    .split(" / ")
    .map((part) => COLOR_LABELS[part]?.[locale] ?? part)
    .join(" / ");
}
