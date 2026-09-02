/**
 * TR -> EN/DE/AR sozlukleri.
 *
 * Kaynak veri Turkce pazaryeri basliklarindan geliyor. Urun adlari serbest metin
 * olarak cevrilmiyor; yapisal alanlardan (bolum + kalip + motif + baski turu +
 * kategori) yeniden kuruluyor. Bu dosya o kurulusun sozlugudur.
 *
 * Brief SS6.2 / SS13.
 */

export const LOCALES = ["en", "tr", "de", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export type L10n = Record<Locale, string>;

/* ------------------------------------------------------------------ bolum */

export const SECTIONS: Record<string, L10n> = {
  Women: { en: "Women", tr: "Kadın", de: "Damen", ar: "نسائي" },
  Men: { en: "Men", tr: "Erkek", de: "Herren", ar: "رجالي" },
  Unisex: { en: "Unisex", tr: "Unisex", de: "Unisex", ar: "للجنسين" },
  Kids: { en: "Kids", tr: "Çocuk", de: "Kinder", ar: "أطفال" },
};

export const KIDS_GENDER: Record<string, L10n> = {
  girl: { en: "Girls", tr: "Kız Çocuk", de: "Mädchen", ar: "بناتي" },
  boy: { en: "Boys", tr: "Erkek Çocuk", de: "Jungen", ar: "ولادي" },
};

/* --------------------------------------------------------------- kategori */

/** Kategori adi (cogul) - brief SS6.2/10 tablosu birebir. */
export const CATEGORY_NAMES: Record<string, L10n> = {
  tshirts: { en: "T-Shirts", tr: "Tişört", de: "T-Shirts", ar: "تي شيرت" },
  sweatshirts: { en: "Sweatshirts", tr: "Sweatshirt", de: "Sweatshirts", ar: "سويت شيرت" },
  "polo-shirts": { en: "Polo Shirts", tr: "Polo Yaka", de: "Poloshirts", ar: "بولو" },
  tracksuits: { en: "Tracksuits", tr: "Eşofman Takımı", de: "Trainingsanzüge", ar: "بدلة رياضية" },
  sweatpants: { en: "Sweatpants", tr: "Eşofman Altı", de: "Jogginghosen", ar: "بنطال رياضي" },
  "co-ord-sets": { en: "Co-ord Sets", tr: "Alt-Üst Takım", de: "Sets", ar: "طقم" },
  shorts: { en: "Shorts", tr: "Şort", de: "Shorts", ar: "شورت" },
  blouses: { en: "Blouses", tr: "Bluz", de: "Blusen", ar: "بلوزة" },
  dresses: { en: "Dresses", tr: "Elbise", de: "Kleider", ar: "فستان" },
  skirts: { en: "Skirts", tr: "Etek", de: "Röcke", ar: "تنورة" },
  trousers: { en: "Trousers", tr: "Pantolon", de: "Hosen", ar: "بنطال" },
  bodysuits: { en: "Bodysuits", tr: "Body", de: "Bodys", ar: "بادي" },
  shirts: { en: "Shirts", tr: "Gömlek", de: "Hemden", ar: "قميص" },
  jackets: { en: "Jackets", tr: "Ceket & Mont", de: "Jacken", ar: "جاكيت" },
  knitwear: { en: "Knitwear", tr: "Triko", de: "Strickwaren", ar: "تريكو" },
  leggings: { en: "Leggings", tr: "Tayt", de: "Leggings", ar: "ليقنز" },
};

/** Urun adinda kullanilan tekil bicim. */
export const CATEGORY_SINGULAR: Record<string, L10n> = {
  tshirts: { en: "T-Shirt", tr: "Tişört", de: "T-Shirt", ar: "تي شيرت" },
  sweatshirts: { en: "Sweatshirt", tr: "Sweatshirt", de: "Sweatshirt", ar: "سويت شيرت" },
  "polo-shirts": { en: "Polo Shirt", tr: "Polo Yaka Tişört", de: "Poloshirt", ar: "قميص بولو" },
  tracksuits: { en: "Tracksuit", tr: "Eşofman Takımı", de: "Trainingsanzug", ar: "بدلة رياضية" },
  sweatpants: { en: "Sweatpants", tr: "Eşofman Altı", de: "Jogginghose", ar: "بنطال رياضي" },
  "co-ord-sets": { en: "Co-ord Set", tr: "Alt-Üst Takım", de: "Set", ar: "طقم" },
  shorts: { en: "Shorts", tr: "Şort", de: "Shorts", ar: "شورت" },
  blouses: { en: "Blouse", tr: "Bluz", de: "Bluse", ar: "بلوزة" },
  dresses: { en: "Dress", tr: "Elbise", de: "Kleid", ar: "فستان" },
  skirts: { en: "Skirt", tr: "Etek", de: "Rock", ar: "تنورة" },
  trousers: { en: "Trousers", tr: "Pantolon", de: "Hose", ar: "بنطال" },
  bodysuits: { en: "Bodysuit", tr: "Body", de: "Body", ar: "بادي" },
  shirts: { en: "Shirt", tr: "Gömlek", de: "Hemd", ar: "قميص" },
  jackets: { en: "Jacket", tr: "Ceket", de: "Jacke", ar: "جاكيت" },
  knitwear: { en: "Knit Top", tr: "Triko", de: "Strickoberteil", ar: "تريكو" },
  leggings: { en: "Leggings", tr: "Tayt", de: "Leggings", ar: "ليقنز" },
};

/* ------------------------------------------------------------------ kalip */

export const FITS: Record<string, L10n> = {
  Oversize: { en: "Oversize", tr: "Oversize", de: "Oversize", ar: "أوفرسايز" },
  Hoodie: { en: "Hooded", tr: "Kapüşonlu", de: "Kapuzen", ar: "بقبعة" },
  Zip: { en: "Zip-Up", tr: "Fermuarlı", de: "Zip", ar: "بسحاب" },
  Crop: { en: "Crop", tr: "Crop", de: "Crop", ar: "كروب" },
  Polo: { en: "Polo", tr: "Polo Yaka", de: "Polo", ar: "بولو" },
  Knit: { en: "Knit", tr: "Triko", de: "Strick", ar: "تريكو" },
  Basic: { en: "Basic", tr: "Basic", de: "Basic", ar: "أساسي" },
  Slim: { en: "Slim Fit", tr: "Dar Kesim", de: "Slim Fit", ar: "ضيق" },
  Regular: { en: "Regular Fit", tr: "Rahat Kalıp", de: "Regular Fit", ar: "عادي" },
};

/* ------------------------------------------------------------- baski turu */

export const PRINT_KINDS: Record<string, L10n> = {
  print: { en: "Print", tr: "Baskılı", de: "Print", ar: "مطبوع" },
  text: { en: "Text Print", tr: "Yazı Baskılı", de: "Schriftzug-Print", ar: "طباعة كتابية" },
  pattern: { en: "Patterned", tr: "Desenli", de: "Gemustert", ar: "منقوش" },
  embroidery: { en: "Embroidered", tr: "Nakışlı", de: "Bestickt", ar: "مطرز" },
  print3d: { en: "3D Print", tr: "3D Baskılı", de: "3D-Print", ar: "طباعة ثلاثية الأبعاد" },
  plain: { en: "", tr: "", de: "", ar: "" },
};

/* ------------------------------------------------------------------- renk */

export type ColorDef = { en: string; tr: string; de: string; ar: string; hex: string };

/** Kanonik renkler. Anahtar = Turkce yazimin aksansiz/kucuk hali. */
export const COLORS: Record<string, ColorDef> = {
  siyah: { en: "Black", tr: "Siyah", de: "Schwarz", ar: "أسود", hex: "#111111" },
  beyaz: { en: "White", tr: "Beyaz", de: "Weiß", ar: "أبيض", hex: "#F6F4EE" },
  "kirik beyaz": { en: "Off White", tr: "Kırık Beyaz", de: "Off White", ar: "أبيض مكسور", hex: "#EDE8DC" },
  ekru: { en: "Ecru", tr: "Ekru", de: "Ecru", ar: "إيكرو", hex: "#D6C7A8" },
  bej: { en: "Beige", tr: "Bej", de: "Beige", ar: "بيج", hex: "#CDB89A" },
  krem: { en: "Cream", tr: "Krem", de: "Creme", ar: "كريمي", hex: "#EFE6D0" },
  kemik: { en: "Bone", tr: "Kemik", de: "Knochenweiß", ar: "عاجي", hex: "#E3DCCB" },
  gri: { en: "Gray", tr: "Gri", de: "Grau", ar: "رمادي", hex: "#8A8A8A" },
  "acik gri": { en: "Light Gray", tr: "Açık Gri", de: "Hellgrau", ar: "رمادي فاتح", hex: "#BCBCBC" },
  "gri melanj": { en: "Gray Melange", tr: "Gri Melanj", de: "Grau Meliert", ar: "رمادي ميلانج", hex: "#A9A9A9" },
  melanj: { en: "Melange", tr: "Melanj", de: "Meliert", ar: "ميلانج", hex: "#A9A9A9" },
  "kar melanj": { en: "Snow Melange", tr: "Kar Melanj", de: "Schnee Meliert", ar: "ميلانج ثلجي", hex: "#D8D8D8" },
  antrasit: { en: "Anthracite", tr: "Antrasit", de: "Anthrazit", ar: "فحمي", hex: "#3A3A3A" },
  fume: { en: "Smoke Gray", tr: "Füme", de: "Rauchgrau", ar: "رمادي دخاني", hex: "#5A5651" },
  "fume melanj": { en: "Smoke Melange", tr: "Füme Melanj", de: "Rauch Meliert", ar: "دخاني ميلانج", hex: "#6C6862" },
  lacivert: { en: "Navy", tr: "Lacivert", de: "Marineblau", ar: "كحلي", hex: "#1B2A4A" },
  laci: { en: "Navy", tr: "Lacivert", de: "Marineblau", ar: "كحلي", hex: "#1B2A4A" },
  marine: { en: "Marine", tr: "Marine", de: "Marine", ar: "بحري", hex: "#1F3350" },
  mavi: { en: "Blue", tr: "Mavi", de: "Blau", ar: "أزرق", hex: "#2D6CB5" },
  "acik mavi": { en: "Light Blue", tr: "Açık Mavi", de: "Hellblau", ar: "أزرق فاتح", hex: "#8FBEE3" },
  "koyu mavi": { en: "Dark Blue", tr: "Koyu Mavi", de: "Dunkelblau", ar: "أزرق داكن", hex: "#1D3F70" },
  "bebe mavi": { en: "Baby Blue", tr: "Bebe Mavi", de: "Babyblau", ar: "أزرق طفولي", hex: "#A8CFE8" },
  indigo: { en: "Indigo", tr: "İndigo", de: "Indigo", ar: "نيلي", hex: "#33456B" },
  saks: { en: "Saxe Blue", tr: "Saks", de: "Sachsenblau", ar: "أزرق ساكس", hex: "#4A7EBB" },
  petrol: { en: "Petrol", tr: "Petrol", de: "Petrol", ar: "بترولي", hex: "#1F4E4E" },
  "petrol yesili": { en: "Petrol Green", tr: "Petrol Yeşili", de: "Petrolgrün", ar: "أخضر بترولي", hex: "#1F5148" },
  kirmizi: { en: "Red", tr: "Kırmızı", de: "Rot", ar: "أحمر", hex: "#C0392B" },
  bordo: { en: "Burgundy", tr: "Bordo", de: "Bordeaux", ar: "نبيتي", hex: "#6E1F2A" },
  pembe: { en: "Pink", tr: "Pembe", de: "Rosa", ar: "وردي", hex: "#E8A0B4" },
  "acik pembe": { en: "Light Pink", tr: "Açık Pembe", de: "Hellrosa", ar: "وردي فاتح", hex: "#F2C4D2" },
  pudra: { en: "Powder Pink", tr: "Pudra", de: "Puderrosa", ar: "وردي باهت", hex: "#EFD3D0" },
  "gul kurusu": { en: "Rose", tr: "Gül Kurusu", de: "Altrosa", ar: "وردي عتيق", hex: "#C08A8A" },
  somon: { en: "Salmon", tr: "Somon", de: "Lachs", ar: "سلموني", hex: "#F0A08A" },
  "kavun ici": { en: "Cantaloupe", tr: "Kavun İçi", de: "Melone", ar: "شمّامي", hex: "#F0B08A" },
  yesil: { en: "Green", tr: "Yeşil", de: "Grün", ar: "أخضر", hex: "#3E7C4F" },
  "nefti yesil": { en: "Bottle Green", tr: "Nefti Yeşil", de: "Flaschengrün", ar: "أخضر داكن", hex: "#22402F" },
  haki: { en: "Khaki", tr: "Haki", de: "Khaki", ar: "كاكي", hex: "#6B6B4A" },
  benetton: { en: "Benetton Green", tr: "Benetton", de: "Benettongrün", ar: "أخضر بينيتون", hex: "#2E7D5B" },
  sari: { en: "Yellow", tr: "Sarı", de: "Gelb", ar: "أصفر", hex: "#E3B93E" },
  "acik sari": { en: "Light Yellow", tr: "Açık Sarı", de: "Hellgelb", ar: "أصفر فاتح", hex: "#F0DC9A" },
  turuncu: { en: "Orange", tr: "Turuncu", de: "Orange", ar: "برتقالي", hex: "#D97A32" },
  mor: { en: "Purple", tr: "Mor", de: "Lila", ar: "بنفسجي", hex: "#6B4A8A" },
  kahve: { en: "Brown", tr: "Kahve", de: "Braun", ar: "بني", hex: "#6B4A38" },
  kahverengi: { en: "Brown", tr: "Kahverengi", de: "Braun", ar: "بني", hex: "#6B4A38" },
  taba: { en: "Tan", tr: "Taba", de: "Cognac", ar: "تان", hex: "#8B5E3C" },
  tarcin: { en: "Cinnamon", tr: "Tarçın", de: "Zimt", ar: "قرفة", hex: "#8A5A3B" },
  vizon: { en: "Mink", tr: "Vizon", de: "Nerz", ar: "منك", hex: "#A08B7A" },
  tas: { en: "Stone", tr: "Taş", de: "Stein", ar: "حجري", hex: "#B9AC98" },
  "tas rengi": { en: "Stone", tr: "Taş Rengi", de: "Stein", ar: "حجري", hex: "#B9AC98" },
  "cok renkli": { en: "Multicolour", tr: "Çok Renkli", de: "Mehrfarbig", ar: "متعدد الألوان", hex: "#8A8A8A" },
};

/** Renk adinin sonuna yapismis, renk olmayan kuyruklar. */
export const COLOR_NOISE = new Set([
  "desenli", "puantiyeli", "cizgili", "puzzle", "set", "erkek", "kadin", "boru",
  "e", "k", "t", "p", "b", "1", "2", "3", "4", "kombin", "hediyeli",
]);

/* ---------------------------------------------------- ad kurulumu: motif */

/**
 * Turkce baslikta motif slotundan cikarilinca atilacak kelimeler:
 * bolum, kategori, kalip, baski, kumas, detay ve renk.
 */
export const NAME_STOPWORDS = new Set([
  // bolum
  "kadin", "erkek", "unisex", "cocuk", "kiz", "bay", "bayan",
  // kategori ve es anlamlilari
  "tisort", "tshirt", "t", "shirt", "shirti", "shirtu", "sweatshirt", "sweat",
  "hoodie", "hirka", "bluz", "elbise", "etek", "pantolon", "sort", "esofman",
  "takim", "takimi", "alt", "ust", "body", "gomlek", "ceket", "mont", "triko",
  "tayt", "polo", "sweatpant", "jogger", "kazak", "atlet", "sweatshirti",
  // kalip / kesim
  "oversize", "regular", "slim", "crop", "basic", "bol", "dar", "rahat",
  "kalip", "kalibi", "kesim", "kesimli", "fit", "modern", "salas", "standart",
  // baski
  "baskili", "baski", "yazili", "yazi", "desenli", "desen", "nakisli", "nakis",
  "3d", "temali", "temasi", "stili", "stil", "model", "modeli", "tasarim",
  "tasarimli", "ozel", "kisiye", "harf",
  // kumas / detay
  "pamuk", "pamuklu", "iplik", "sardonlu", "polar", "supreme", "suprem",
  "compact", "kumas", "esnek", "likrali", "modal", "poplin", "keten", "saten",
  "kaskorse", "scuba", "orme", "penye", "yaka", "bisiklet", "kapusonlu",
  "kapuson", "kanguru", "cep", "cepli", "cepi", "cepli", "kollu", "kol",
  "uzun", "kisa", "yarim", "sifir", "fermuarli", "fermuar", "dugmeli",
  "bagcikli", "lastikli", "paca", "bel", "beli", "yuksek", "askili",
  "aksesuarli", "detayli", "sirt", "arka", "on", "gunluk", "yazlik", "kislik",
  "spor", "sik", "kaliteli", "premium", "hediyeli", "hediye", "kombin",
  "beden", "renk", "renkli", "cift", "tek", "ve", "ile", "icin", "adet",
  "li", "lu", "cm", "gr", "gsm",
  // marka / pazaryeri isaretleri
  "the", "champ", "thechamp", "chmp", "wf", "wff", "vol", "studios", "dept",
  "collection", "koleksiyon", "seri", "no", "nolu",
  // olcu ve teknik dolgu ("%100 pamuk" gibi zaten detay slotunda)
  "100", "24", "1", "2", "4", "sor", "boy", "boyu", "tam", "orta", "duz",
  // renkler ad slotunda tekrar etmesin
  "siyah", "beyaz", "gri", "bej", "krem", "ekru", "kirik", "lacivert", "laci",
  "mavi", "kirmizi", "bordo", "pembe", "pudra", "yesil", "haki", "sari",
  "turuncu", "mor", "kahve", "kahverengi", "vizon", "melanj", "tas", "somon",
  "fume", "antrasit", "indigo", "marine", "saks", "petrol", "taba", "tarcin",
  "kemik", "acik", "koyu", "bebe", "nefti", "benetton", "kavun", "ici", "cok",
]);

/** Turkce motif kelimelerinin EN/DE/AR karsiliklari. */
export const MOTIF_LEXICON: Record<string, L10n> = {
  satranc: { en: "Chess", tr: "Satranç", de: "Schach", ar: "شطرنج" },
  ayicik: { en: "Teddy", tr: "Ayıcık", de: "Teddy", ar: "دبدوب" },
  ayi: { en: "Bear", tr: "Ayı", de: "Bär", ar: "دب" },
  kiraz: { en: "Cherry", tr: "Kiraz", de: "Kirsche", ar: "كرز" },
  cicek: { en: "Flower", tr: "Çiçek", de: "Blume", ar: "زهرة" },
  cicekli: { en: "Floral", tr: "Çiçekli", de: "Blumen", ar: "زهور" },
  kalp: { en: "Heart", tr: "Kalp", de: "Herz", ar: "قلب" },
  leopar: { en: "Leopard", tr: "Leopar", de: "Leopard", ar: "فهد" },
  futbol: { en: "Football", tr: "Futbol", de: "Fußball", ar: "كرة قدم" },
  basketbol: { en: "Basketball", tr: "Basketbol", de: "Basketball", ar: "كرة سلة" },
  kolej: { en: "College", tr: "Kolej", de: "College", ar: "كوليج" },
  sokak: { en: "Street", tr: "Sokak", de: "Street", ar: "ستريت" },
  gunes: { en: "Sun", tr: "Güneş", de: "Sonne", ar: "شمس" },
  limon: { en: "Lemon", tr: "Limon", de: "Zitrone", ar: "ليمون" },
  meyve: { en: "Fruit", tr: "Meyve", de: "Frucht", ar: "فاكهة" },
  hibiskus: { en: "Hibiscus", tr: "Hibiskus", de: "Hibiskus", ar: "الكركديه" },
  kurdele: { en: "Ribbon", tr: "Kurdele", de: "Schleife", ar: "شريطة" },
  kelebek: { en: "Butterfly", tr: "Kelebek", de: "Schmetterling", ar: "فراشة" },
  yildiz: { en: "Star", tr: "Yıldız", de: "Stern", ar: "نجمة" },
  kus: { en: "Bird", tr: "Kuş", de: "Vogel", ar: "طائر" },
  kedi: { en: "Cat", tr: "Kedi", de: "Katze", ar: "قطة" },
  kopek: { en: "Dog", tr: "Köpek", de: "Hund", ar: "كلب" },
  tavsan: { en: "Rabbit", tr: "Tavşan", de: "Hase", ar: "أرنب" },
  dinozor: { en: "Dinosaur", tr: "Dinozor", de: "Dinosaurier", ar: "ديناصور" },
  araba: { en: "Car", tr: "Araba", de: "Auto", ar: "سيارة" },
  gitar: { en: "Guitar", tr: "Gitar", de: "Gitarre", ar: "جيتار" },
  muzik: { en: "Music", tr: "Müzik", de: "Musik", ar: "موسيقى" },
  deniz: { en: "Sea", tr: "Deniz", de: "Meer", ar: "بحر" },
  dalga: { en: "Wave", tr: "Dalga", de: "Welle", ar: "موجة" },
  palmiye: { en: "Palm", tr: "Palmiye", de: "Palme", ar: "نخلة" },
  dag: { en: "Mountain", tr: "Dağ", de: "Berg", ar: "جبل" },
  kaplan: { en: "Tiger", tr: "Kaplan", de: "Tiger", ar: "نمر" },
  aslan: { en: "Lion", tr: "Aslan", de: "Löwe", ar: "أسد" },
  kurt: { en: "Wolf", tr: "Kurt", de: "Wolf", ar: "ذئب" },
  balik: { en: "Fish", tr: "Balık", de: "Fisch", ar: "سمكة" },
  gozluk: { en: "Glasses", tr: "Gözlük", de: "Brille", ar: "نظارة" },
  vintage: { en: "Vintage", tr: "Vintage", de: "Vintage", ar: "فينتج" },
  retro: { en: "Retro", tr: "Retro", de: "Retro", ar: "ريترو" },
  western: { en: "Western", tr: "Western", de: "Western", ar: "ويسترن" },
  minimal: { en: "Minimal", tr: "Minimal", de: "Minimal", ar: "مينيمال" },
  puantiyeli: { en: "Polka Dot", tr: "Puantiyeli", de: "Gepunktet", ar: "منقّط" },
  cizgili: { en: "Striped", tr: "Çizgili", de: "Gestreift", ar: "مخطط" },
  ekose: { en: "Checked", tr: "Ekose", de: "Kariert", ar: "كاروهات" },
  balon: { en: "Balloon", tr: "Balon", de: "Ballon", ar: "بالون" },
  mini: { en: "Mini", tr: "Mini", de: "Mini", ar: "ميني" },
  midi: { en: "Midi", tr: "Midi", de: "Midi", ar: "ميدي" },
  maxi: { en: "Maxi", tr: "Maxi", de: "Maxi", ar: "ماكسي" },
  sal: { en: "Shawl", tr: "Şal", de: "Schal", ar: "شال" },
  canta: { en: "Bag", tr: "Çanta", de: "Tasche", ar: "حقيبة" },
  bez: { en: "Canvas", tr: "Bez", de: "Stoff", ar: "قماش" },
  kare: { en: "Square", tr: "Kare", de: "Quadrat", ar: "مربع" },
  couple: { en: "Couple", tr: "Sevgili", de: "Pärchen", ar: "ثنائي" },
  sevgili: { en: "Couple", tr: "Sevgili", de: "Pärchen", ar: "ثنائي" },
  fitilli: { en: "Ribbed", tr: "Fitilli", de: "Gerippt", ar: "مضلع" },
  dokulu: { en: "Textured", tr: "Dokulu", de: "Strukturiert", ar: "منسوج" },
  dokumlu: { en: "Draped", tr: "Dökümlü", de: "Fließend", ar: "منسدل" },
  // baski motifleri
  gul: { en: "Rose", tr: "Gül", de: "Rose", ar: "وردة" },
  nar: { en: "Pomegranate", tr: "Nar", de: "Granatapfel", ar: "رمان" },
  yaprak: { en: "Leaf", tr: "Yaprak", de: "Blatt", ar: "ورقة" },
  cicekleri: { en: "Flowers", tr: "Çiçekleri", de: "Blumen", ar: "زهور" },
  lale: { en: "Tulip", tr: "Lale", de: "Tulpe", ar: "توليب" },
  portakal: { en: "Orange", tr: "Portakal", de: "Orange", ar: "برتقال" },
  cilek: { en: "Strawberry", tr: "Çilek", de: "Erdbeere", ar: "فراولة" },
  limonata: { en: "Lemonade", tr: "Limonata", de: "Limonade", ar: "ليموناضة" },
  biber: { en: "Pepper", tr: "Biber", de: "Paprika", ar: "فلفل" },
  narenciye: { en: "Citrus", tr: "Narenciye", de: "Zitrus", ar: "حمضيات" },
  cay: { en: "Tea", tr: "Çay", de: "Tee", ar: "شاي" },
  kahvesi: { en: "Coffee", tr: "Kahve", de: "Kaffee", ar: "قهوة" },
  dondurma: { en: "Ice Cream", tr: "Dondurma", de: "Eiscreme", ar: "آيس كريم" },
  makarna: { en: "Pasta", tr: "Makarna", de: "Pasta", ar: "معكرونة" },
  kalpli: { en: "Heart", tr: "Kalpli", de: "Herz", ar: "قلب" },
  kurdeleli: { en: "Ribbon", tr: "Kurdeleli", de: "Schleife", ar: "شريطة" },
  fiyonk: { en: "Bow", tr: "Fiyonk", de: "Schleife", ar: "فيونكة" },
  nazar: { en: "Evil Eye", tr: "Nazar", de: "Nazar", ar: "عين الحسد" },
  boncuk: { en: "Bead", tr: "Boncuk", de: "Perle", ar: "خرزة" },
  boncugu: { en: "Evil Eye", tr: "Nazar Boncuğu", de: "Nazar-Auge", ar: "عين الحسد" },
  denizci: { en: "Sailor", tr: "Denizci", de: "Maritim", ar: "بحّار" },
  kaykay: { en: "Skate", tr: "Kaykay", de: "Skate", ar: "تزلج" },
  ordek: { en: "Duck", tr: "Ördek", de: "Ente", ar: "بطة" },
  prenses: { en: "Princess", tr: "Prenses", de: "Prinzessin", ar: "أميرة" },
  melek: { en: "Angel", tr: "Melek", de: "Engel", ar: "ملاك" },
  zincir: { en: "Chain", tr: "Zincir", de: "Kette", ar: "سلسلة" },
  dantel: { en: "Lace", tr: "Dantel", de: "Spitze", ar: "دانتيل" },
  tul: { en: "Tulle", tr: "Tül", de: "Tüll", ar: "تول" },
  kemer: { en: "Belt", tr: "Kemer", de: "Gürtel", ar: "حزام" },
  yaz: { en: "Summer", tr: "Yaz", de: "Sommer", ar: "صيف" },
  sanat: { en: "Art", tr: "Sanat", de: "Kunst", ar: "فن" },
  sanatsal: { en: "Artistic", tr: "Sanatsal", de: "Künstlerisch", ar: "فني" },
  heykel: { en: "Sculpture", tr: "Heykel", de: "Skulptur", ar: "منحوتة" },
  etnik: { en: "Ethnic", tr: "Etnik", de: "Ethno", ar: "إثني" },
  tropik: { en: "Tropical", tr: "Tropik", de: "Tropisch", ar: "استوائي" },
  tropikal: { en: "Tropical", tr: "Tropikal", de: "Tropisch", ar: "استوائي" },
  mercan: { en: "Coral", tr: "Mercan", de: "Koralle", ar: "مرجان" },
  yildizi: { en: "Star", tr: "Yıldızı", de: "Stern", ar: "نجمة" },
  harita: { en: "Map", tr: "Harita", de: "Karte", ar: "خريطة" },
  karakter: { en: "Character", tr: "Karakter", de: "Charakter", ar: "شخصية" },
  grafik: { en: "Graphic", tr: "Grafik", de: "Grafik", ar: "غرافيك" },
  karikatur: { en: "Cartoon", tr: "Karikatür", de: "Cartoon", ar: "كاريكاتير" },
  iskelet: { en: "Skeleton", tr: "İskelet", de: "Skelett", ar: "هيكل عظمي" },
  gozluklu: { en: "Glasses", tr: "Gözlüklü", de: "Mit Brille", ar: "بنظارة" },
  sapkali: { en: "Hat", tr: "Şapkalı", de: "Mit Hut", ar: "بقبعة" },
  raket: { en: "Racket", tr: "Raket", de: "Schläger", ar: "مضرب" },
  kadeh: { en: "Glass", tr: "Kadeh", de: "Glas", ar: "كأس" },
  kadehi: { en: "Glass", tr: "Kadehi", de: "Glas", ar: "كأس" },
  kokteyl: { en: "Cocktail", tr: "Kokteyl", de: "Cocktail", ar: "كوكتيل" },
  bayragi: { en: "Flag", tr: "Bayrağı", de: "Flagge", ar: "علم" },
  turkiye: { en: "Türkiye", tr: "Türkiye", de: "Türkiye", ar: "تركيا" },
  turk: { en: "Turkish", tr: "Türk", de: "Türkisch", ar: "تركي" },
  jakar: { en: "Jacquard", tr: "Jakar", de: "Jacquard", ar: "جاكار" },
  kimono: { en: "Kimono", tr: "Kimono", de: "Kimono", ar: "كيمونو" },
  halter: { en: "Halter", tr: "Halter", de: "Neckholder", ar: "هالتر" },
  palazzo: { en: "Palazzo", tr: "Palazzo", de: "Palazzo", ar: "بالازو" },
  bralet: { en: "Bralette", tr: "Bralet", de: "Bralette", ar: "براليت" },
  bomber: { en: "Bomber", tr: "Bomber", de: "Bomber", ar: "بومبر" },
  trench: { en: "Trench", tr: "Trençkot", de: "Trench", ar: "ترنش" },
  bogazli: { en: "Turtleneck", tr: "Boğazlı", de: "Rollkragen", ar: "برقبة عالية" },
  balikci: { en: "Turtleneck", tr: "Balıkçı Yaka", de: "Rollkragen", ar: "برقبة عالية" },
  fularli: { en: "Scarf Detail", tr: "Fularlı", de: "Mit Schal", ar: "بوشاح" },
  asimetrik: { en: "Asymmetric", tr: "Asimetrik", de: "Asymmetrisch", ar: "غير متماثل" },
  kareli: { en: "Checked", tr: "Kareli", de: "Kariert", ar: "كاروهات" },
  yirtmacli: { en: "Slit", tr: "Yırtmaçlı", de: "Mit Schlitz", ar: "بفتحة" },
  volanli: { en: "Ruffle", tr: "Volanlı", de: "Mit Volant", ar: "بكشكش" },
  firfirli: { en: "Frill", tr: "Fırfırlı", de: "Rüschen", ar: "بكشكشة" },
  drapeli: { en: "Draped", tr: "Drapeli", de: "Drapiert", ar: "مدرّج" },
  dekolteli: { en: "Open Back", tr: "Dekolteli", de: "Mit Ausschnitt", ar: "بفتحة" },
  islemeli: { en: "Embroidered", tr: "İşlemeli", de: "Bestickt", ar: "مطرز" },
  logolu: { en: "Logo", tr: "Logolu", de: "Mit Logo", ar: "بشعار" },
  kot: { en: "Denim", tr: "Kot", de: "Denim", ar: "دنيم" },
  dokuma: { en: "Woven", tr: "Dokuma", de: "Webware", ar: "منسوج" },
  tunik: { en: "Tunic", tr: "Tunik", de: "Tunika", ar: "تونيك" },
  sicilya: { en: "Sicily", tr: "Sicilya", de: "Sizilien", ar: "صقلية" },
  batik: { en: "Batik", tr: "Batik", de: "Batik", ar: "باتيك" },
  tatildeyim: { en: "On Holiday", tr: "Tatildeyim", de: "Im Urlaub", ar: "في إجازة" },
  organik: { en: "Organic", tr: "Organik", de: "Bio", ar: "عضوي" },
};

/**
 * Motif slotuna sizan ama urun adinda isi olmayan Turkce dolgu sifatlari.
 * (Turkce morfoloji testinden gecemeyen, saf ASCII olanlar.)
 */
export const MOTIF_FILLER = new Set([
  "yuvarlak", "dikim", "diz", "boru", "nefes", "alan", "kombini", "el", "ustu",
  "giyim", "yapi", "poliamid", "sac", "parca", "hakim", "sile", "bezi",
  "tuyu", "kaz", "naturel", "yandan", "hafif", "elastik", "belli", "panelli",
  "sportif", "konsept", "konseptli", "figur", "imza", "motif", "guncesi",
  "sahasi", "arkasi", "uygun", "geceye", "strec", "parasut", "dik", "kalin",
  "ince", "zarif", "genc", "buyuk", "kucuk", "yeni", "eski", "gunes",
  "sardounlu", "renkbaskili", "streetweart-shirt", "ybisiklet", "skadin",
  "kakadin", "ucretsiz", "degildir", "gorunumlu", "karisik", "karisimli",
  "tasarlanmis", "tasiyan", "ruhunu", "enerjili", "eglenceli", "yumusak",
  "toparlayici", "vucuda", "oturan", "kapamali", "baglamali", "tasli",
  "suslemeli", "bustiyerli", "ustlu", "garnili", "yikamali", "astarli",
  "etiketli", "kordonlu", "bagcik", "kemerli", "buzgu", "buzgulu", "omuz",
  "omuzlari", "alti", "pacasi", "serit", "kordinat", "illustrasyon",
  "yuruyus", "yuruyen", "futbolcu", "aerobin", "imzali", "dolgulu", "konforlu",
  "genis", "sor", "yazli", "yazlik", "bikini", "kombin", "ayarlanabilir",
  "rengi", "kuru", "cin", "ho", "renk", "renkli", "model", "modeli",
]);

/* ------------------------------------------------------- teknik detaylar */

/** nameTr kuyruk segmentleri -> 4 dilde teknik ozellik etiketi. */
export const DETAIL_LEXICON: Record<string, L10n> = {
  "bisiklet yaka": { en: "Crew neck", tr: "Bisiklet yaka", de: "Rundhalsausschnitt", ar: "رقبة دائرية" },
  "v yaka": { en: "V-neck", tr: "V yaka", de: "V-Ausschnitt", ar: "رقبة على شكل V" },
  "kare yaka": { en: "Square neck", tr: "Kare yaka", de: "Karree-Ausschnitt", ar: "رقبة مربعة" },
  "polo yaka": { en: "Polo collar", tr: "Polo yaka", de: "Polokragen", ar: "ياقة بولو" },
  "dik yaka": { en: "Stand collar", tr: "Dik yaka", de: "Stehkragen", ar: "ياقة قائمة" },
  "sal yaka": { en: "Shawl collar", tr: "Şal yaka", de: "Schalkragen", ar: "ياقة شال" },
  "rahat kalip": { en: "Relaxed fit", tr: "Rahat kalıp", de: "Lockere Passform", ar: "قصة مريحة" },
  "rahat kesim": { en: "Relaxed cut", tr: "Rahat kesim", de: "Lockerer Schnitt", ar: "قصة واسعة" },
  "modern kesim": { en: "Modern cut", tr: "Modern kesim", de: "Moderner Schnitt", ar: "قصة عصرية" },
  "modern rahat kesim": { en: "Modern relaxed cut", tr: "Modern rahat kesim", de: "Moderner lockerer Schnitt", ar: "قصة عصرية مريحة" },
  "%100 pamuk": { en: "100% cotton", tr: "%100 pamuk", de: "100 % Baumwolle", ar: "قطن 100%" },
  "%100 pamuk compact suprem 24/1": { en: "100% cotton compact jersey 24/1", tr: "%100 pamuk compact süprem 24/1", de: "100 % Baumwolle Compact-Jersey 24/1", ar: "قطن 100% كومباكت جيرسيه 24/1" },
  "3 iplik": { en: "3-thread fleece", tr: "3 iplik", de: "3-Faden-Sweat", ar: "ثلاثة خيوط" },
  "3 iplik sardonlu": { en: "3-thread brushed fleece", tr: "3 iplik şardonlu", de: "3-Faden angeraut", ar: "ثلاثة خيوط مكشّط" },
  "3 iplik polar": { en: "3-thread fleece-lined", tr: "3 iplik polar", de: "3-Faden Fleece", ar: "ثلاثة خيوط بفليس" },
  "3 iplik sardonlu polar": { en: "3-thread brushed fleece lining", tr: "3 iplik şardonlu polar", de: "3-Faden angeraut, Fleece", ar: "ثلاثة خيوط مكشّط بفليس" },
  "2 iplik": { en: "2-thread jersey", tr: "2 iplik", de: "2-Faden-Sweat", ar: "خيطان" },
  kapusonlu: { en: "Hooded", tr: "Kapüşonlu", de: "Mit Kapuze", ar: "بقبعة" },
  "kanguru cep": { en: "Kangaroo pocket", tr: "Kanguru cep", de: "Känguru-Tasche", ar: "جيب كنغر" },
  "kanguru cepli": { en: "Kangaroo pocket", tr: "Kanguru cepli", de: "Känguru-Tasche", ar: "جيب كنغر" },
  cepli: { en: "With pockets", tr: "Cepli", de: "Mit Taschen", ar: "بجيوب" },
  "esnek kumas": { en: "Stretch fabric", tr: "Esnek kumaş", de: "Elastisches Gewebe", ar: "قماش مرن" },
  likrali: { en: "With elastane", tr: "Likralı", de: "Mit Elasthan", ar: "بالليكرا" },
  "kisa kollu": { en: "Short sleeve", tr: "Kısa kollu", de: "Kurzarm", ar: "كم قصير" },
  "uzun kollu": { en: "Long sleeve", tr: "Uzun kollu", de: "Langarm", ar: "كم طويل" },
  "yarim kollu": { en: "Half sleeve", tr: "Yarım kollu", de: "Halbarm", ar: "نصف كم" },
  "lastikli paca": { en: "Ribbed cuffs", tr: "Lastikli paça", de: "Bündchen am Saum", ar: "أساور مطاطية" },
  "bol paca": { en: "Wide leg", tr: "Bol paça", de: "Weites Bein", ar: "ساق واسعة" },
  "lastikli bel": { en: "Elastic waist", tr: "Lastikli bel", de: "Elastischer Bund", ar: "خصر مطاطي" },
  "yuksek bel": { en: "High waist", tr: "Yüksek bel", de: "High Waist", ar: "خصر عالٍ" },
  "lastikli alt": { en: "Elastic hem", tr: "Lastikli alt", de: "Elastischer Saum", ar: "حاشية مطاطية" },
  fermuarli: { en: "Zip fastening", tr: "Fermuarlı", de: "Mit Reißverschluss", ar: "بسحاب" },
  dugmeli: { en: "Button fastening", tr: "Düğmeli", de: "Mit Knopfleiste", ar: "بأزرار" },
  bagcikli: { en: "Drawcord", tr: "Bağcıklı", de: "Mit Kordelzug", ar: "برباط" },
  aksesuarli: { en: "Trim detail", tr: "Aksesuarlı", de: "Mit Applikation", ar: "بإكسسوار" },
  askili: { en: "Strappy", tr: "Askılı", de: "Mit Trägern", ar: "بحمالات" },
  basic: { en: "Basic", tr: "Basic", de: "Basic", ar: "أساسي" },
  couple: { en: "Couple set", tr: "Sevgili kombini", de: "Pärchen-Set", ar: "طقم ثنائي" },
  oversize: { en: "Oversize", tr: "Oversize", de: "Oversize", ar: "أوفرسايز" },
  penye: { en: "Combed jersey", tr: "Penye", de: "Single Jersey", ar: "جيرسيه ممشّط" },
  kaskorse: { en: "Ribbed jersey", tr: "Kaşkorse", de: "Rippjersey", ar: "قماش ريب" },
  fitilli: { en: "Ribbed", tr: "Fitilli", de: "Gerippt", ar: "مضلع" },
  scuba: { en: "Scuba", tr: "Scuba", de: "Scuba", ar: "سكوبا" },
  keten: { en: "Linen blend", tr: "Keten", de: "Leinen", ar: "كتان" },
  poplin: { en: "Poplin", tr: "Poplin", de: "Popeline", ar: "بوبلين" },
  saten: { en: "Satin", tr: "Saten", de: "Satin", ar: "ساتان" },
  modal: { en: "Modal", tr: "Modal", de: "Modal", ar: "مودال" },
  triko: { en: "Knitted", tr: "Triko", de: "Strick", ar: "تريكو" },
  dokulu: { en: "Textured", tr: "Dokulu", de: "Strukturiert", ar: "منسوج" },
  dokumlu: { en: "Draped", tr: "Dökümlü", de: "Fließend", ar: "منسدل" },
  yazlik: { en: "Summer weight", tr: "Yazlık", de: "Sommerqualität", ar: "صيفي" },
  kislik: { en: "Winter weight", tr: "Kışlık", de: "Winterqualität", ar: "شتوي" },
};
