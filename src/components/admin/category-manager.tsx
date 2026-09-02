"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { deleteCategory, reorderCategories, saveCategory } from "@/app/admin/actions/catalog";
import type { ActionResult } from "@/app/admin/actions/products";
import { LOCALES, LOCALE_NAMES, type AppLocale } from "@/lib/locales";
import { cn } from "@/lib/utils";

export type CategoryRow = {
  id: string;
  slug: string;
  order: number;
  active: boolean;
  productCount: number;
  gsm: string;
  moq: string;
  leadTimeDays: string;
  privateLabel: boolean;
  price100: string;
  price300: string;
  price500: string;
  price1000: string;
  fabric: Record<string, string>;
  packaging: Record<string, string>;
  printType: Record<string, string>;
  names: Record<string, string>;
  descriptions: Record<string, string>;
  seoTitles: Record<string, string>;
  seoDescriptions: Record<string, string>;
};

function Submit({ label = "Kaydet" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="solid" size="md" disabled={pending}>
      {pending ? "Kaydediliyor…" : label}
    </Button>
  );
}

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [order, setOrder] = useState(categories.map((c) => c.id));
  const [pending, startTransition] = useTransition();

  const byId = new Map(categories.map((c) => [c.id, c]));
  const ordered = order.map((id) => byId.get(id)).filter((c): c is CategoryRow => Boolean(c));

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    startTransition(async () => {
      const result = await reorderCategories(next);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      router.refresh();
    });
  }

  function remove(category: CategoryRow) {
    if (!confirm(`"${category.names.tr || category.slug}" silinecek. Emin misiniz?`)) return;
    startTransition(async () => {
      const result = await deleteCategory(category.id);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      router.refresh();
    });
  }

  return (
    <div className={cn("space-y-4", pending && "opacity-70 transition-opacity")}>
      <ul className="space-y-3">
        {ordered.map((category, index) => (
          <li
            key={category.id}
            className="overflow-hidden rounded-[--radius-card] border border-line bg-surface"
          >
            <div className="flex flex-wrap items-center gap-3 p-4">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Yukarı taşı"
                  className="text-faint transition-colors hover:text-fg disabled:opacity-30"
                >
                  <ChevronUp className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === ordered.length - 1}
                  aria-label="Aşağı taşı"
                  className="text-faint transition-colors hover:text-fg disabled:opacity-30"
                >
                  <ChevronDown className="size-4" aria-hidden />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setOpen(open === category.id ? null : category.id)}
                className="min-w-0 flex-1 text-start"
                aria-expanded={open === category.id}
              >
                <span className="block text-fg">{category.names.tr || category.slug}</span>
                <span className="tabular block text-xs text-faint">
                  {category.slug} · {category.productCount} ürün
                  {category.active ? "" : " · pasif"}
                </span>
              </button>

              <span className="tabular text-xs text-faint">
                {category.price1000 ? `1000+ $${category.price1000}` : "fiyat yok"}
              </span>

              <button
                type="button"
                onClick={() => remove(category)}
                aria-label="Kategoriyi sil"
                className="size-8 rounded-[--radius-inner] text-faint transition-colors hover:bg-surface-2 hover:text-danger"
              >
                <Trash2 className="mx-auto size-4" aria-hidden />
              </button>
            </div>

            {open === category.id ? (
              <div className="border-t border-line bg-bg-2 p-6">
                <CategoryForm category={category} onDone={() => router.refresh()} />
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {creating ? (
        <div className="rounded-[--radius-card] border border-chrome-1 bg-surface p-6">
          <h2 className="eyebrow mb-5">Yeni kategori</h2>
          <CategoryForm
            onDone={() => {
              setCreating(false);
              router.refresh();
            }}
          />
        </div>
      ) : (
        <Button variant="outline" size="md" onClick={() => setCreating(true)}>
          <Plus aria-hidden />
          Yeni kategori
        </Button>
      )}
    </div>
  );
}

function CategoryForm({
  category,
  onDone,
}: {
  category?: CategoryRow;
  onDone: () => void;
}) {
  const [tab, setTab] = useState<AppLocale>("tr");
  const [state, action] = useActionState<ActionResult | null, FormData>(
    async (prev, formData) => {
      const result = await saveCategory(prev, formData);
      if (result.ok) {
        toast.success(result.message);
        onDone();
      } else {
        toast.error(result.message);
      }
      return result;
    },
    null,
  );

  return (
    <form action={action} className="space-y-6">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor={`slug-${category?.id ?? "new"}`}>Slug</Label>
          <Input
            id={`slug-${category?.id ?? "new"}`}
            name="slug"
            defaultValue={category?.slug ?? ""}
            className="tabular"
            required
          />
        </div>
        <div>
          <Label htmlFor={`order-${category?.id ?? "new"}`}>Sıra</Label>
          <Input
            id={`order-${category?.id ?? "new"}`}
            name="order"
            type="number"
            defaultValue={category?.order ?? 0}
            className="tabular"
          />
        </div>
        <div className="flex items-end gap-6 pb-2">
          <label className="flex items-center gap-2.5 text-sm text-fg">
            <input
              type="checkbox"
              name="active"
              defaultChecked={category?.active ?? true}
              className="size-4 rounded-[4px] border-line bg-surface-2 accent-[var(--chrome-2)]"
            />
            Aktif
          </label>
          <label className="flex items-center gap-2.5 text-sm text-fg">
            <input
              type="checkbox"
              name="privateLabel"
              defaultChecked={category?.privateLabel ?? true}
              className="size-4 rounded-[4px] border-line bg-surface-2 accent-[var(--chrome-2)]"
            />
            Private label
          </label>
        </div>
      </div>

      <fieldset>
        <legend className="eyebrow mb-3">Varsayılan fiyatlar (USD)</legend>
        <div className="grid gap-4 sm:grid-cols-4">
          {(["price100", "price300", "price500", "price1000"] as const).map((key) => (
            <div key={key}>
              <Label htmlFor={`${key}-${category?.id ?? "new"}`}>
                {key.replace("price", "")}+
              </Label>
              <Input
                id={`${key}-${category?.id ?? "new"}`}
                name={key}
                inputMode="decimal"
                defaultValue={category?.[key] ?? ""}
                placeholder="—"
                className="tabular"
              />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-3">Varsayılan üretim bilgisi</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor={`gsm-${category?.id ?? "new"}`}>Kumaş gramajı (g/m²)</Label>
            <Input
              id={`gsm-${category?.id ?? "new"}`}
              name="gsm"
              inputMode="numeric"
              defaultValue={category?.gsm ?? ""}
              className="tabular"
            />
          </div>
          <div>
            <Label htmlFor={`moq-${category?.id ?? "new"}`}>MOQ</Label>
            <Input
              id={`moq-${category?.id ?? "new"}`}
              name="moq"
              inputMode="numeric"
              defaultValue={category?.moq ?? ""}
              className="tabular"
            />
          </div>
          <div>
            <Label htmlFor={`lead-${category?.id ?? "new"}`}>Termin (gün)</Label>
            <Input
              id={`lead-${category?.id ?? "new"}`}
              name="leadTimeDays"
              defaultValue={category?.leadTimeDays ?? ""}
              placeholder="30-40"
              className="tabular"
            />
          </div>
        </div>
      </fieldset>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span className="eyebrow">İçerik — 4 dil</span>
          <div role="tablist" className="flex gap-1.5" aria-label="Dil">
            {LOCALES.map((locale) => (
              <button
                key={locale}
                type="button"
                role="tab"
                aria-selected={tab === locale}
                onClick={() => setTab(locale)}
                className={cn(
                  "rounded-[--radius-pill] px-3 py-1.5 text-xs font-medium transition-colors",
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
          const rtl = locale === "ar";
          const id = `${category?.id ?? "new"}-${locale}`;
          return (
            <div key={locale} className={cn("space-y-4", locale === tab ? "" : "hidden")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor={`name-${id}`}>Kategori adı</Label>
                  <Input
                    id={`name-${id}`}
                    name={`name.${locale}`}
                    defaultValue={category?.names[locale] ?? ""}
                    dir={rtl ? "rtl" : "ltr"}
                  />
                </div>
                <div>
                  <Label htmlFor={`fabric-${id}`}>Varsayılan kumaş</Label>
                  <Input
                    id={`fabric-${id}`}
                    name={`fabric.${locale}`}
                    defaultValue={category?.fabric[locale] ?? ""}
                    dir={rtl ? "rtl" : "ltr"}
                  />
                </div>
                <div>
                  <Label htmlFor={`packaging-${id}`}>Paketleme</Label>
                  <Input
                    id={`packaging-${id}`}
                    name={`packaging.${locale}`}
                    defaultValue={category?.packaging[locale] ?? ""}
                    dir={rtl ? "rtl" : "ltr"}
                  />
                </div>
                <div>
                  <Label htmlFor={`printType-${id}`}>Baskı ve markalama</Label>
                  <Input
                    id={`printType-${id}`}
                    name={`printType.${locale}`}
                    defaultValue={category?.printType[locale] ?? ""}
                    dir={rtl ? "rtl" : "ltr"}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor={`description-${id}`}>Kategori açıklaması (SEO metni)</Label>
                <Textarea
                  id={`description-${id}`}
                  name={`description.${locale}`}
                  defaultValue={category?.descriptions[locale] ?? ""}
                  dir={rtl ? "rtl" : "ltr"}
                  className="min-h-28"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor={`seoTitle-${id}`}>SEO başlığı</Label>
                  <Input
                    id={`seoTitle-${id}`}
                    name={`seoTitle.${locale}`}
                    defaultValue={category?.seoTitles[locale] ?? ""}
                    dir={rtl ? "rtl" : "ltr"}
                  />
                </div>
                <div>
                  <Label htmlFor={`seoDescription-${id}`}>SEO açıklaması</Label>
                  <Input
                    id={`seoDescription-${id}`}
                    name={`seoDescription.${locale}`}
                    defaultValue={category?.seoDescriptions[locale] ?? ""}
                    dir={rtl ? "rtl" : "ltr"}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <Submit />
        {state?.ok === false ? (
          <span className="text-sm text-danger">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
