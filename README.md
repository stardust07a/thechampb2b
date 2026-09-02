# THE CHAMP GLOBAL — B2B

Türk örme tekstil üreticisi için çok dilli toptan katalog ve teklif talebi sitesi.
Yapım dökümanı: [`docs/THE_CHAMP_B2B_BUILD_BRIEF.md`](docs/THE_CHAMP_B2B_BUILD_BRIEF.md).
Kod içindeki `brief §X` referansları o dökümanın bölümlerini işaret eder.

---

## Hızlı başlangıç

```bash
npm install
npm run db:start        # yerel PostgreSQL (ilk çalıştırmada indirir, .devdb/)
npx prisma migrate deploy
npm run db:seed
npm run dev             # http://localhost:3000
```

Panel: `http://localhost:3000/admin` — `.env` içindeki `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

Görseller depoda yoktur (`/public/media` git dışı). Katalogda görsel görmek için:

```bash
npm run media:pull      # 12.504 görsel indirir, ~18 dk, ~1,5 GB
npx tsx scripts/pdf-thumbs.ts
npm run media:seed      # kategori kapakları ve sayfa görsellerini doldurur
```

---

## Ne var

| Alan | Durum |
|---|---|
| Ürün | 711 yayında + 108 arşiv · 16 kategori · 12.504 görsel |
| Dil | EN / TR / DE / AR — arayüz **ve** ürün adları, açıklamaları, SEO metinleri |
| Sayfa | Ana sayfa, katalog, kategori, ürün detay, what-we-do, üretim, hakkımızda, iletişim, teklif sepeti, gizlilik, şartlar |
| Panel | Ürün CRUD, toplu düzenleme, kategori, ana sayfa seçimleri, teklif talepleri, Excel yükleme, PDF katalog, ayarlar |
| Fiyat | 4 kademeli altyapı hazır, **veri bilerek boş** (brief §7) |
| SEO | tek `<h1>`, canonical, hreflang + x-default, OG/Twitter, `robots.txt`, 3.368 URL'lik `sitemap.xml`, Product + BreadcrumbList JSON-LD |

## Ne yok — sizden bekleniyor

Bunların hiçbiri sitenin ayağa kalkmasını engellemez; veri girilince ilgili bölüm
kendiliğinden görünmeye başlar.

- **Fiyatlar.** Panel → Excel yükle veya Toplu düzenleme. Girildiği anda ürün
  sayfasındaki "Fiyat iste" butonu yerini 4 kademeli tabloya bırakır.
- **Fabrika / üretim fotoğrafları.** Yokken o bölümler sayfaya hiç basılmaz.
- **Logo dosyaları (SVG).** Şu an tipografik wordmark kullanılıyor
  (`src/components/site/wordmark.tsx`) — logo gelince sadece o dosya değişir.
- **Resmî unvan, adres, vergi no, sertifikalar** → Panel → Ayarlar.
- **Aylık kapasite, ihracat ülke sayısı** → Ayarlar. Boşken sitede
  "Talep üzerine" yazar.
- **Kurumsal e-posta ve `RESEND_API_KEY`.** Anahtar yokken teklif formu yine
  çalışır ve kayıt panele düşer, sadece e-posta bildirimi gönderilmez.
- **Hukuki metin kontrolü.** `src/content/legal.ts` içindeki gizlilik ve kullanım
  şartları taslaktır; yayına çıkmadan önce bir hukukçuya okutun.

---

## Mimari

```
src/
  app/[locale]/        4 dilli public sayfalar
  app/admin/           yönetim paneli (Türkçe arayüz, locale dışında)
  app/api/             katalog PDF, teklif CSV, auth
  components/          ui/ (token'lı temel bileşenler) · site/ · product/ · admin/
  content/             marka metni, 11 adımlı ekosistem, hukuki metinler (4 dil)
  i18n/                next-intl yapılandırması
  lib/                 prisma, fiyat çözümleme, medya, ayarlar, Excel, PDF
scripts/               veri dönüşümü, seed, medya pipeline, yerel DB
data/                  kaynak ve normalize edilmiş ürün verisi + import raporu
```

### Katalog seçimi ve sıralama

`data/urunler-secim.xlsx` Trendyol SKU dökümüdür (13.253 satır, 900 model).
`npm run data:selection` bunu uygular:

- Bir modelin **bütün** satırları "Ürün arşivlendi" ise ürün **arşive alınır**
  (silinmez — panelde Arşiv filtresinde durur, tek tıkla geri açılır).
- Sıralama Excel satır sırasıdır: **en üstteki en yeni**. Katalogtaki "Newest"
  sıralaması `Product.sortOrder` üzerinden bunu kullanır.
- Sonuç: 711 yayında, 108 arşiv. Rapor: `data/selection-report.json`.

Liste güncellenince yeni dökümü aynı adla koyup komutu tekrar çalıştırın.

### Medya yuvaları

Kategori kapakları, sayfa görselleri ve dikey (9:16) üretim videoları
`MediaAsset` tablosunda "yuva" olarak tutulur ve **Panel → Medya**'dan yönetilir.
Bir yuva boşken sitede o bölüm hiç render edilmez — kırık görsel kalmaz.

Videolar ana sayfadaki "Üretim ve kalite" bölümünde ve Üretim sayfasında yatay
kayan şerit olarak çıkar; sessiz ve döngülü oynar, ses açma düğmesi vardır.

Başlangıç görselleri firmanın **kendi ürün çekimlerinden** dolduruldu.
İnternetten görsel kullanılmadı: stok/arama sonucu görseller telifli olur ve
ticari bir sitede hukuki risk yaratır. Fabrika fotoğrafları geldiğinde panelden
değiştirilir.

Yükleme hedefi: `BLOB_READ_WRITE_TOKEN` varsa Vercel Blob, yoksa
`public/media/uploads`. **Vercel'de `public/` yazılabilir değildir — yayında
token zorunludur.**

### Veri hattı

```
data/products.source.json        ← size verilen ham veri (819 ürün, Türkçe adlar)
        │  npm run data:transform
        ▼
data/products.normalized.json    ← EN/TR/DE/AR ad + slug + renk + beden + metin
data/import-report.json          ← kalite raporu (eşlenmemiş renk/beden, taslağa alınanlar)
        │  npm run db:seed
        ▼
PostgreSQL
```

Ürün adları serbest metin olarak çevrilmez. Türkçe başlıktan yapısal alanlar
(bölüm · kalıp · motif · baskı türü · kategori) ayrıştırılır ve her dilde
yeniden kurulur — sözlük `scripts/lib/lexicon.ts` içindedir. Böylece 819 × 4
ad tutarlı, benzersiz ve 40 karakterin altında kalır.

### Fiyat çözümleme (brief §7)

```
ürün fiyatı → yoksa kategori fiyatı → yoksa "Fiyat iste"
```

USD ana para birimi; EUR `Setting.eurRate` ile hesaplanır, `priceEurOverride`
doluysa o kullanılır. Sunucu her iki para birimini de gönderir, hangisinin
görüneceğine tarayıcı karar verir — böylece sayfalar statik kalır ve geçiş
sunucuya gitmeden olur.

### Görseller

Veritabanında Trendyol'a ait hiçbir URL yoktur; sadece kendi anahtarlarımız
durur (`TC-TSH-0001/black/1.webp`). Taban adres `NEXT_PUBLIC_MEDIA_BASE`
ortam değişkenidir: yerelde `/media`, yayında Vercel Blob adresi.
`scripts/media-pipeline.ts` bu dönüşümü yapan tek yerdir ve build'e dahil değildir.

### Dahili veri koruması (brief §6.2/6, §17.12)

`Product.sourceUrl` ve `Product.retailTry` Trendyol perakende bilgisidir ve
**hiçbir public yanıtta yer almaz.** `src/lib/products.ts` içindeki tüm public
sorgular açık `select` kullanır ve bu iki alanı seçmez. Yeni public sorgu
eklerken aynı kurala uyun — `include` ile tüm modeli çekmeyin.

---

## Komutlar

| Komut | İş |
|---|---|
| `npm run dev` | geliştirme sunucusu |
| `npm run build` | üretim derlemesi (veritabanı açık olmalı) |
| `npm run db:start` / `db:stop` / `db:status` | yerel PostgreSQL |
| `npm run db:seed` | normalize edilmiş veriyi yükler (idempotent) |
| `npm run db:reset` | şemayı sıfırlar ve yeniden seed eder |
| `npm run data:transform` | kaynak JSON → normalize JSON |
| `npm run data:selection` | Excel dökümüne göre arşivleme + sıralama |
| `npm run media:seed` | boş medya yuvalarını ürün çekimleriyle doldurur |
| `npm run media:pull` | görselleri indirir ve 3 boyutta WebP üretir |
| `npx tsx scripts/pdf-thumbs.ts` | PDF katalog için JPEG küçük görseller |
| `npm run media:push` | `public/media` → Vercel Blob (yayın için) |

---

## Yayına alma (Vercel + Neon)

Sırayla. Her adım bir öncekine bağlı.

### 1 — Hesaplar ve depolama

- **Neon**'da ücretsiz Postgres açın. **Pooled connection** adresini kopyalayın
  (havuzsuz adres serverless'ta bağlantı tüketir).
- **Vercel**'de projeyi bağlayın (GitHub deposu veya `vercel` CLI).
- Vercel → **Storage → Create → Blob**. Token'ı alın.

### 2 — Ortam değişkenleri

`.env.example` dosyasındaki tüm değişkenleri Vercel → Settings → Environment
Variables altına girin. Zorunlular: `DATABASE_URL`, `AUTH_SECRET`,
`NEXT_PUBLIC_SITE_URL`, `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_MEDIA_BASE`,
`NEXT_PUBLIC_BLOB_ENABLED=1`.

`AUTH_SECRET` üretmek için: `openssl rand -base64 32`

### 3 — Veritabanı

Kendi bilgisayarınızdan, Neon adresine karşı çalıştırın:

```bash
DATABASE_URL="<neon-pooled-url>" npx prisma migrate deploy
DATABASE_URL="<neon-pooled-url>" npm run db:seed
DATABASE_URL="<neon-pooled-url>" npm run data:selection
```

Yönetici hesabı için seed'i `ADMIN_EMAIL` ve `ADMIN_PASSWORD` ile çalıştırın;
hesap oluştuktan sonra bu iki değişkeni Vercel'den silin.

### 4 — Görseller

1,6 GB'lık medya deploy paketine giremez; Blob'a taşınır:

```bash
BLOB_READ_WRITE_TOKEN="..." npm run media:push
```

Kesilirse tekrar çalıştırın, yüklenmiş dosyalar atlanır. Bitince Blob store'un
public adresini `NEXT_PUBLIC_MEDIA_BASE` olarak girin
(`https://<store-id>.public.blob.vercel-storage.com/media`).

Medya yuvalarını (kategori kapağı, sayfa görseli) Blob adresine göre yeniden
yazmak için:

```bash
DATABASE_URL="<neon-url>" NEXT_PUBLIC_MEDIA_BASE="<blob-url>/media" npm run media:seed -- --force
```

### 5 — Alan adı

**Hostinger hPanel → DNS**: Vercel'in verdiği A / CNAME kayıtlarını girin.
Kurumsal e-posta Hostinger'da kalır, dokunmayın.

### 6 — Yayın sonrası kontrol

- [ ] `https://thechampb2b.com/tr` açılıyor, hero videosu oynuyor
- [ ] Katalogda görseller geliyor (Blob'dan)
- [ ] 4 dil ve Arapça RTL çalışıyor
- [ ] `/admin` girişi çalışıyor, Medya ekranından dosya yüklenebiliyor
- [ ] Teklif formu gönderiliyor ve kurumsal e-postaya düşüyor
- [ ] `robots.txt` ve `sitemap.xml` doğru alan adını gösteriyor
- [ ] QR kodla telefondan açınca ilk ekranda marka mesajı + MOQ + iki CTA var
- [ ] Google Search Console'a `sitemap.xml` gönderildi

### Bilinen sınırlar

- **PDF katalog** ~8 MB ve ~7 sn sürüyor. Route `maxDuration = 60` ile
  işaretlendi. Vercel Hobby'de sınıra takılırsa kategori bazlı kataloglar
  (`?category=tshirts`) kullanılabilir.
- **Fiyatlar boş.** Bilinçli karar (brief §7). Panel → Excel yükle veya
  Toplu düzenleme ile girilince tablolar kendiliğinden görünür.
- **Vercel Blob ücretsiz katmanı** 1 GB depolama verir; medya 1,46 GB.
  Yükleme öncesi katmanı yükseltin ya da `--only=thumb,card,pdf,hero` ile
  `full` boyutu hariç tutun (detay sayfası `card` boyutunu kullanır, kalite
  bir tık düşer ama 924 MB tasarruf edilir).

---

## Kararlar ve sapmalar

- **Next.js 16** kullanıldı (brief'te 15 yazıyor). 16 şu anki stabil sürüm;
  App Router yapısı aynı, next-intl ve shadcn/ui destekliyor.
- **Ürün açıklamaları yeniden yazıldı.** Kaynaktaki Türkçe açıklamalar perakende
  pazaryeri metniydi; toptan alıcı için değeri yoktu. Yerine ürünün yapısal
  verisinden (kumaş, gramaj, renk, beden, özelleştirme, MOQ) 4 dilde teknik
  B2B metni üretiliyor (`scripts/lib/describe.ts`).
- **Arapça PDF gövdesi İngilizce.** PDF motoru Arapça harf birleştirmesini
  desteklemiyor; sitenin Arapça tarafı tam çeviridir.
- **Yerel veritabanı gömülü PostgreSQL.** `prisma dev` Windows'ta `next build`
  işçilerinin eşzamanlı bağlantı yükü altında bağlantı düşürüyordu.
- **Skill'ler kuruldu** (brief §0): 44/44, `/plugin` yerine depolar doğrudan
  klonlanarak. Ayrıntı ve bu projede nereye uygulandıkları:
  `.claude/skills/README.md`.
- **`--text-faint` tokeni değiştirildi.** Brief §3.1'deki `#5C5E65` ölçüldüğünde
  her zeminde WCAG AA'nın altında kaldı (2.87:1); ürün kodları bu tokenla
  basıldığı için okunabilir olması gerekiyordu. Dark `#7F828C`, light `#75767B`
  ile 4.5:1 üstüne çıkarıldı.
- **Krom yazılarda ışık animasyonu var.** Brief §3.3 "sadece transform ve
  opacity" diyor; `background-position` animasyonu kullanıcı isteğiyle bilinçli
  bir istisna. `prefers-reduced-motion` altında durur.
