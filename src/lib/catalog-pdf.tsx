import "server-only";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import type { AppLocale } from "@/lib/locales";
import { resolvePrices, TIERS } from "@/lib/price";

/**
 * PDF katalog — brief §12.
 * Kapak → firma özeti → kategori başına ürün sayfaları → arka kapak.
 * Üretimi ağır olduğu için sonuç route seviyesinde önbelleğe alınır.
 *
 * Not: @react-pdf/renderer WebP okumaz; ürün görselleri
 * `public/media/pdf/{code}.jpg` dosyalarından gelir (scripts/pdf-thumbs.ts).
 */

const COPY: Record<
  AppLocale,
  {
    catalogue: string;
    wholesale: string;
    intro: string;
    capabilities: string;
    capabilityList: string[];
    terms: string;
    termsList: (v: Record<string, number>) => string[];
    code: string;
    colours: string;
    sizes: string;
    priceHeader: string;
    requestPrice: string;
    exw: string;
    priceNote: string;
    contact: string;
    page: string;
    products: string;
  }
> = {
  en: {
    catalogue: "PRODUCT CATALOGUE",
    wholesale: "WHOLESALE · PRIVATE LABEL · OEM",
    intro:
      "The Champ Global is a Turkish knitwear manufacturer combining textile production with design, brand management and e-commerce experience. From fabric development to production, packaging and channel positioning, the entire process is managed within a single ecosystem.",
    capabilities: "CAPABILITIES",
    capabilityList: [
      "Knitting and fabric development",
      "Cutting, sewing and in-line quality control",
      "Screen print, DTG, transfer, embroidery",
      "Pressing, finishing and final inspection",
      "Packaging, labelling and shipment preparation",
      "Private label: woven labels, care labels, hangtags",
    ],
    terms: "COMMERCIAL TERMS",
    termsList: (v) => [
      `Minimum order ${v.moq} pcs per style`,
      `Custom logo print from ${v.logo} pcs`,
      `Custom design from ${v.design} pcs`,
      `Product and care label change from ${v.label} pcs`,
      "Shipping cost belongs to the buyer",
      "Logistics support available",
    ],
    code: "Code",
    colours: "Colours",
    sizes: "Sizes",
    priceHeader: "Unit price (USD)",
    requestPrice: "Request price",
    exw: "EXW Istanbul · excluding VAT and shipping",
    priceNote:
      "Prices may vary depending on order quantity, product specifications, customization and delivery terms. Please contact us for a final quotation.",
    contact: "CONTACT",
    page: "Page",
    products: "products",
  },
  tr: {
    catalogue: "ÜRÜN KATALOĞU",
    wholesale: "TOPTAN · PRIVATE LABEL · OEM",
    intro:
      "The Champ Global, tekstil üretimini tasarım, marka yönetimi ve e-ticaret deneyimiyle birleştiren Türk örme tekstil üreticisidir. Kumaş geliştirmeden üretime, paketlemeden kanal konumlandırmasına kadar tüm süreç tek bir ekosistem içinde yönetilir.",
    capabilities: "KABİLİYETLER",
    capabilityList: [
      "Örme ve kumaş geliştirme",
      "Kesim, dikim ve ara kalite kontrolleri",
      "Serigrafi, DTG, transfer, nakış",
      "Ütü, son işlemler ve final kontrol",
      "Paketleme, etiketleme ve sevkiyata hazırlık",
      "Private label: dokuma etiket, bakım etiketi, karton etiket",
    ],
    terms: "TİCARİ ŞARTLAR",
    termsList: (v) => [
      `Model başına minimum sipariş ${v.moq} adet`,
      `${v.logo} adetten özel logo baskı`,
      `${v.design} adetten özel tasarım`,
      `${v.label} adetten ürün ve bakım etiketi değişimi`,
      "Nakliye masrafı alıcıya aittir",
      "Lojistik desteği mevcut",
    ],
    code: "Kod",
    colours: "Renkler",
    sizes: "Bedenler",
    priceHeader: "Birim fiyat (USD)",
    requestPrice: "Fiyat iste",
    exw: "EXW İstanbul · KDV ve nakliye hariç",
    priceNote:
      "Fiyatlar sipariş adedine, ürün özelliklerine, özelleştirmeye ve teslim şartlarına göre değişebilir. Kesin teklif için bizimle iletişime geçin.",
    contact: "İLETİŞİM",
    page: "Sayfa",
    products: "ürün",
  },
  de: {
    catalogue: "PRODUKTKATALOG",
    wholesale: "GROSSHANDEL · PRIVATE LABEL · OEM",
    intro:
      "The Champ Global ist ein türkischer Strickwarenhersteller, der Textilproduktion mit Design, Markenführung und E-Commerce-Erfahrung verbindet. Von der Stoffentwicklung über die Produktion und Verpackung bis zur Kanalpositionierung wird der gesamte Prozess in einem Ökosystem gesteuert.",
    capabilities: "KAPAZITÄTEN",
    capabilityList: [
      "Stricken und Stoffentwicklung",
      "Zuschnitt, Näherei und In-line-Qualitätskontrolle",
      "Siebdruck, DTG, Transfer, Stickerei",
      "Bügeln, Finishing und Endkontrolle",
      "Verpackung, Etikettierung und Versandvorbereitung",
      "Private Label: Webetiketten, Pflegeetiketten, Hangtags",
    ],
    terms: "HANDELSBEDINGUNGEN",
    termsList: (v) => [
      `Mindestbestellmenge ${v.moq} Stück pro Modell`,
      `Individueller Logodruck ab ${v.logo} Stück`,
      `Sonderdesign ab ${v.design} Stück`,
      `Produkt- und Pflegeetikettwechsel ab ${v.label} Stück`,
      "Die Versandkosten trägt der Käufer",
      "Logistikunterstützung verfügbar",
    ],
    code: "Code",
    colours: "Farben",
    sizes: "Größen",
    priceHeader: "Stückpreis (USD)",
    requestPrice: "Preis anfragen",
    exw: "EXW Istanbul · zzgl. MwSt. und Versand",
    priceNote:
      "Die Preise können je nach Bestellmenge, Produktspezifikation, Anpassung und Lieferbedingungen abweichen. Für ein verbindliches Angebot kontaktieren Sie uns bitte.",
    contact: "KONTAKT",
    page: "Seite",
    products: "Produkte",
  },
  ar: {
    // PDF'te Arapça harf birleştirme desteklenmediği için AR kataloğu
    // İngilizce gövdeyle üretilir; site tarafı tam Arapçadır.
    catalogue: "PRODUCT CATALOGUE",
    wholesale: "WHOLESALE · PRIVATE LABEL · OEM",
    intro:
      "The Champ Global is a Turkish knitwear manufacturer combining textile production with design, brand management and e-commerce experience.",
    capabilities: "CAPABILITIES",
    capabilityList: [
      "Knitting and fabric development",
      "Cutting, sewing and in-line quality control",
      "Screen print, DTG, transfer, embroidery",
      "Pressing, finishing and final inspection",
      "Packaging, labelling and shipment preparation",
      "Private label: woven labels, care labels, hangtags",
    ],
    terms: "COMMERCIAL TERMS",
    termsList: (v) => [
      `Minimum order ${v.moq} pcs per style`,
      `Custom logo print from ${v.logo} pcs`,
      `Custom design from ${v.design} pcs`,
      `Product and care label change from ${v.label} pcs`,
      "Shipping cost belongs to the buyer",
      "Logistics support available",
    ],
    code: "Code",
    colours: "Colours",
    sizes: "Sizes",
    priceHeader: "Unit price (USD)",
    requestPrice: "Request price",
    exw: "EXW Istanbul · excluding VAT and shipping",
    priceNote:
      "Prices may vary depending on order quantity, product specifications, customization and delivery terms. Please contact us for a final quotation.",
    contact: "CONTACT",
    page: "Page",
    products: "products",
  },
};

const s = StyleSheet.create({
  cover: { backgroundColor: "#0A0A0B", color: "#F5F5F7", padding: 56, height: "100%" },
  coverEyebrow: { fontSize: 8, letterSpacing: 2, color: "#8B8D93", marginBottom: 180 },
  coverBrand: { fontSize: 30, fontWeight: 700, letterSpacing: -0.6 },
  coverTagline: { fontSize: 20, fontWeight: 700, color: "#C9CBD4", marginTop: 8 },
  coverSub: { fontSize: 9, letterSpacing: 1.6, color: "#8B8D93", marginTop: 26 },
  coverFooter: { position: "absolute", left: 56, right: 56, bottom: 48 },
  coverContact: { fontSize: 9, color: "#8B8D93", lineHeight: 1.7 },

  page: { backgroundColor: "#FFFFFF", color: "#0A0A0B", paddingTop: 44, paddingBottom: 52, paddingHorizontal: 44 },
  h1: { fontSize: 17, fontWeight: 700, letterSpacing: -0.3 },
  h2: { fontSize: 8, letterSpacing: 1.8, color: "#6B6D73", marginBottom: 10 },
  body: { fontSize: 9, lineHeight: 1.65, color: "#3F4046" },
  bullet: { fontSize: 9, lineHeight: 1.75, color: "#3F4046", marginBottom: 2 },

  catHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#0A0A0B",
    paddingBottom: 8,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  catCount: { fontSize: 8, color: "#6B6D73" },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { width: "31.4%", marginBottom: 14 },
  cardImage: { width: "100%", height: 132, objectFit: "cover", backgroundColor: "#F2F2F3" },
  cardCode: { fontSize: 6.5, color: "#9A9CA3", marginTop: 5, letterSpacing: 0.3 },
  cardName: { fontSize: 8, fontWeight: 500, marginTop: 2, lineHeight: 1.3 },
  cardMeta: { fontSize: 6.5, color: "#6B6D73", marginTop: 3, lineHeight: 1.45 },
  cardPrice: { fontSize: 7, marginTop: 4, color: "#0A0A0B" },
  cardPriceMuted: { fontSize: 7, marginTop: 4, color: "#9A9CA3" },

  footer: {
    position: "absolute",
    bottom: 26,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#9A9CA3",
  },

  back: { backgroundColor: "#0A0A0B", color: "#F5F5F7", padding: 56, height: "100%" },
  backTitle: { fontSize: 22, fontWeight: 700, marginBottom: 22 },
  backText: { fontSize: 9, lineHeight: 1.8, color: "#8B8D93" },
  backNote: { fontSize: 7.5, lineHeight: 1.65, color: "#5C5E65", marginTop: 24 },
});

export type PdfProduct = {
  productCode: string;
  name: string;
  colours: string[];
  sizeRange: string | null;
  prices: { tier: number; value: number | null }[];
  imagePath: string | null;
};

export type PdfCategory = { slug: string; name: string; products: PdfProduct[] };

export type PdfInput = {
  locale: AppLocale;
  categories: PdfCategory[];
  settings: {
    inquiryEmail: string;
    phone: string;
    address: string;
    siteUrl: string;
    moqPieces: number;
    logoPrintFrom: number;
    customDesignFrom: number;
    labelChangeFrom: number;
  };
};

/** Dosya sistemindeki JPEG'i base64 data URI'ye çevirir (react-pdf yolu okuyamıyor). */
function imageData(path: string | null): string | null {
  if (!path) return null;
  try {
    const buffer = readFileSync(path);
    return `data:image/jpeg;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

function CatalogDocument({ locale, categories, settings }: PdfInput) {
  const t = COPY[locale];
  const total = categories.reduce((a, c) => a + c.products.length, 0);
  const year = new Date().getFullYear();

  return (
    <Document
      title={`THE CHAMP GLOBAL — ${t.catalogue}`}
      author="THE CHAMP GLOBAL"
      subject={t.wholesale}
    >
      {/* --------------------------------------------------------- kapak */}
      <Page size="A4" style={s.cover}>
        <Text style={s.coverEyebrow}>{t.wholesale}</Text>
        <Text style={s.coverBrand}>THE CHAMP GLOBAL</Text>
        <Text style={s.coverTagline}>BEYOND WHAT&apos;S NEXT.</Text>
        <Text style={s.coverSub}>{t.catalogue}</Text>
        <View style={s.coverFooter}>
          <Text style={s.coverContact}>
            {settings.siteUrl.replace(/^https?:\/\//, "")}
            {"\n"}
            {settings.inquiryEmail}
            {"\n"}
            {settings.phone}
            {"\n"}
            {settings.address}
          </Text>
        </View>
      </Page>

      {/* ------------------------------------------- firma özeti ve şartlar */}
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>THE CHAMP GLOBAL</Text>
        <Text style={[s.body, { marginTop: 12, marginBottom: 26 }]}>{t.intro}</Text>

        <Text style={s.h2}>{t.capabilities}</Text>
        <View style={{ marginBottom: 26 }}>
          {t.capabilityList.map((line) => (
            <Text key={line} style={s.bullet}>
              — {line}
            </Text>
          ))}
        </View>

        <Text style={s.h2}>{t.terms}</Text>
        <View>
          {t
            .termsList({
              moq: settings.moqPieces,
              logo: settings.logoPrintFrom,
              design: settings.customDesignFrom,
              label: settings.labelChangeFrom,
            })
            .map((line) => (
              <Text key={line} style={s.bullet}>
                — {line}
              </Text>
            ))}
          <Text style={[s.bullet, { marginTop: 8, color: "#6B6D73" }]}>{t.exw}</Text>
        </View>

        <Text style={[s.body, { marginTop: 26, color: "#6B6D73", fontSize: 7.5 }]}>
          {t.priceNote}
        </Text>

        <View style={s.footer} fixed>
          <Text>THE CHAMP GLOBAL — {t.catalogue}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${t.page} ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>

      {/* ------------------------------------------ kategori başına ürünler */}
      {categories.map((category) => (
        <Page key={category.slug} size="A4" style={s.page} wrap>
          <View style={s.catHeader}>
            <Text style={s.h1}>{category.name}</Text>
            <Text style={s.catCount}>
              {category.products.length} {t.products}
            </Text>
          </View>

          <View style={s.grid}>
            {category.products.map((product) => {
              const image = imageData(product.imagePath);
              const hasPrice = product.prices.some((p) => p.value !== null);
              return (
                <View key={product.productCode} style={s.card} wrap={false}>
                  {image ? (
                    <Image src={image} style={s.cardImage} />
                  ) : (
                    <View style={s.cardImage} />
                  )}
                  <Text style={s.cardCode}>{product.productCode}</Text>
                  <Text style={s.cardName}>{product.name}</Text>
                  <Text style={s.cardMeta}>
                    {t.colours}: {product.colours.slice(0, 4).join(", ")}
                    {product.colours.length > 4 ? ` +${product.colours.length - 4}` : ""}
                    {product.sizeRange ? `\n${t.sizes}: ${product.sizeRange}` : ""}
                  </Text>
                  {hasPrice ? (
                    <Text style={s.cardPrice}>
                      {product.prices
                        .filter((p) => p.value !== null)
                        .map((p) => `${p.tier}+ $${p.value?.toFixed(2)}`)
                        .join("  ")}
                    </Text>
                  ) : (
                    <Text style={s.cardPriceMuted}>{t.requestPrice}</Text>
                  )}
                </View>
              );
            })}
          </View>

          <View style={s.footer} fixed>
            <Text>{t.exw}</Text>
            <Text
              render={({ pageNumber, totalPages }) =>
                `${t.page} ${pageNumber} / ${totalPages}`
              }
            />
          </View>
        </Page>
      ))}

      {/* ---------------------------------------------------- arka kapak */}
      <Page size="A4" style={s.back}>
        <Text style={s.backTitle}>{t.contact}</Text>
        <Text style={s.backText}>
          {settings.inquiryEmail}
          {"\n"}
          {settings.phone}
          {"\n"}
          {settings.address}
          {"\n"}
          {settings.siteUrl.replace(/^https?:\/\//, "")}
        </Text>

        <Text style={[s.backText, { marginTop: 34 }]}>
          {t.termsList({
            moq: settings.moqPieces,
            logo: settings.logoPrintFrom,
            design: settings.customDesignFrom,
            label: settings.labelChangeFrom,
          }).join("\n")}
        </Text>

        <Text style={s.backNote}>
          {t.exw}
          {"\n\n"}
          {t.priceNote}
        </Text>

        <View style={{ position: "absolute", left: 56, bottom: 48 }}>
          <Text style={{ fontSize: 15, fontWeight: 700, color: "#C9CBD4" }}>
            WE DON&apos;T FOLLOW THE FUTURE.
          </Text>
          <Text style={{ fontSize: 15, fontWeight: 700, color: "#C9CBD4" }}>
            WE CREATE WHAT COMES NEXT.
          </Text>
          <Text style={{ fontSize: 7.5, color: "#5C5E65", marginTop: 14 }}>
            © {year} THE CHAMP GLOBAL · {total} {t.products}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderCatalogPdf(input: PdfInput): Promise<Buffer> {
  return renderToBuffer(<CatalogDocument {...input} />);
}

/** Ürünün PDF görseli için dosya yolu. */
export function pdfImagePath(productCode: string): string {
  return resolve(process.cwd(), "public/media/pdf", `${productCode}.jpg`);
}

export { resolvePrices, TIERS };
