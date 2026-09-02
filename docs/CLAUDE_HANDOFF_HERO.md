# Claude handoff — homepage scroll-video hero

Bu değişiklik, kullanıcıyla birlikte seçilip onaylanan ana sayfa deneyimidir. Eski statik ürün görselli hero kaldırıldı; ana sayfanın geri kalan bölümleri korunarak yerine kaydırma kontrollü üretim videosu getirildi.

## Kullanıcının istediği davranış

- Hero, açık ve koyu site temasında da sinematik koyu görünür. Hero bittikten sonra sayfa normal seçili temaya devam eder.
- Video otomatik oynatılmaz. Kullanıcı aşağı/yukarı kaydırdıkça video ileri/geri sarar.
- Masaüstünde yaklaşık 2.500 px kaydırma mesafesi vardır: beş anlatım aşaması başına yaklaşık 500 px.
- Aşamalar: Source, Develop, Produce, Brand, Deliver. Metin videonun içine gömülü değildir; erişilebilir ve çevrilebilir HTML katmanıdır.
- İlk dört aşamada yalnızca aşama numarası, adı ve kısa açıklaması görünür. Ana satış mesajı `YOUR BRAND. BUILT HERE.`, marka üst bilgisi, açıklama ve CTA butonları yalnızca son `Deliver` aşamasında güçlü bir final olarak açılır. Bu sıralama, kullanıcıya sayfanın gerçekten ilerlediği hissini vermek için bilinçli olarak seçildi.
- Hero üst bilgisindeki minimum sipariş değeri kullanıcı talebiyle tüm dillerde `MOQ 500` olarak sabitlendi. Türkçe, Almanca ve Arapça final başlıkları kendi yazı ölçülerine göre ayrı genişlik/satır yüksekliği kuralları kullanır; bu dil kurallarını kaldırmak başlıkların tekrar üst üste binmesine yol açar.
- Sağdaki dikey çizgi grubu ilerlemeyi gösterir. Beş ana çizgi tıklanarak ilgili aşamaya gidilebilir.
- `Skip intro / Girişi atla` kontrolü, hero sonrasındaki `#home-content` güven şeridine iner.
- Mobilde çizgi grubu gizlenir ve kompakt bir atlama düğmesi kalır.
- `prefers-reduced-motion` açıkken scroll scrubbing kapatılır; son kare sabit görsel olarak gösterilir.

## Uygulama yapısı

- `src/components/site/hero.tsx`: Server Component; çevirileri hazırlar.
- `src/components/site/hero-experience.tsx`: Client Component; scroll ölçümü, video zamanını eşleme, aşama metinleri, ilerleme çizgileri ve atlama kontrolü.
- `src/app/[locale]/page.tsx`: Hero çağrısı ve atlama hedefi olan `#home-content`.
- `src/app/globals.css`: Tema bağımsız sinematik hero tokenları, sticky mesafe, scrim/vignette, metin geçişi ve reduced-motion davranışı.
- `messages/{en,tr,de,ar}.json`: Başlık, kontroller ve beş üretim aşamasının çevirileri.

## Medya

Kullanıcının onayladığı kaynak video web kullanımı için iki formata çevrildi:

- `public/media/hero/home-journey.webm` — VP9
- `public/media/hero/home-journey.mp4` — H.264 yedek kaynak
- `public/media/hero/home-journey-start.jpg` — video poster
- `public/media/hero/home-journey-final.jpg` — reduced-motion karesi

Video yaklaşık 7,04 saniyedir. Scroll ile eşleme sabit `VIDEO_DURATION` yedeğini kullanır; metadata geldiğinde gerçek video süresi alınır. Kaynakların sırası WebM, ardından MP4'tür. Kısa GOP, scroll sırasında kare aramayı daha akıcı yapmak için bilinçli seçilmiştir.

## Ayar noktaları

Video sahneleriyle metin eşikleri `hero-experience.tsx` içindeki `STAGE_THRESHOLDS`; tıklanabilir duraklar `STAGE_STOPS` dizisidir. Masaüstü kaydırma mesafesi `globals.css` içindeki `.cinema-hero-shell` değeridir. Bu değerleri değiştirirken video sahneleriyle metinlerin aynı noktada kalmasını birlikte kontrol et.

Bu hero kullanıcı tarafından özellikle seçildi. Daha sonraki düzenlemelerde eski ürün görselli hero'ya geri dönme veya ana sayfanın kalan bölümlerini kaldırma; kullanıcı açıkça yeni bir yön istemedikçe mevcut davranışı koru.

## Yerel ağdan geliştirme önizlemesi

Site geliştirme sırasında aynı ağdaki telefon ve bilgisayarlardan `http://192.168.2.24:3000` adresiyle de test ediliyor. `next.config.ts` içindeki `allowedDevOrigins: ["192.168.2.24"]` ayarı, LAN adresinde dev asset/HMR isteklerinin engellenmemesi için gereklidir. Bu ayarı kaldırmayın; makinenin yerel IP adresi değişirse yeni adresi listeye ekleyin ve geliştirme sunucusunu yeniden başlatın.

## Ana sayfa dikey video şeridi

Kullanıcının son kararıyla admin panelindeki `video:1`–`video:8` yuvaları artık Üretim sayfasındaki “Üretimden kareler” bölümü değildir. Bu videolar yalnızca ana sayfada, **“Markanıza özel üretim” bannerı ile “Ne Yapıyoruz” bölümü arasında** gösterilir. Kullanıcı özellikle bu iki bölüm arasını işaret etti; şeridi scroll-video hero'nun hemen altına taşımayın.

- Veri kaynağı değişmedi: `getVideos()` ve admin panelindeki mevcut video yükleme alanları kullanılır.
- Ana sayfa yerleşimi `src/app/[locale]/page.tsx` içindedir. Şerit `banner2`/ürün raylarından sonra ve `EcosystemStrip` bileşeninden hemen önce render edilir. Video yoksa bölüm hiç render edilmez. `Skip intro` her durumda video şeridine değil, hero sonrasındaki güven şeridi `#home-content` hedefine iner.
- `src/components/site/video-reel.tsx` tam genişlikte yatay, snap'li bir video şerididir. Mobilde dokunarak, masaüstünde oklarla kayar; videolar sessiz ve döngülü başlar, her kartın kendi ses düğmesi vardır.
- Tek veya iki video varsa kartlar ortalanır. Yeni videolar admin panelinden eklendikçe kod değişmeden otomatik yan yana gelir.
- Üretim sayfası artık `getVideos()` çağırmaz ve `VideoReel` render etmez. Bu yerleşimi tekrar Üretim sayfasına taşımayın; kullanıcı özellikle ana sayfada olmasını istedi.
- Admin medya ekranındaki açıklama da videoların yalnızca ana sayfada kullanıldığını söyleyecek şekilde güncellendi.

## Mobil hero videosu

- Telefonlarda `public/media/hero/home-journey-mobile.mp4` kullanılır. Kaynak, `hero-experience.tsx` içindeki ilk `<source>` olarak `(max-width: 767px)` medya koşuluyla seçilir.
- Masaüstü kaynakları `home-journey.webm` ve `home-journey.mp4` olarak korunur. Mobil kaynağı kaldırıp masaüstü videoyu telefonda yeniden kullanmayın; dikey kadraj özellikle kullanıcı tarafından seçildi.
- Mobil ve masaüstü video süreleri aynıdır; mevcut scroll aşamaları ve zaman eşikleri iki kaynakta da ortak çalışır.

## Responsive sayfa kahramanları ve güncel medya

`src/components/site/editorial-hero.tsx`, Ne Yapıyoruz, Üretim ve Hakkımızda sayfalarının ortak responsive kahramanıdır. Masaüstünde başlık ve açıklama görsel üzerinde kalır; telefonda yalnızca kısa başlık görsel üzerindedir, uzun açıklama görselin altındaki düz zemine geçer. Bu ayrım uzun metnin model/görselle üst üste binmesini önler.

Aktif medya yuvaları:

- `page:what-we-do:hero` → `/media/generated/what-we-do-hero-v2.webp`
- `page:manufacturing:hero` → `/media/generated/manufacturing-hero-v2.webp`
- `page:about:hero` → `/media/generated/about-hero-v2.webp`
- `page:home:banner2` → `/media/generated/home-capabilities-v2.webp`

Ana sayfa banner başlığı artık “Eskizden sevkiyata” değil, “Markanıza özel üretim”dir. Metinleri tekrar eski lojistik iddiasına çevirmeyin.

## Ürün galerisi ve ticari değerler

- `product-gallery.tsx` mobilde ana sayfayı yatay taşırmaz. Çok sayıdaki küçük görsel yalnızca kendi yatay, snap'li şeridinde kayar; ana görselde sayaç ile önceki/sonraki kontrolleri bulunur.
- Renk değiştiğinde galeri seçimi `product-buy-panel.tsx` içindeki `key={activeIndex}` ile ilk görsele döner.
- Güncel varsayılan ticari değerler: minimum sipariş 500, logo baskı 1.000, özel tasarım 1.000, etiket değişimi 1.000, numune 7–15 gün, toplu üretim 15–45 gün.
- Ana sayfa ve üretim sayfasındaki şart metinleri sabit sayı taşımaz; ayarları `getPublicSiteSettings()` üzerinden dinamik biçimde gösterir.
- `next.config.ts` içindeki `devIndicators: false`, LAN'daki telefon önizlemesinde Next.js geliştirme rozetinin tasarımın üstüne binmesini engeller.
