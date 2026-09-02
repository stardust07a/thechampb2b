# THE CHAMP GLOBAL — B2B Sitesi Yapım Dökümanı

> **Bu döküman Claude Code'a verilecek yapım brief'idir.**
> Yanında iki dosya gelir: `products.source.json` (819 ürün, temizlenmiş) ve
> `THE_CHAMP_fiyat_sablonu.xlsx` (kategori bazlı fiyat/üretim bilgisi).
> Karar verilmiş her şey burada yazılıdır — brief'te yazan bir karara kendi başına
> alternatif üretme, yazmayanı sor.

---

## 0. BAŞLAMADAN ÖNCE — Skill kurulumu (ZORUNLU)

Kod yazmaya başlamadan önce aşağıdaki skill'leri kur. Bu proje "lüks/minimal koyu tema"
iddiasında; bu skill'ler o iddianın teknik karşılığıdır ve **kullanılmaları zorunludur.**

```bash
# 1) Next.js / React omurgası
npx skills add vercel-labs/agent-skills
#    → react-best-practices, web-design-guidelines, composition-patterns, react-view-transitions

# 2) Arayüz kalite denetimi
/plugin marketplace add jakubkrehel/skills
/plugin install interfaces@interfaces
#    → better-colors, better-typography, better-ui, better-layout, better-accessibility,
#      variant, break, interface-review

# 3) Tasarım metodolojisi (RTL / koyu tema / form / arama)
/plugin marketplace add Owl-Listener/designer-skills
/plugin install design-systems@designer-skills      # localization-design (RTL!), theming-system, design-token
/plugin install ui-design@designer-skills           # dark-mode-design, color-system, typography-scale, spacing-system
/plugin install interaction-design@designer-skills  # form-design, search-ux, loading-states, error-handling-ux

# 4) Marka tutarlılığı / "AI slop" karşıtı
/plugin marketplace add codeswithroh/tastemaker
/plugin install tastemaker@codeswithroh

# 5) Etkileşim cilası
npx skills@latest add emilkowalski/skills
#    → emil-design-eng, animate, ask-sonner, pick-ui-library

# 6) UI/UX bilgi tabanı
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
#    → ui-ux-pro-max, design-system, ui-styling

# 7) MengTo koleksiyonu — plugin desteği yok, manuel kopyala
git clone --depth 1 https://github.com/MengTo/Skills /tmp/mengto
mkdir -p .claude/skills
for s in dark-glass-clean-layout framed-tech-dark-border-gradient dither-laser-dark-mode \
         agency-grid-layout-minimal image-first-grid-layout no-ai-design-slop \
         audit-ai-design-slop beautiful-shadows progressive-blur container-lines tailwindcss; do
  cp -r /tmp/mengto/web-design/$s .claude/skills/ 2>/dev/null || \
  cp -r /tmp/mengto/ui/$s .claude/skills/ 2>/dev/null
done

# 8) Opsiyonel — uzun projede bağlam hafızası
npx claude-mem install
```

### Skill'leri hangi aşamada kullan

| Aşama | Kullanılacak skill |
|---|---|
| Tasarım sistemi / token katmanı kurarken | `design-token`, `theming-system`, `color-system`, `dark-mode-design`, `design-system` |
| Tipografi ölçeği ve 4 dil metin davranışı | `better-typography`, `typography-scale`, `localization-design` |
| Arapça RTL | `localization-design` (ZORUNLU — aynalama, metin genişlemesi, yerel formatlar) |
| Ürün grid'i / katalog sayfası | `image-first-grid-layout`, `agency-grid-layout-minimal`, `search-ux` |
| Ana sayfa / banner / koyu atmosfer | `framed-tech-dark-border-gradient`, `dither-laser-dark-mode`, `progressive-blur` |
| Yönetim paneli | `dark-glass-clean-layout`, `form-design`, `loading-states`, `error-handling-ux`, `ui-styling` |
| Teklif sepeti drawer / geçişler | `animate`, `emil-design-eng`, `react-view-transitions` |
| Panel bildirimleri (toast) | `ask-sonner` |
| Next.js performans / Server Components | `react-best-practices` |
| Bileşen varyantları ve state testi | `variant`, `break` |
| Teslim öncesi denetim | `interface-review`, `better-interface`, `audit-ai-design-slop`, `web-design-guidelines`, `accessibility-audit` |

---

## 1. PROJE

**Marka:** THE CHAMP GLOBAL — Türkiye merkezli örme tekstil üreticisi (kuruluş 2021).
**Site:** thechampb2b.com üzerine kurulacak. Mevcut statik katalog tamamen değişecek.
**Amaç:** Uluslararası toptan alıcı, distribütör ve marka sahiplerine ürün kataloğunu,
kademeli toptan fiyatları ve üretim kabiliyetini profesyonel biçimde sunmak; teklif talebi toplamak.
**Erişim:** Site herkese açık, üyelik yok. Fiyatlar herkese açık.
**Giriş noktası:** Kartvizit/broşür QR kodu → ana sayfa. İlk ekranda marka mesajı + MOQ + iki CTA görünmeli.

**Hedef:** 3 gün içinde tam çalışır halde yayında.

---

## 2. TEKNİK STACK VE DEPLOYMENT

```
Next.js 15 (App Router, Server Components, TypeScript)
Tailwind CSS + shadcn/ui (Radix)
PostgreSQL + Prisma
next-intl (EN/TR/DE/AR, alt yol tabanlı: /en /tr /de /ar)
Auth: Auth.js (credentials) — sadece admin, tek rol
Görsel: next/image + kendi CDN'imiz (aşağıda)
E-posta: Resend (teklif bildirimleri)
PDF: @react-pdf/renderer veya Playwright print-to-PDF
```

### Deployment — KARAR: Vercel + Neon Postgres

- **Uygulama:** Vercel (Hobby katmanı bu ölçek için yeterli)
- **Veritabanı:** Neon Postgres (ücretsiz katman)
- **Görseller:** Vercel Blob + `next/image` (otomatik boyutlandırma, WebP/AVIF, global CDN)
- **Domain:** `thechampb2b.com` Hostinger'da kalır. Hostinger hPanel → DNS bölümünden
  Vercel'in verdiği A / CNAME kayıtları girilir. Kurumsal e-posta Hostinger'da kalmaya devam eder.
- **Ortam değişkenleri:** `DATABASE_URL`, `AUTH_SECRET`, `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`,
  `NEXT_PUBLIC_SITE_URL`

Bu tercihin sebebi: projenin en ağır tarafı **12.500 görsel**. Vercel'de görsel optimizasyonu ve
CDN hazır gelir, sayfalar ISR ile önbelleğe alınır. Aynı sonucu başka bir yerde elde etmek için
sharp pipeline'ı, CDN ve önbellek katmanını elle kurmak gerekir.

### Hostinger hakkında (bilgi — uygulanmayacak)

Kullanıcının Hostinger Premium paketi var, Sınırsız pakete yükseltme seçeneği mevcut.
Doğrulanmış durum:

- Hostinger'ın **Sınırsız** ve **Cloud Startup** paketlerinde Node.js desteği **var**
  (Single ve Premium'da yok).
- Paylaşımlı paketlerin hiçbirinde **PostgreSQL yok**, sadece MySQL var. Hostinger'ın kendi
  dökümanı Postgres için harici servise (Supabase/Neon) bağlanmayı öneriyor.
- Sınırsız pakette 50 GB NVMe ve CDN dahil.

Yani teknik olarak mümkün ama tercih edilmedi: Next.js'in görsel optimizasyonu ve ISR altyapısı
orada hazır gelmiyor, build bellek limitleri riskli ve 3 günlük takvimde bu riskin karşılığı yok.
**Hostinger sadece domain ve e-posta için kullanılacak; paket yükseltmesine gerek yok.**

### Yedek plan (yalnızca Vercel bir sebeple kullanılamazsa)

Hostinger **VPS**: Docker Compose ile `app` (Next.js `output: 'standalone'`) + `postgres` +
`nginx` (reverse proxy, Let's Encrypt). Görseller `/var/www/media` altında,
Nginx `Cache-Control: public, max-age=31536000, immutable` ile servis eder.
Paylaşımlı pakete (Sınırsız dahil) kurulum yapılmayacak.

---

## 3. TASARIM SİSTEMİ

Referans his: **koyu, metalik-krom aksanlı, sessiz lüks.** Renk üçlüsü siyah / gri / beyaz.
Varsayılan tema **dark**; light tema toggle ile mevcut olacak (tam tersi palet).

### 3.1 Token'lar

```css
/* DARK (varsayılan) */
:root, :root[data-theme="dark"] {
  --bg:          #0A0A0B;   /* sayfa zemini */
  --bg-2:        #0F0F11;   /* bölüm ayrımı */
  --surface:     #131315;   /* kart */
  --surface-2:   #1A1A1D;   /* yükseltilmiş kart, modal, drawer */
  --border:      #26262A;   /* ince çizgi */
  --border-soft: #1D1D21;
  --text:        #F5F5F7;
  --text-muted:  #8B8D93;
  --text-faint:  #5C5E65;
  --chrome-1:    #7E818C;
  --chrome-2:    #C9CBD4;
  --chrome-3:    #FFFFFF;
  --chrome-grad: linear-gradient(120deg,#7E818C 0%,#C9CBD4 35%,#FFFFFF 50%,#C9CBD4 65%,#7E818C 100%);
  --success:     #2BB863;
  --danger:      #E0524D;
  --radius:      16px;
  --radius-sm:   10px;
  --radius-pill: 999px;
  --shadow:      0 10px 40px rgba(0,0,0,.55);
  --shadow-sm:   0 2px 12px rgba(0,0,0,.35);
}

/* LIGHT (toggle) */
:root[data-theme="light"] {
  --bg:          #FAFAFA;
  --bg-2:        #F2F2F3;
  --surface:     #FFFFFF;
  --surface-2:   #F7F7F8;
  --border:      #E4E4E7;
  --border-soft: #EFEFF1;
  --text:        #0A0A0B;
  --text-muted:  #6B6D73;
  --text-faint:  #9A9CA3;
  --chrome-grad: linear-gradient(120deg,#5A5D66 0%,#8B8D98 35%,#26262A 50%,#8B8D98 65%,#5A5D66 100%);
  --shadow:      0 10px 40px rgba(0,0,0,.08);
  --shadow-sm:   0 2px 12px rgba(0,0,0,.06);
}
```

Kural: hiçbir rengi doğrudan yazma; her renk token üzerinden gelsin. Tema geçişi
`data-theme` attribute'u ile, seçim `localStorage`'da; ilk yüklemede sistem tercihini oku
ama **varsayılan dark** olsun (kullanıcı tercihi yoksa dark).

### 3.2 Tipografi

- Tek aile: **Outfit** (Google Fonts, variable). Arapça için **Tajawal** eşlenir.
- `font-family: Outfit, Tajawal, system-ui, sans-serif`
- Ölçek: display 72/64/48 · h1 40 · h2 32 · h3 24 · body 16 · small 14 · micro 12
- Başlıklarda `letter-spacing: -0.02em`, `font-weight: 700`
- Etiket/eyebrow: 12px, `font-weight: 500`, `letter-spacing: 0.08em`, uppercase
- Ürün kodu ve teknik veriler: `font-variant-numeric: tabular-nums`, monospace tonunda gri
- **Krom başlık efekti:** `background: var(--chrome-grad); -webkit-background-clip: text; color: transparent;`
  Sadece hero başlığı ve bölüm başlıklarında; her yerde kullanma.
- Türkçe `ı/İ/ş/ğ/ç/ö/ü`, Almanca `ß/ä/ö/ü` ve Arapça tam desteklenmeli. Font subset'lerini
  `latin, latin-ext, arabic` olarak yükle.

### 3.3 Bileşen dili

- **Buton (primary):** pill (`--radius-pill`), 1px krom gradyan kenar, şeffaf zemin,
  hover'da zemin `--surface-2` ve kenar parlaklığı artar. `padding: 14px 28px`, 15px/500.
- **Buton (solid):** beyaz zemin + siyah metin (dark'ta), light'ta tersi.
- **Kart:** `--surface`, 1px `--border`, `--radius`, gölge yok; hover'da kenar `--chrome-1`'e
  yaklaşır ve görsel `scale(1.03)` (300ms `cubic-bezier(.22,1,.36,1)`).
- **Filtre chip'i:** pill, pasifken şeffaf + `--border`, aktifken beyaz zemin siyah metin.
- **Input:** `--surface-2` zemin, 1px `--border`, focus'ta krom kenar + `outline: none` yerine
  görünür `box-shadow` halkası (erişilebilirlik).
- Köşe yarıçapları iç içe geçerken eşmerkezli olsun (dış 16 → iç 10).
- Motion: sadece `transform` ve `opacity`. Süre 200–350ms. `prefers-reduced-motion` desteklenecek.
- **Yasak:** mor/mavi gradyan, glow, emoji ikon, stok fotoğraf illüstrasyonu, "AI slop" görünümü.
  `no-ai-design-slop` ve `audit-ai-design-slop` skill'lerini uygula.

---

## 4. SAYFALAR

Tüm sayfalar `/[locale]/...` altında. Varsayılan locale `en`.

### 4.1 Ana sayfa `/`
Sırayla:

1. **Header** — logo (sol), menü (Products · What We Do · Manufacturing · About · Contact),
   dil seçici (EN/TR/DE/AR), tema toggle, teklif sepeti ikonu (rozet sayaçlı), WhatsApp.
   Sticky, scroll'da blur + `--border` alt çizgi. Mobilde hamburger drawer.
   **Dil seçimi engelleyici modal OLMAYACAK** — mevcut sitedeki hata buydu.
   `Accept-Language` ile otomatik yönlendirme (bir kez, cookie'ye yaz).
2. **Hero (Banner 1)** — tam genişlik, ürün fotoğrafı üzerine koyu gradyan.
   Eyebrow: `WHOLESALE · MOQ 50 PCS · PRIVATE LABEL`
   Başlık (krom gradyan): **BEYOND WHAT'S NEXT.**
   Alt metin: `Turkish knitwear manufacturer. Design, production and global delivery under one roof.`
   İki buton: `Explore Catalog` (solid) · `Request a Quote` (outline)
3. **Güven şeridi** — 4 rakam: kuruluş yılı · aylık kapasite · MOQ 50 pcs · export ülke sayısı.
4. **Kategoriler** — 16 kategori, görsel kapaklı grid (kapak = o kategorinin en iyi ürün görseli).
5. **Best Sellers** — panelden seçilen ve sıralanan ürünler, yatay kayan şerit.
6. **Banner 2** — üretim/kabiliyet banner'ı: `From sketch to shipment` mesajı,
   `Private label · Custom design from 500 pcs · Logo print from 50 pcs`, CTA → Manufacturing.
7. **Featured Products** — panelden seçilen.
8. **New Arrivals** — panelden seçilen.
9. **Üretim ve kalite** — kısa metin + üretim görselleri (3-4 kare) + CTA.
10. **Neden THE CHAMP** — 6 madde ikon+başlık+tek cümle.
11. **Katalog indir** — PDF katalog butonu (bkz. §12).
12. **İletişim/teklif formu** (bkz. §8.2) + e-posta, telefon, WhatsApp.
13. **Footer** — şirket bilgisi, kategoriler, yasal linkler, sosyal medya, dil seçici.

> Banner 1 ve 2 görselleri mevcut ürün fotoğraflarından kurgulanacak: koyu gradyan katman
> (`linear-gradient(90deg, rgba(10,10,11,.92) 0%, rgba(10,10,11,.45) 60%, transparent 100%)`)
> + sol hizalı tipografi. Metin okunabilirliği her kırılımda kontrol edilecek.

### 4.2 Katalog `/products`
- Sol/üst filtre: bölüm (Women/Men/Unisex/Kids), kategori, alt kategori, renk, beden,
  kumaş, gramaj aralığı, fiyat bandı, MOQ, private label uygunluğu.
- Arama: kod, model kodu, ad, kategori, renk, beden üzerinde. Debounce 250ms.
- Sıralama: Newest · Best Sellers · Price low→high · A–Z.
- **Sayfalama zorunlu**: sayfa başına 48 ürün + "Load more". 819 ürünü tek DOM'a basma.
  `next/image` ile `sizes` doğru verilecek, `loading="lazy"`, blur placeholder.
- Filtre durumu URL'e yazılacak (`?category=tshirts&color=black`) — paylaşılabilir olmalı.
- Boş sonuç durumu tasarlanacak (`search-ux` skill'i).

### 4.3 Kategori `/products/[category]`
Kendi başlığı, açıklaması ve SEO metni olan gerçek sayfa. Katalogla aynı grid.

### 4.4 Ürün detay `/products/[category]/[slug]`
**Gerçek URL olacak, modal DEĞİL.** (Mevcut sitenin en büyük hatası hash modaldı.)

Sol: görsel galerisi (renk seçimine göre değişen, thumbnail'lı, zoom'lu).
Sağ:
- Ürün kodu (TC-TSH-0123) · kategori · bölüm
- Ürün adı (seçili dilde)
- Renk seçenekleri (nokta + isim), beden aralığı (XS–2XL, çocukta 4-5 → 14-15 yaş)
- **4 kademeli fiyat tablosu** (bkz. §7) + para birimi seçici (USD/EUR)
- Fiyat notu: `Prices may vary depending on order quantity, product specifications, customization and delivery terms. Please contact us for a final quotation.` · `EXW Istanbul, excluding VAT and shipping.`
- Teknik özellikler: kumaş içeriği, gramaj, MOQ, termin, paketleme, private label, baskı tekniği
- Kısa + uzun açıklama
- `+ Add to inquiry` (birincil) · `Ask on WhatsApp` (ürün bilgisi ve **sayfa linki** dolu gelecek)
- İlgili ürünler (aynı kategori, farklı model)

### 4.5 Ne yapıyoruz `/what-we-do`
11 adımlı hizmet ekosistemi sayfası — içeriğin tamamı §13.4'te. Menüde `Products`'tan sonra gelir.
Ana sayfada kısaltılmış hali bir bölüm olarak yer alır ve buraya bağlanır.

### 4.6 Üretim `/manufacturing`
Marka hikâyesi, kuruluş yılı, üretim yeri, aylık kapasite, ürün geliştirme süreci,
kumaş ve baskı kalitesi, üretim görselleri, video (varsa), e-ticaret tecrübesi,
hedef pazarlar, private label ve toptan iş birliği, sertifikalar.

### 4.7 Hakkımızda `/about`
§13'teki marka metni (4 dilde).

### 4.8 İletişim `/contact`
Form + e-posta + telefon + WhatsApp + Telegram + adres + (varsa) harita.

### 4.9 Teklif sepeti `/inquiry`
bkz. §8.

### 4.10 Yasal
`/privacy`, `/terms` — GDPR notu dahil (form veri toplandığı için gerekli).

---

## 5. VERİ MODELİ (Prisma)

```prisma
model Category {
  id          String   @id @default(cuid())
  slug        String   @unique          // "tshirts"
  order       Int      @default(0)
  active      Boolean  @default(true)
  coverImage  String?
  // varsayılan üretim bilgileri — ürün boş bırakırsa buradan gelir
  fabric      Json?    // { en, tr, de, ar }
  gsm         Int?
  moq         Int?
  leadTimeDays String?
  packaging   Json?
  privateLabel Boolean @default(true)
  printType   Json?
  // varsayılan fiyatlar (USD)
  price100    Decimal? @db.Decimal(10,2)
  price300    Decimal? @db.Decimal(10,2)
  price500    Decimal? @db.Decimal(10,2)
  price1000   Decimal? @db.Decimal(10,2)
  translations CategoryTranslation[]
  products    Product[]
}

model CategoryTranslation {
  id         String @id @default(cuid())
  categoryId String
  locale     String            // en | tr | de | ar
  name       String
  description String?
  seoTitle   String?
  seoDescription String?
  category   Category @relation(fields:[categoryId], references:[id], onDelete: Cascade)
  @@unique([categoryId, locale])
}

model Product {
  id           String   @id @default(cuid())
  productCode  String   @unique         // TC-TSH-0123
  modelCode    String?                  // PRA-...
  slug         String   @unique
  categoryId   String
  subcategory  String?                  // Oversize | Hoodie | Printed | Basic ...
  section      String                   // Women | Men | Unisex | Kids
  audience     String                   // adult | kids
  status       String   @default("published")  // published | draft | archived
  // ürün bazlı istisnalar — null ise kategori varsayılanı kullanılır
  fabric       Json?
  gsm          Int?
  moq          Int?
  leadTimeDays String?
  packaging    Json?
  privateLabel Boolean?
  printType    Json?
  price100     Decimal? @db.Decimal(10,2)
  price300     Decimal? @db.Decimal(10,2)
  price500     Decimal? @db.Decimal(10,2)
  price1000    Decimal? @db.Decimal(10,2)
  priceEurOverride Json?                // { "100": 4.10, ... } — boşsa kurdan hesaplanır
  isBestSeller Boolean  @default(false)
  isFeatured   Boolean  @default(false)
  isNew        Boolean  @default(false)
  sortOrder    Int      @default(0)
  sourceUrl    String?                  // dahili, ASLA public API'de dönme
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  category     Category @relation(fields:[categoryId], references:[id])
  translations ProductTranslation[]
  variants     Variant[]
}

model ProductTranslation {
  id        String @id @default(cuid())
  productId String
  locale    String
  name      String
  shortDescription String?
  description String?
  seoTitle  String?
  seoDescription String?
  product   Product @relation(fields:[productId], references:[id], onDelete: Cascade)
  @@unique([productId, locale])
}

model Variant {
  id        String  @id @default(cuid())
  productId String
  color     String                    // canonical: "Black"
  colorTr   String?                   // "SİYAH"
  colorHex  String?
  sizes     String[]                  // ["XS","S","M","L","XL","2XL"]
  images    String[]                  // kendi CDN'imizdeki yollar
  sortOrder Int     @default(0)
  product   Product @relation(fields:[productId], references:[id], onDelete: Cascade)
}

model Inquiry {
  id        String   @id @default(cuid())
  name      String
  company   String?
  country   String?
  email     String
  phone     String?
  message   String?
  locale    String
  status    String   @default("new")   // new | in_progress | quoted | closed
  adminNote String?
  fileUrl   String?
  createdAt DateTime @default(now())
  items     InquiryItem[]
}

model InquiryItem {
  id          String  @id @default(cuid())
  inquiryId   String
  productId   String?
  productCode String
  productName String
  color       String?
  sizeRun     String?
  quantity    Int?
  inquiry     Inquiry @relation(fields:[inquiryId], references:[id], onDelete: Cascade)
}

model Setting {
  key   String @id     // eurRate, whatsappNumber, inquiryEmail, capacity, ...
  value Json
}

model HomeSection {
  id        String @id @default(cuid())
  key       String @unique   // bestsellers | featured | new
  enabled   Boolean @default(true)
  limit     Int     @default(8)
  titles    Json               // { en, tr, de, ar }
  productIds String[]          // sıralı
}

model AdminUser {
  id           String @id @default(cuid())
  email        String @unique
  passwordHash String
  name         String?
  createdAt    DateTime @default(now())
}
```

---

## 6. ÜRÜN VERİSİ VE IMPORT

### 6.1 Kaynak: `products.source.json`
819 ürün, 16 kategori, 12.509 görsel URL'i. Şema:

```jsonc
{
  "productCode": "TC-TSH-0001",
  "modelCode":   "PRA-14531261-293715",
  "nameTr":      "Erkek Oversize Sweatshirt Perspectiv Baskılı Beyaz – Bisiklet Yaka...",
  "nameEn":      null,        // ← SEN DOLDURACAKSIN
  "slug":        null,        // ← SEN ÜRETECEKSİN (nameEn'den)
  "descriptionTr": "…",       // Türkçe açıklama (603 üründe var)
  "category": "T-Shirts", "categorySlug": "tshirts", "categoryTr": "T-Shirt",
  "subcategory": "Oversize",  // Oversize|Hoodie|Zip|Crop|Printed|Basic|Polo|Knit|null
  "section": "Men",           // Women | Men | Unisex | Kids
  "audience": "adult",        // adult | kids
  "sizes": ["XS","S","M","L","XL","2XL"],
  "colorCount": 3,
  "variants": [{ "color":"BEYAZ", "sizes":[...], "images":[8 adet URL], "skuCount":6 }],
  "imageCount": 24,
  "fabricHint": "%100 pamuk",  // 369 üründe var, ipucu — kesin bilgi değil
  "fabricTag":  "ŞARDONLU 3 İPLİK",
  "retailTry":  1499.0,        // Trendyol perakende TL — SADECE DAHİLİ, ASLA GÖSTERME
  "sourceUrl":  "https://www.trendyol.com/..."  // DAHİLİ, ASLA GÖSTERME
}
```

### 6.2 Yapılacaklar

1. **İngilizce ad üret (`nameEn`).** Türkçe addan tekstil terminolojisiyle çevir; ayırt edici,
   40 karakteri geçmeyen, başlık formatında. Örnek:
   `"Erkek Oversize Sweatshirt Perspectiv Baskılı Beyaz – Bisiklet Yaka, 3 İplik Şardonlu"`
   → `"Men Oversize Perspective Print Sweatshirt"`
   Aynı adın iki kez çıkmasına izin verme; çakışırsa ayırt edici bir kelime ekle.
2. **Slug üret:** `men-oversize-perspective-print-sweatshirt` (çakışırsa `-2` ekle).
3. **TR / DE / AR çevirileri** `ProductTranslation` tablosuna yaz. TR zaten elde (`nameTr`),
   temizlenip kullanılacak (fazla tire ve pazaryeri jargonu ayıklanacak).
4. **Renkleri normalize et.** Türkçe renk adlarını İngilizceye eşle ve hex ata:
   `SİYAH→Black #111111`, `BEYAZ→White #F6F4EE`, `EKRU→Ecru #D6C7A8`, `BEJ→Beige #CDB89A`,
   `KREM→Cream #EFE6D0`, `GRİ→Gray #8A8A8A`, `AÇIK GRİ→Light Gray #BCBCBC`,
   `ANTRASİT→Anthracite #3A3A3A`, `FÜME→Smoke Gray #5A5651`, `LACİVERT→Navy #1B2A4A`,
   `MAVİ→Blue`, `BEBE MAVİ→Baby Blue`, `KIRMIZI→Red #C0392B`, `BORDO→Burgundy #6E1F2A`,
   `PEMBE→Pink #E8A0B4`, `PUDRA→Powder Pink`, `YEŞİL→Green`, `HAKİ→Khaki #6B6B4A`,
   `SARI→Yellow`, `TURUNCU→Orange`, `MOR→Purple`, `KAHVE→Brown #6B4A38`,
   `VİZON→Mink #A08B7A`, `MELANJ→Melange #A9A9A9`, `TAŞ→Stone`, `SOMON→Salmon`.
   Listede olmayanı olduğu gibi bırak ve panelde "eşlenmemiş renk" olarak raporla.
5. **Görselleri kendi sunucumuza taşı.** `cdn.dsmcdn.com` üzerindeki 1200×1800 orijinalleri indir,
   her biri için 3 boyut üret: `thumb 400w`, `card 800w`, `full 1400w`, hepsi **WebP** (+ AVIF opsiyonel).
   Dosya adı: `{productCode}/{colorSlug}/{index}.webp`. Depolama: Vercel Blob (veya VPS'te `/var/www/media`).
   İndirme paralel ama nazik olsun (eşzamanlı 8, hata durumunda 3 kez yeniden dene, log tut).
   **Trendyol CDN'ine canlı sitede hiçbir referans kalmayacak.**
6. **`sourceUrl` ve `retailTry` alanlarını asla public API/HTML'e sızdırma.** Bunlar Trendyol
   perakende bilgisidir; toptan alıcı görürse marj açığa çıkar. Veritabanında dursun, sadece panelde görünsün.
7. **Fiyat ve üretim bilgisi** `THE_CHAMP_fiyat_sablonu.xlsx` dosyasından okunacak:
   - `Kategori Fiyat` sayfası → `Category.price100..1000`
   - `Kategori Üretim` sayfası → `Category.fabric/gsm/moq/leadTimeDays/packaging/privateLabel/printType`
   - `Ayarlar` sayfası → `Setting` tablosu (EUR kuru, MOQ'lar, e-posta, kapasite vb.)
   - `Ürün İstisnaları` sayfası → dolu olan satırlar `Product` üzerine yazılır
8. **Beden kuralı:** yetişkin ürünlerde varsayılan aralık **XS–2XL**. Kaynakta eksik beden olsa
   bile ürün gösterilecek; stok bilgisi siteye HİÇ yansıtılmayacak (B2B'de üretim yapılıyor).
   Çocuk ürünlerinde aralık 4-5 → 14-15 yaş.
9. **Bedenleri normalize et.** Kaynak veri kirli — şu ham değerler geliyor:
   `XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL, 6XL, XS/S, S/M, M/L, L/XL, XL/2XL, XS-S, XL-XXL,
   XXL-L, XL/L, S/B, M/B, L/B, XL/P, 2XL/T, 32, Standart` ve çocukta
   `4-5 Yaş … 14-15 Yaş, 12-13 Ay, 6-8 Yaş, 7-10 Yaş, 10-13`.
   Kurallar:
   - Yetişkin kanonik sırası: `XS · S · M · L · XL · 2XL · 3XL · 4XL · 5XL · 6XL`
   - Kombine bedenler kanonik: `XS/S · S/M · M/L · L/XL · XL/2XL` (`XS-S`→`XS/S`, `XL-XXL`→`XL/2XL`,
     `XXL-L`→`L/XL`, `XL/L`→`L/XL`)
   - `S/B`, `M/B`, `L/B`, `XL/P`, `2XL/T`, `32` → sondaki harf/rakam eki atılır (`S`, `M`, `L`, `XL`, `2XL`);
     `32` tekil kalırsa ürün `Standart` sayılır
   - Çocuk kanonik: `4-5 · 6-7 · 8-9 · 10-11 · 12-13 · 14-15 Yaş`; aradaki varyasyonlar
     (`5-6`, `9-10`, `11-12`, `13-14`, `6-8`, `7-10`, `10-12`, `10-13`) en yakın kanonik aralığa eşlenir.
     `12-13 Ay` bebek bedenidir → o ürünü **yayınlama** (draft yap, panelde raporla).
   - Ürün kartında ve detayda beden **aralık** olarak gösterilir: `XS–2XL` / `4-5 → 14-15 Yaş`.
   - Eşlenemeyen bir beden çıkarsa ürünü silme; `Standart` ata ve panelde "beden eşlenmedi" uyarısı ver.

10. **Kategori adları (4 dil):**

| slug | EN | TR | DE | AR |
|---|---|---|---|---|
| tshirts | T-Shirts | Tişört | T-Shirts | تي شيرت |
| sweatshirts | Sweatshirts | Sweatshirt | Sweatshirts | سويت شيرت |
| polo-shirts | Polo Shirts | Polo Yaka | Poloshirts | بولو |
| tracksuits | Tracksuits | Eşofman Takımı | Trainingsanzüge | بدلة رياضية |
| sweatpants | Sweatpants | Eşofman Altı | Jogginghosen | بنطال رياضي |
| co-ord-sets | Co-ord Sets | Alt-Üst Takım | Sets | طقم |
| shorts | Shorts | Şort | Shorts | شورت |
| blouses | Blouses | Bluz | Blusen | بلوزة |
| dresses | Dresses | Elbise | Kleider | فستان |
| skirts | Skirts | Etek | Röcke | تنورة |
| trousers | Trousers | Pantolon | Hosen | بنطال |
| bodysuits | Bodysuits | Body | Bodys | بادي |
| shirts | Shirts | Gömlek | Hemden | قميص |
| jackets | Jackets | Ceket & Mont | Jacken | جاكيت |
| knitwear | Knitwear | Triko | Strickwaren | تريكو |
| leggings | Leggings | Tayt | Leggings | ليقنز |

### 6.3 Panelden Excel yükleme (kalıcı özellik)
Aynı şablon formatı panelden de yüklenebilecek:
dosya seç → **önizleme** (kaç yeni, kaç güncellenecek, kaç satır hatalı, hangi sütun hatalı)
→ onay → uygula. Hatalı satırlar indirilebilir bir rapor olarak dönecek.
İşlem bir transaction içinde olacak; yarım kalmayacak.

---

## 7. FİYATLANDIRMA

> **İLK SÜRÜM KARARI: Fiyatlar BOŞ yayına çıkacak.** Fiyat altyapısının tamamı (4 kademe,
> USD/EUR, kategori→ürün devralma, toplu güncelleme, Excel yükleme) kodlanacak ama veri
> girilmeyecek. Fiyatı olmayan üründe tablo yerine **"Request price"** butonu görünecek ve
> teklif sepetine yönlendirecek. Kullanıcı fiyatları sonradan panelden veya Excel ile girecek;
> girildiği anda tablo otomatik görünmeye başlayacak. Aynı şey **fabrika/üretim görselleri** için
> de geçerli: görsel yoksa o bölüm sayfada hiç render edilmeyecek (boş kutu bırakma), panelden
> eklenince görünecek.


- 4 kademe: **100+ / 300+ / 500+ / 1000+ adet**, birim fiyat.
- Ana para birimi **USD**. EUR, `Setting.eurRate` üzerinden hesaplanır ve 2 haneye yuvarlanır;
  `Product.priceEurOverride` doluysa o kullanılır.
- Ziyaretçi header'dan para birimi seçer (USD/EUR), seçim cookie'de saklanır.
- Fiyat çözümleme sırası: **Ürün fiyatı → yoksa kategori fiyatı → yoksa "Request price"**.
- Kartlarda `from $X.XX` (1000+ kademesi), detay sayfasında tam tablo.
- Her fiyat gösteriminin yanında: `EXW Istanbul · excluding VAT & shipping`
- Tam not (4 dilde çevrilecek):
  > Prices may vary depending on order quantity, product specifications, customization and delivery terms. Please contact us for a final quotation.

---

## 8. TEKLİF SEPETİ VE FORM

### 8.1 Sepet
- Ürün kartında ve detay sayfasında `+ Add to inquiry`.
- Sepet `localStorage`'da tutulur (üyelik yok), header'daki ikonda sayaç.
- Sepet drawer'ı: ürün görseli, kod, ad, **renk seçimi**, **adet girişi**, satır silme.
- `/inquiry` sayfası: sepet tablosu + form. Toplam adet gösterilir, MOQ altındaysa uyarı verir
  ama engellemez.
- İki gönderim yolu:
  1. **Form** → `Inquiry` + `InquiryItem` kaydı + kurumsal e-postaya bildirim (Resend)
  2. **WhatsApp** → seçilen ürünler hazır mesaj olarak, her satırda kod + renk + adet + ürün linki

### 8.2 Form alanları
Ad soyad* · Firma adı · Ülke (select) · E-posta* · Telefon · İlgilenilen ürün/kategori ·
Tahmini sipariş adedi · Mesaj · Dosya ekleme (opsiyonel, max 10MB, pdf/jpg/png/xlsx)
+ KVKK/GDPR onay kutusu.

Doğrulama: zod + react-hook-form. Spam koruması: honeypot alanı + basit rate limit
(IP başına 5 dk'da 3 gönderim). CAPTCHA kullanma.
Gönderim sonrası: başarı ekranı + kullanıcıya otomatik teşekkür e-postası (seçili dilde).

---

## 9. YÖNETİM PANELİ — `/admin` (arayüz dili TÜRKÇE)

Giriş: e-posta + şifre (Auth.js credentials, bcrypt). Şifre değiştirme, oturum kapatma.
Tek rol: admin. Rate limit'li giriş.

**Ana ekran:** toplam ürün · toplam kategori · yayında/taslak sayısı · Best Seller/Featured/New
sayıları · son teklif talepleri · **eksik veri uyarısı** (fiyatı olmayan, İngilizce adı olmayan,
görseli olmayan ürünler — tıklanınca filtrelenmiş listeye gider).
Hızlı işlemler: Yeni ürün · Toplu fiyat güncelle · Excel yükle · Ana sayfa ürünlerini düzenle · Yeni kategori.

**Ürün yönetimi:** listeleme (arama + filtre + sayfalama), ekleme, düzenleme, kopyalama,
taslak/yayında, arşivleme, silme. Görsel ekleme/silme/sürükle-bırak sıralama.
Her ürün için 4 dilde ad/açıklama/SEO alanları sekmeli.

**Toplu düzenleme:** kategori veya ürün seç → tablo üzerinde hücre hücre düzenleme
(Excel hissi) **veya** seçilenlerin hepsine aynı değeri yazma. Düzenlenebilir alanlar:
4 fiyat kademesi, kumaş, gramaj, termin, MOQ, para birimi, kategori, yayın durumu.
**Kaydetmeden önce kaç ürünün etkileneceğini göster ve onay iste.**

**Kategori yönetimi:** ekleme, 4 dilde ad, kapak görseli, sıralama (sürükle-bırak),
aktif/pasif, kategori varsayılan üretim bilgisi ve fiyatları.

**Ana sayfa ürün seçimi:** Best Sellers / Featured / New Arrivals — ürün arayıp ekleme,
sürükle-bırak sıralama, gösterilecek adet, bölümü aç/kapat, bölüm başlığını 4 dilde değiştirme.
Bir ürün birden fazla bölümde olabilir.

**Teklif talepleri:** liste, detay, durum (Yeni / Görüşülüyor / Teklif Gönderildi / Tamamlandı),
not ekleme, CSV dışa aktarma.

**Ayarlar:** logo, favicon, telefon, e-posta, WhatsApp, sosyal medya, ana sayfa metinleri,
kapak görselleri, katalog PDF ayarları, fiyat notu, EUR kuru, dil ayarları, SEO başlık/açıklama.

Panel görsel dili: siteyle aynı token'lar, koyu tema (`dark-glass-clean-layout` skill'i).
Bildirimler için sonner toast (`ask-sonner` skill'i), Türkçe mesajlar.

---

## 10. ÇOK DİLLİLİK

- `next-intl`, alt yol tabanlı: `/en`, `/tr`, `/de`, `/ar`. Varsayılan `en`.
- İlk ziyarette `Accept-Language`'a göre yönlendir, tercihi cookie'ye yaz. **Modal ile sorma.**
- Arapça `dir="rtl"`: tüm layout aynalanacak (`localization-design` skill'i zorunlu).
  Logical property kullan (`margin-inline-start`, `padding-inline-end`), `left/right` yazma.
  İkon yönleri, oklar, slider yönü, breadcrumb ayracı aynalanacak.
- Almanca metin genişlemesine (%30'a kadar) dayanıklı buton/etiket genişlikleri.
- Sayı ve para formatı `Intl.NumberFormat` ile locale'e göre.
- Her sayfada `hreflang` alternate + `x-default`.
- Ürün ve kategori adları veritabanından çevirili gelir (arayüz + içerik ayrı ayrı çevrilir).

---

## 11. SEO VE PERFORMANS

**Mevcut sitede olmayan ve mutlaka olacaklar:**
- Her sayfada tek `<h1>`
- `metadata` API ile title/description (4 dilde), Open Graph + Twitter Card görselleri
  (ürün sayfasında ürün görseli — WhatsApp/Instagram link önizlemesi çalışacak)
- `canonical` + `hreflang`
- `robots.txt` ve **dinamik `sitemap.xml`** (tüm diller × tüm ürün ve kategori sayfaları)
- JSON-LD: `Organization`, `BreadcrumbList`, her ürün için `Product` +
  `offers.priceSpecification` (kademeli fiyat için `UnitPriceSpecification` + `eligibleQuantity`)
- Görseller: WebP, doğru `sizes`, `priority` sadece hero'da, blur placeholder
- Hedef: LCP < 2.5s, CLS < 0.1, mobil Lighthouse ≥ 90
- Ana sayfa ve kategori sayfaları statik/ISR; katalog filtreleri client-side

**Anahtar kelimeler (title/description'da geçsin):**
`turkish clothing manufacturer`, `wholesale t-shirt supplier turkey`, `private label knitwear`,
`oversize sweatshirt manufacturer`, `istanbul textile wholesale`, `OEM clothing manufacturer`.

---

## 12. PDF KATALOG

- `/api/catalog/[locale]` → paneldeki güncel veriden PDF üretir.
- İçerik: kapak (logo + krom başlık + iletişim) → firma özeti ve kabiliyetler →
  kategori başına ürün sayfaları (görsel + kod + ad + renkler + beden aralığı + 4 kademe fiyat)
  → arka kapak (MOQ şartları, iletişim, QR kod).
- Kategori bazlı katalog da üretilebilsin (`?category=tshirts`).
- Üretim ağır olduğu için sonuç önbelleğe alınsın; panelde "Kataloğu yeniden üret" butonu olsun.
- Ana sayfadaki buton doğrudan indirsin (form arkasına saklama).

---

## 13. MARKA METİNLERİ

### 13.1 Türkçe (kullanıcı tarafından verildi — aynen kullanılacak)

> **THE CHAMP GLOBAL**
> **BEYOND WHAT'S NEXT.**
>
> Her büyük yolculuk bir fikirle başlar. Ancak fikri gerçeğe dönüştüren şey yalnızca cesaret değildir.
> **Deneyimdir. İçgörüdür. Zanaattır. Ve her seferinde daha iyisini arama tutkusu.**
>
> The Champ Global, yıllara dayanan tekstil ve üretim mirasını; tasarım, teknoloji ve yeni nesil
> ticaret anlayışıyla birleştiren **global bir yaratım ve büyüme platformudur.**
>
> Biz bir ürünün yalnızca nasıl üretileceğini değil, **bir fikrin nasıl değere dönüşeceğini** biliyoruz.
> Bu yüzden bizim için yolculuk hiçbir zaman üretimle bitmez.
>
> Bir fikir doğar. Bir kimlik kazanır. Tasarım şekillenir. Üretim hayat verir.
> Teknoloji onu hızlandırır. Ve dünya ile buluşur. **Biz bu yolculuğun her aşamasındayız.**
>
> Yıllar içinde farklı markalar yarattık, farklı pazarları keşfettik ve sınırların ötesine ulaştık.
> 2021'de ise deneyimimizi yeni dünyanın gücüyle birleştirerek yeni bir sayfa açtık: **The Champ Global.**
>
> Bugün bizi ileri taşıyan yalnızca geçmişimiz değil. **Değişimi herkesten önce fark etme isteğimiz.
> Henüz keşfedilmemiş olanı arama cesaretimiz. Ve daha iyisinin her zaman mümkün olduğuna olan inancımız.**
>
> Biz trendlerin peşinden gitmek yerine, **geleceğin neye benzeyebileceğini düşünüyoruz.**
> Çünkü dünya değiştikçe biz de gelişiyoruz. Yeni fikirler. Yeni markalar. Yeni pazarlar. Yeni olasılıklar.
>
> 2026 yılında elde ettiğimiz ulusal ve uluslararası başarılar, bizim için bir varış noktası değil.
> **Standartlarımızın bir yansıması.** Ve yolculuk devam ediyor.
>
> Bugün The Champ Global'in önünde tek bir sınır var: **Hayal gücümüzün sınırı.**
>
> **WE DON'T FOLLOW THE FUTURE. WE CREATE WHAT COMES NEXT.**

### 13.2 İngilizce

> **THE CHAMP GLOBAL**
> **BEYOND WHAT'S NEXT.**
>
> Every great journey begins with an idea. But turning an idea into reality takes more than courage.
> **It takes experience. Insight. Craft. And the drive to do it better every single time.**
>
> The Champ Global is a **global creation and growth platform** that brings years of textile and
> manufacturing heritage together with design, technology and a new generation of commerce.
>
> We don't only know how a product is made — we know **how an idea becomes value.**
> That is why, for us, the journey never ends at production.
>
> An idea is born. It finds an identity. Design takes shape. Production gives it life.
> Technology accelerates it. And it meets the world. **We are present at every stage of that journey.**
>
> Over the years we have built brands, explored new markets and reached beyond borders.
> In 2021 we combined that experience with the power of a new world and opened a new chapter:
> **The Champ Global.**
>
> What carries us forward today is not only our past. **It is our will to see change before anyone
> else. Our courage to look for what has not been discovered yet. And our belief that better is
> always possible.**
>
> Instead of following trends, **we think about what the future could look like.**
> Because as the world changes, so do we. New ideas. New brands. New markets. New possibilities.
>
> The national and international achievements we reached in 2026 are not a destination for us.
> **They are a reflection of our standards.** And the journey continues.
>
> Today there is only one limit in front of The Champ Global: **the limit of our imagination.**
>
> **WE DON'T FOLLOW THE FUTURE. WE CREATE WHAT COMES NEXT.**

Almanca ve Arapça çevirileri aynı tonu koruyarak üret. Slogan `BEYOND WHAT'S NEXT.` ve
`WE DON'T FOLLOW THE FUTURE. WE CREATE WHAT COMES NEXT.` **her dilde İngilizce kalacak.**

### 13.3 Sabit ticari metinler (4 dile çevrilecek)
- `Minimum order 50 pcs`
- `Custom design from 500 pcs`
- `Custom logo print from 50 pcs`
- `Product & care label change from 200 pcs`
- `Shipping cost belongs to the buyer`
- `Logistics support available`
- `EXW Istanbul · excluding VAT and shipping`


### 13.4 WHAT WE DO — hizmet ekosistemi (yeni sayfa: `/what-we-do`)

Bu içerik **ayrı bir sayfa** olacak ve header menüsüne eklenecek
(Products · What We Do · Manufacturing · About · Contact).
Ayrıca ana sayfada bu 11 adımın kısaltılmış hali (sadece numara + İngilizce başlık + tek cümle)
yatay kayan bir şerit ya da 3 kolonlu grid olarak yer alacak, CTA → `/what-we-do`.

**Tasarım notu:** her adım numaralı bir blok. Numara büyük ve `--text-faint` renginde,
İngilizce başlık krom gradyanlı, Türkçe/yerel alt başlık `--text-muted`, maddeler ince ayraçlı
liste. Adımlar arasında `container-lines` skill'indeki gibi ince dikey bağlantı çizgisi olsun —
"tek bir zincir" hissi versin. Scroll'da sırayla belirsinler (`animation-on-scroll`, 40ms stagger).

#### Başlık

**EN:** `WHAT WE DO` · `FROM FABRIC TO BRAND. FROM PRODUCTION TO GLOBAL COMMERCE.`
**TR:** `NE YAPIYORUZ` · aynı slogan İngilizce kalır.

> **EN:** The Champ Global combines the manufacturing power of textiles with design, brand
> management, technology and e-commerce experience to deliver **an end-to-end creation and
> commerce system.**
> From the first analysis of an idea to fabric development; from building a collection to
> production; from packaging the product to positioning it in the right sales channel — we manage
> the entire process **within a single ecosystem.**

> **TR:** The Champ Global, tekstilin üretim gücünü; tasarım, marka yönetimi, teknoloji ve
> e-ticaret deneyimiyle birleştirerek **uçtan uca bir yaratım ve ticaret sistemi** sunar.
> Bir fikrin ilk analizinden, kumaşın geliştirilmesine; koleksiyonun oluşturulmasından üretime;
> ürünün paketlenmesinden doğru satış kanalında konumlandırılmasına kadar tüm süreci
> **tek bir ekosistem içerisinde yönetiyoruz.**

#### 11 adım

**01 — MARKET & CONSUMER INTELLIGENCE** · *Pazar ve Tüketici Analizi*
EN: We analyse shifting consumer behaviour, market dynamics, trends and sales data so that every collection answers a real need.
- Market and category analysis / Pazar ve kategori analizi
- Consumer behaviour analysis / Tüketici davranışı analizi
- Trend and demand analysis / Trend ve talep analizi
- Evaluation of production & consumption data / Üretim & tüketim verilerinin değerlendirilmesi
- Product performance and sales data analysis / Ürün performansı ve satış verilerinin analizi

**02 — BRAND & COLLECTION STRATEGY** · *Marka ve Koleksiyon Geliştirme*
EN: We turn an idea into a sustainable and scalable brand structure — from identity to collection architecture.
- Brand creation and positioning / Marka oluşturma ve konumlandırma
- Brand identity and product language / Marka kimliği ve ürün dili
- Building collections on behalf of the brand / Marka adına koleksiyon oluşturma
- Season and collection planning / Sezon ve koleksiyon planlaması
- Product group and collection architecture / Ürün grubu ve koleksiyon mimarisi
- Product strategy by target audience / Hedef kitleye göre ürün stratejisi

**03 — FABRIC DEVELOPMENT** · *Kumaş Geliştirme & Tekstil Ar-Ge*
EN: We develop the fabric that defines the character of the product, driven by need and design.
- Defining fabric type and structure / Kumaş cinsi ve yapısının belirlenmesi
- Fabric composition development / Kumaş kompozisyonu geliştirme
- Knit and woven fabric solutions / Örme ve dokuma kumaş çözümleri
- Weight, handfeel and surface properties / Gramaj, tuşe ve yüzey özelliklerinin belirlenmesi
- Colour and fabric variations / Renk ve kumaş varyasyonları
- Product-specific fabric development / Ürüne özel kumaş geliştirme
- Sampling and quality controls / Numune ve kalite kontrolleri

**04 — DESIGN & PRODUCT DEVELOPMENT** · *Tasarım & Ürün Geliştirme*
EN: Instead of merely following trends, we translate them into products that fit the brand's DNA.
- Collection design / Koleksiyon tasarımı
- Product design / Ürün tasarımı
- Graphic and print design / Grafik ve baskı tasarımı
- Colour and material selection / Renk ve materyal seçimi
- Sample development / Numune geliştirme
- Defining product details / Ürün detaylarının belirlenmesi
- Building collection coherence / Koleksiyon bütünlüğünün oluşturulması

**05 — PATTERN & PRE-PRODUCTION** · *Kalıp & Üretim Öncesi Hazırlık*
EN: We build the technical foundation of the designed product and make it ready for production.
- Technical drawing and product file / Teknik çizim ve ürün dosyası
- Pattern making / Kalıp oluşturma
- Measurements and size grading / Ölçülendirme ve beden çalışmaları
- Sample pattern / Numune kalıbı
- Fitting sessions / Fitting ve prova süreçleri
- Pattern revisions / Kalıp revizyonları
- Pre-production technical checks / Üretim öncesi teknik kontroller

**06 — PRODUCTION** · *Kesim & Dikim*
EN: We bring the developed collection to life in line with production standards.
- Fabric spreading and marker preparation / Kumaş serim ve pastal hazırlığı
- Cutting / Kesim
- Panel inspection / Parça kontrolü
- Sewing / Dikim
- Coordination of production operations / Üretim operasyonlarının koordinasyonu
- In-line quality controls / Ara kalite kontrolleri
- Final product inspection / Final ürün kontrolü

**07 — FINISHING & QUALITY** · *Ütü, Son İşlemler & Kalite Kontrol*
EN: We don't only make the product — we make it ready for sale.
- Pressing and shaping / Ütü ve form verme
- Final product checks / Son ürün kontrolleri
- Measurement and appearance control / Ölçü ve görünüm kontrolü
- Label and trim controls / Etiket ve aksesuar kontrolleri
- Quality standard verification / Ürün kalite standartlarının kontrolü
- Sale-ready product preparation / Satışa hazır ürün hazırlığı

**08 — PACKAGING & FULFILLMENT** · *Paketleme & Sevkiyata Hazırlık*
EN: We treat the brand's final touchpoint with the customer as part of production itself.
- Product folding / Ürün katlama
- Labelling / Etiketleme
- Packaging / Paketleme
- Order-based product preparation / Sipariş bazlı ürün hazırlığı
- Pre-shipment inspection / Sevkiyat öncesi kontrol
- Logistics and operations coordination / Lojistik ve operasyon koordinasyonu

**09 — CHANNEL-BASED BRAND DESIGN** · *Satış Kanalına Özel Marka & Ürün Yapısı*
EN: Every sales channel has its own dynamic. We position brands according to the product, visual and commercial structure that channel demands.
- Product strategy for e-commerce platforms / E-ticaret platformlarına özel ürün stratejisi
- Marketplace-focused brand structuring / Marketplace odaklı marka yapılanması
- Channel-based collection planning / Kanal bazlı koleksiyon planlaması
- Product title, content and visual strategy / Ürün başlığı, içerik ve görsel stratejisi
- Price and product positioning / Fiyat ve ürün konumlandırması
- Product optimisation by channel performance / Kanal performansına göre ürün optimizasyonu

**10 — E-COMMERCE CONSULTING** · *E-Ticaret Danışmanlığı*
EN: We don't stop at making the product — we get it to the right customer through the right channel.
- E-commerce brand strategy / E-ticaret marka stratejisi
- Digital store structuring / Dijital mağaza yapılanması
- Product and category optimisation / Ürün ve kategori optimizasyonu
- Sales channel management / Satış kanalı yönetimi
- Campaign and season planning / Kampanya ve sezon planlaması
- E-commerce performance analysis / E-ticaret performans analizi
- Product development driven by sales data / Satış verilerine göre ürün geliştirme

**11 — DATA, PRODUCTION & CONSUMPTION ANALYSIS** · *Veri Odaklı Üretim & Tüketim Yönetimi*
EN: We use the data generated from production to sale in order to develop the collections of tomorrow.
Öne çıkan blok (büyük tipografi, soru formatında):
> **What was produced? What sold? What was in demand?**
> **What should be produced again? Which product found its market?**
EN: By analysing this data we continuously improve production planning, collections and product strategy.
TR: Bu verileri analiz ederek üretim planlamasını, koleksiyonları ve ürün stratejilerini sürekli geliştiriyoruz.

#### Kapanış bloğu (sayfa sonu — büyük tipografi, ortalanmış)

**ONE ECOSYSTEM. ONE VISION.**

`We research. · We design. · We develop. · We produce. · We brand. · We digitalise. · We analyse. · We scale.`
*(TR: Araştırıyoruz · Tasarlıyoruz · Geliştiriyoruz · Üretiyoruz · Markalaştırıyoruz · Dijitalleştiriyoruz · Analiz ediyoruz · Ölçekliyoruz)*

**THE CHAMP GLOBAL**
**From the first thread to the final sale.**

> Experience in production.
> Imagination in design.
> Intelligence in commerce.
> A global vision in every step.

Altında CTA: `Request a Quote` + `Explore Catalog`.

> Bu bloktaki tüm İngilizce sloganlar (`ONE ECOSYSTEM. ONE VISION.`,
> `From the first thread to the final sale.`, adım başlıkları) **her dilde İngilizce kalır.**
> Sadece açıklama cümleleri ve madde listeleri TR/DE/AR'ye çevrilir.


---

## 14. KABUL KRİTERLERİ

Site:
- [ ] 819 ürün, 16 kategori yayında; her ürünün gerçek URL'i var (modal değil)
- [ ] Katalogda arama + filtre + sıralama + sayfalama çalışıyor, filtre URL'e yazılıyor
- [ ] Ürün sayfasında 4 kademeli fiyat tablosu ve USD/EUR geçişi çalışıyor
- [ ] Teklif sepetine ürün eklenip form ile gönderilebiliyor; e-posta kurumsal adrese düşüyor
- [ ] `/what-we-do` sayfası 11 adımıyla yayında ve menüde
- [ ] 4 dil çalışıyor; Arapça'da layout tam aynalanıyor
- [ ] Koyu tema varsayılan, açık tema toggle'ı çalışıyor, tercih hatırlanıyor
- [ ] Hiçbir görsel `cdn.dsmcdn.com`'dan yüklenmiyor
- [ ] `sourceUrl` / `retailTry` hiçbir public yanıtta görünmüyor
- [ ] `sitemap.xml`, `robots.txt`, `hreflang`, OG görselleri, Product JSON-LD mevcut
- [ ] QR kodla mobilden açıldığında ilk ekranda marka mesajı + MOQ + iki CTA görünüyor
- [ ] Mobil Lighthouse performans ≥ 90, erişilebilirlik ≥ 95
- [ ] 360px–1920px arasında hiçbir kırılımda header bozulmuyor, yatay kaydırma yok

Panel:
- [ ] Giriş yapılabiliyor, yetkisiz erişim engelleniyor
- [ ] Ürün ekleme/düzenleme/kopyalama/taslak/arşiv çalışıyor
- [ ] 4 fiyat kademesi tekli ve toplu değiştirilebiliyor, onay ekranı çıkıyor
- [ ] Kumaş/gramaj/termin/MOQ tekli ve toplu değiştirilebiliyor
- [ ] Excel yükleme önizleme + hata raporu ile çalışıyor
- [ ] Ana sayfadaki üç ürün grubu seçilip sıralanabiliyor
- [ ] Teklif talepleri listeleniyor, durum ve not eklenebiliyor, CSV alınabiliyor
- [ ] PDF katalog üretiliyor ve indirilebiliyor

---

## 15. UYGULAMA SIRASI (3 gün)

**Gün 1**
1. Skill'leri kur (§0). Proje iskeleti: Next.js + Tailwind + shadcn + Prisma + next-intl.
2. Tasarım token katmanı ve temel bileşenler (`design-token`, `theming-system`, `better-ui`).
3. Prisma şeması + migration. `products.source.json` import script'i.
4. İngilizce ad + slug üretimi, renk normalizasyonu, TR/DE/AR çevirileri.
5. Görsel taşıma pipeline'ı (indir → WebP × 3 boyut → yükle → DB'ye yaz). **Arka planda çalıştır, uzun sürer.**
6. Ana sayfa, katalog, kategori, ürün detay sayfaları.

**Gün 2**
7. Filtre/arama/sıralama/sayfalama.
8. Teklif sepeti + `/inquiry` + form + e-posta.
9. Yönetim paneli: auth, ürün CRUD, toplu düzenleme, Excel yükleme, kategori yönetimi,
   ana sayfa seçimleri, teklif talepleri, ayarlar.
10. 4 dil içeriklerinin tamamlanması, Arapça RTL denetimi.

**Gün 3**
11. PDF katalog.
12. SEO: metadata, OG, sitemap, robots, JSON-LD, hreflang.
13. Performans: görsel boyutları, ISR, bundle denetimi.
14. Denetim turu: `interface-review`, `audit-ai-design-slop`, `web-design-guidelines`,
    `accessibility-audit`. 360/768/1024/1440/1920 kırılım testi. Dört dilde gezinti testi.
15. Deploy + DNS + QR testi.

---

## 16. BEKLEYEN BİLGİLER (kullanıcıdan gelecek)

Bunlar gelene kadar ilgili alanlar boş bırakılıp panelden doldurulabilir yapılacak;
site bunlar olmadan da ayağa kalkmalı.

- [ ] `THE_CHAMP_fiyat_sablonu.xlsx` — doldurulmuş hali. **Yayına çıkmak için BEKLENMEYECEK**, sonradan panelden girilecek.
- [ ] Logo dosyaları (SVG/AI/EPS) — koyu ve açık tema için
- [ ] Resmî şirket unvanı, adres, vergi no
- [ ] Kurumsal e-posta (teklif formları buraya düşecek)
- [ ] Telefon / WhatsApp doğrulaması (mevcut: +90 553 213 04 04)
- [ ] Aylık üretim kapasitesi, numune süresi, toplu üretim termini
- [ ] Hedef ülkeler, ödeme koşulları
- [ ] Sertifikalar (OEKO-TEX / BSCI / ISO) ve marka tescili
- [ ] Fabrika/atölye/üretim fotoğrafları — **yayına çıkmak için beklenmeyecek**, sonradan panelden yüklenecek
- [ ] Panel kullanıcı hesabı açılacak e-posta adres(ler)i
- [ ] Hostinger hPanel DNS erişimi — Vercel'in vereceği A/CNAME kayıtlarını kullanıcı kendisi girecek
- [ ] Vercel ve Neon hesapları (ücretsiz, kullanıcı açacak)

---

## 17. YAPMAYACAKLARIN LİSTESİ

Mevcut sitenin hataları — tekrarlanmayacak:

1. Ürünü modal/hash ile gösterme. Her ürünün gerçek URL'i olacak.
2. 800+ ürünü tek sayfada DOM'a basma. Sayfalama zorunlu.
3. Üçüncü taraf CDN'den (Trendyol) görsel çekme.
4. Orijinal boyutlu (1200×1800) görseli 200px'lik karta koyma.
5. İlk ziyarette dil seçtiren engelleyici modal.
6. `<h1>`, OG etiketi, canonical, sitemap, robots olmadan yayına çıkma.
7. Dili sadece `localStorage`'da tutma — dil URL'de olacak.
8. Arayüzü çevirip ürün adlarını İngilizce bırakma.
9. `<button>` içine `<button>` koyma; kart bir `<a>` olacak.
10. Header'ın 600–900px arasında bozulmasına izin verme.
11. Sitede hiçbir yerde e-posta adresi olmaması.
12. Trendyol perakende linkini/fiyatını public veriye sızdırma.
