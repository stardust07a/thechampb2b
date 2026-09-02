"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { saveProduct, type ActionResult } from "@/app/admin/actions/products";
import { LOCALES, LOCALE_NAMES, type AppLocale } from "@/lib/locales";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export type ProductFormData = {
  id?: string;
  productCode: string;
  modelCode: string;
  slug: string;
  categoryId: string;
  categorySlug: string;
  subcategory: string;
  section: string;
  audience: string;
  status: string;
  gsm: string;
  moq: string;
  leadTimeDays: string;
  privateLabel: "inherit" | "yes" | "no";
  price100: string;
  price300: string;
  price500: string;
  price1000: string;
  isBestSeller: boolean;
  isFeatured: boolean;
  isNew: boolean;
  sortOrder: number;
  fabric: Record<string, string>;
  packaging: Record<string, string>;
  printType: Record<string, string>;
  translations: Record<
    string,
    {
      name: string;
      shortDescription: string;
      description: string;
      seoTitle: string;
      seoDescription: string;
    }
  >;
  variants: { color: string; colorHex: string | null; sizes: string[]; images: string[] }[];
  /** Sadece panelde görünür — public API'ye asla çıkmaz (brief §6.2/6). */
  internal: { sourceUrl: string | null; retailTry: string | null; warnings: string[] };
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="solid" size="md" disabled={pending}>
      {pending ? "Kaydediliyor…" : "Kaydet"}
    </Button>
  );
}

export function ProductForm({
  product,
  categories,
}: {
  product: ProductFormData;
  categories: { id: string; slug: string; name: string }[];
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    async (prev, formData) => {
      const result = await saveProduct(prev, formData);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      return result;
    },
    null,
  );
  const [tab, setTab] = useState<AppLocale>("tr");
  const fieldError = (key: string) => (state?.ok === false ? state.fields?.[key] : undefined);

  return (
    <form action={action} className="space-y-8">
      {product.id ? <input type="hidden" name="id" value={product.id} /> : null}

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* -------------------------------------------------- temel bilgiler */}
        <section className="space-y-5 rounded-[--radius-card] border border-line bg-surface p-6">
          <h2 className="eyebrow">Temel bilgiler</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="productCode">Ürün kodu</Label>
              <Input
                id="productCode"
                name="productCode"
                defaultValue={product.productCode}
                className="tabular"
                required
              />
              <FieldError>{fieldError("productCode")}</FieldError>
            </div>
            <div>
              <Label htmlFor="modelCode">Model kodu</Label>
              <Input
                id="modelCode"
                name="modelCode"
                defaultValue={product.modelCode}
                className="tabular"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input id="slug" name="slug" defaultValue={product.slug} className="tabular" required />
            <FieldError>{fieldError("slug")}</FieldError>
            {product.id ? (
              <Link
                href={`/tr/products/${product.categorySlug}/${product.slug}`}
                target="_blank"
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg"
              >
                Sitede aç
                <ExternalLink className="size-3" aria-hidden />
              </Link>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="categoryId">Kategori</Label>
              <Select id="categoryId" name="categoryId" defaultValue={product.categoryId} required>
                <option value="">Seçin</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <FieldError>{fieldError("categoryId")}</FieldError>
            </div>
            <div>
              <Label htmlFor="subcategory">Alt kategori</Label>
              <Input
                id="subcategory"
                name="subcategory"
                defaultValue={product.subcategory}
                placeholder="Oversize, Hoodie, Printed…"
              />
            </div>
            <div>
              <Label htmlFor="section">Bölüm</Label>
              <Select id="section" name="section" defaultValue={product.section}>
                <option value="Women">Kadın</option>
                <option value="Men">Erkek</option>
                <option value="Unisex">Unisex</option>
                <option value="Kids">Çocuk</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="audience">Hedef</Label>
              <Select id="audience" name="audience" defaultValue={product.audience}>
                <option value="adult">Yetişkin</option>
                <option value="kids">Çocuk</option>
              </Select>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------- yayın ve rozetler */}
        <section className="space-y-5 rounded-[--radius-card] border border-line bg-surface p-6">
          <h2 className="eyebrow">Yayın</h2>

          <div>
            <Label htmlFor="status">Durum</Label>
            <Select id="status" name="status" defaultValue={product.status}>
              <option value="published">Yayında</option>
              <option value="draft">Taslak</option>
              <option value="archived">Arşiv</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="sortOrder">Sıra</Label>
            <Input
              id="sortOrder"
              name="sortOrder"
              type="number"
              defaultValue={product.sortOrder}
              className="tabular"
            />
          </div>

          <fieldset className="space-y-2.5">
            <legend className="mb-2 text-sm font-medium text-muted">Ana sayfa rozetleri</legend>
            {[
              { name: "isBestSeller", label: "Best Seller", checked: product.isBestSeller },
              { name: "isFeatured", label: "Featured", checked: product.isFeatured },
              { name: "isNew", label: "New Arrival", checked: product.isNew },
            ].map((b) => (
              <label key={b.name} className="flex items-center gap-3 text-sm text-fg">
                <input
                  type="checkbox"
                  name={b.name}
                  defaultChecked={b.checked}
                  className="size-4 rounded-[4px] border-line bg-surface-2 accent-[var(--chrome-2)]"
                />
                {b.label}
              </label>
            ))}
          </fieldset>
        </section>
      </div>

      {/* -------------------------------------------------------- fiyatlar */}
      <section className="rounded-[--radius-card] border border-line bg-surface p-6">
        <h2 className="eyebrow mb-1">Fiyatlar (USD, birim)</h2>
        <p className="mb-5 text-xs text-muted">
          Boş bırakılan kademe için kategori varsayılanı kullanılır. Hiçbiri yoksa sitede
          &quot;Fiyat iste&quot; görünür.
        </p>
        <div className="grid gap-4 sm:grid-cols-4">
          {(["price100", "price300", "price500", "price1000"] as const).map((key) => (
            <div key={key}>
              <Label htmlFor={key}>{key.replace("price", "")}+ adet</Label>
              <Input
                id={key}
                name={key}
                inputMode="decimal"
                defaultValue={product[key]}
                placeholder="—"
                className="tabular"
              />
              <FieldError>{fieldError(key)}</FieldError>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- üretim bilgisi */}
      <section className="rounded-[--radius-card] border border-line bg-surface p-6">
        <h2 className="eyebrow mb-1">Üretim bilgisi</h2>
        <p className="mb-5 text-xs text-muted">
          Boş bırakılan alan kategori varsayılanından devralınır.
        </p>

        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <Label htmlFor="gsm">Gramaj (gsm)</Label>
            <Input
              id="gsm"
              name="gsm"
              inputMode="numeric"
              defaultValue={product.gsm}
              className="tabular"
            />
            <FieldError>{fieldError("gsm")}</FieldError>
          </div>
          <div>
            <Label htmlFor="moq">MOQ (adet)</Label>
            <Input
              id="moq"
              name="moq"
              inputMode="numeric"
              defaultValue={product.moq}
              className="tabular"
            />
          </div>
          <div>
            <Label htmlFor="leadTimeDays">Termin (gün)</Label>
            <Input
              id="leadTimeDays"
              name="leadTimeDays"
              defaultValue={product.leadTimeDays}
              placeholder="30-40"
              className="tabular"
            />
          </div>
          <div>
            <Label htmlFor="privateLabel">Private label</Label>
            <Select id="privateLabel" name="privateLabel" defaultValue={product.privateLabel}>
              <option value="inherit">Kategoriden devral</option>
              <option value="yes">Mümkün</option>
              <option value="no">Mümkün değil</option>
            </Select>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {(
            [
              { prefix: "fabric", label: "Kumaş", values: product.fabric },
              { prefix: "packaging", label: "Paketleme", values: product.packaging },
              { prefix: "printType", label: "Baskı ve markalama", values: product.printType },
            ] as const
          ).map((group) => (
            <div key={group.prefix}>
              <Label htmlFor={`${group.prefix}.${tab}`}>
                {group.label} — {LOCALE_NAMES[tab]}
              </Label>
              {LOCALES.map((locale) => (
                <Input
                  key={locale}
                  id={`${group.prefix}.${locale}`}
                  name={`${group.prefix}.${locale}`}
                  defaultValue={group.values[locale] ?? ""}
                  dir={locale === "ar" ? "rtl" : "ltr"}
                  className={locale === tab ? "" : "hidden"}
                />
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ 4 dilde metinler */}
      <section className="rounded-[--radius-card] border border-line bg-surface p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <h2 className="eyebrow">İçerik ve SEO</h2>
          <div role="tablist" className="flex gap-1.5" aria-label="Dil">
            {LOCALES.map((locale) => (
              <button
                key={locale}
                type="button"
                role="tab"
                aria-selected={tab === locale}
                onClick={() => setTab(locale)}
                className={cn(
                  "rounded-[--radius-pill] px-3.5 py-1.5 text-xs font-medium transition-colors",
                  tab === locale
                    ? "bg-solid text-on-solid"
                    : "border border-line text-muted hover:text-fg",
                )}
              >
                {LOCALE_NAMES[locale]}
              </button>
            ))}
          </div>
        </div>

        {LOCALES.map((locale) => {
          const t = product.translations[locale] ?? {
            name: "",
            shortDescription: "",
            description: "",
            seoTitle: "",
            seoDescription: "",
          };
          const rtl = locale === "ar";
          return (
            <div key={locale} className={cn("space-y-4", locale === tab ? "" : "hidden")}>
              <div>
                <Label htmlFor={`name.${locale}`}>Ürün adı</Label>
                <Input
                  id={`name.${locale}`}
                  name={`name.${locale}`}
                  defaultValue={t.name}
                  dir={rtl ? "rtl" : "ltr"}
                />
              </div>
              <div>
                <Label htmlFor={`shortDescription.${locale}`}>Kısa açıklama</Label>
                <Textarea
                  id={`shortDescription.${locale}`}
                  name={`shortDescription.${locale}`}
                  defaultValue={t.shortDescription}
                  dir={rtl ? "rtl" : "ltr"}
                  className="min-h-20"
                />
              </div>
              <div>
                <Label htmlFor={`description.${locale}`}>Uzun açıklama</Label>
                <Textarea
                  id={`description.${locale}`}
                  name={`description.${locale}`}
                  defaultValue={t.description}
                  dir={rtl ? "rtl" : "ltr"}
                  className="min-h-40"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor={`seoTitle.${locale}`}>SEO başlığı</Label>
                  <Input
                    id={`seoTitle.${locale}`}
                    name={`seoTitle.${locale}`}
                    defaultValue={t.seoTitle}
                    dir={rtl ? "rtl" : "ltr"}
                  />
                </div>
                <div>
                  <Label htmlFor={`seoDescription.${locale}`}>SEO açıklaması</Label>
                  <Input
                    id={`seoDescription.${locale}`}
                    name={`seoDescription.${locale}`}
                    defaultValue={t.seoDescription}
                    dir={rtl ? "rtl" : "ltr"}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ------------------------------------------------ varyantlar (salt) */}
      {product.variants.length > 0 ? (
        <section className="rounded-[--radius-card] border border-line bg-surface p-6">
          <h2 className="eyebrow mb-1">Renkler ve görseller</h2>
          <p className="mb-5 text-xs text-muted">
            Varyantlar içe aktarmadan geldi. Görsel ekleme/silme ve sıralama bir sonraki
            sürümde bu ekrana gelecek.
          </p>
          <ul className="space-y-4">
            {product.variants.map((v) => (
              <li key={v.color} className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-2 text-sm text-fg">
                  <span
                    aria-hidden
                    className="size-4 rounded-full border border-line"
                    style={{ background: v.colorHex ?? "var(--surface-2)" }}
                  />
                  {v.color}
                </span>
                <span className="tabular text-xs text-faint">{v.sizes.join(" · ")}</span>
                <span className="ms-auto flex gap-1.5">
                  {v.images.slice(0, 6).map((key) => {
                    const src = mediaUrl(key, "thumb");
                    return src ? (
                      <span
                        key={key}
                        className="relative block aspect-[2/3] w-8 overflow-hidden rounded-[4px] bg-surface-2"
                      >
                        <Image src={src} alt="" fill sizes="32px" className="object-cover" />
                      </span>
                    ) : null;
                  })}
                  {v.images.length > 6 ? (
                    <span className="tabular self-center text-xs text-faint">
                      +{v.images.length - 6}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ------------------------------------------ dahili (asla public değil) */}
      {product.internal.sourceUrl || product.internal.warnings.length > 0 ? (
        <section className="rounded-[--radius-card] border border-line bg-surface p-6">
          <h2 className="eyebrow mb-1">Dahili kayıtlar</h2>
          <p className="mb-5 text-xs text-muted">
            Bu alanlar sadece panelde görünür; siteye, API yanıtlarına ve PDF kataloğa
            asla çıkmaz.
          </p>
          <dl className="space-y-3 text-sm">
            {product.internal.retailTry ? (
              <div className="flex gap-6">
                <dt className="w-40 shrink-0 text-muted">Perakende (TL)</dt>
                <dd className="tabular text-fg">{product.internal.retailTry}</dd>
              </div>
            ) : null}
            {product.internal.sourceUrl ? (
              <div className="flex gap-6">
                <dt className="w-40 shrink-0 text-muted">Kaynak</dt>
                <dd className="min-w-0 break-all">
                  <a
                    href={product.internal.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted underline underline-offset-4 hover:text-fg"
                  >
                    {product.internal.sourceUrl}
                  </a>
                </dd>
              </div>
            ) : null}
            {product.internal.warnings.length > 0 ? (
              <div className="flex gap-6">
                <dt className="w-40 shrink-0 text-muted">İçe aktarma uyarıları</dt>
                <dd className="text-danger">{product.internal.warnings.join(" · ")}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      <div className="sticky bottom-0 -mx-5 flex items-center gap-3 border-t border-line bg-bg/90 px-5 py-4 backdrop-blur-xl md:-mx-8 md:px-8">
        <Submit />
        <Button asChild variant="ghost" size="md">
          <Link href="/admin/products">Vazgeç</Link>
        </Button>
        {state?.ok === false ? (
          <span className="text-sm text-danger">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
