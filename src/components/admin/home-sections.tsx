"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { saveHomeSection, searchProducts } from "@/app/admin/actions/catalog";
import { LOCALES, LOCALE_NAMES } from "@/lib/locales";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export type SectionProduct = { id: string; productCode: string; name: string; imageKey: string | null };

export type HomeSectionData = {
  key: string;
  label: string;
  enabled: boolean;
  limit: number;
  titles: Record<string, string>;
  products: SectionProduct[];
};

/**
 * Ana sayfa ürün seçimi — brief §9.
 * Ürün arayıp ekleme, sıralama, gösterilecek adet, bölümü aç/kapat,
 * başlığı 4 dilde değiştirme. Bir ürün birden fazla bölümde olabilir.
 */
export function HomeSections({ sections }: { sections: HomeSectionData[] }) {
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <SectionEditor key={section.key} section={section} />
      ))}
    </div>
  );
}

function SectionEditor({ section }: { section: HomeSectionData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(section.enabled);
  const [limit, setLimit] = useState(section.limit);
  const [titles, setTitles] = useState(section.titles);
  const [products, setProducts] = useState<SectionProduct[]>(section.products);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SectionProduct[]>([]);
  const [searching, startSearch] = useTransition();

  function runSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    startSearch(async () => {
      setResults(await searchProducts(value));
    });
  }

  function add(product: SectionProduct) {
    if (products.some((p) => p.id === product.id)) {
      toast.info("Bu ürün zaten listede.");
      return;
    }
    setProducts((prev) => [...prev, product]);
    setQuery("");
    setResults([]);
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= products.length) return;
    const next = [...products];
    [next[index], next[target]] = [next[target], next[index]];
    setProducts(next);
  }

  function save() {
    startTransition(async () => {
      const result = await saveHomeSection(section.key, {
        enabled,
        limit,
        titles,
        productIds: products.map((p) => p.id),
      });
      if (result.ok) {
        toast.success(`${section.label}: ${result.message}`);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <section
      className={cn(
        "rounded-[--radius-card] border border-line bg-surface p-6",
        pending && "opacity-70 transition-opacity",
      )}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-h3 font-bold">{section.label}</h2>
        <label className="flex items-center gap-2.5 text-sm text-fg">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="size-4 rounded-[4px] border-line bg-surface-2 accent-[var(--chrome-2)]"
          />
          Bölüm açık
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <Label htmlFor={`limit-${section.key}`}>Gösterilecek adet</Label>
          <Input
            id={`limit-${section.key}`}
            type="number"
            min={1}
            max={24}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value) || 1)}
            className="tabular"
          />
        </div>
        {LOCALES.map((locale) => (
          <div key={locale}>
            <Label htmlFor={`title-${section.key}-${locale}`}>
              Başlık — {LOCALE_NAMES[locale]}
            </Label>
            <Input
              id={`title-${section.key}-${locale}`}
              value={titles[locale] ?? ""}
              onChange={(e) => setTitles((t) => ({ ...t, [locale]: e.target.value }))}
              dir={locale === "ar" ? "rtl" : "ltr"}
            />
          </div>
        ))}
      </div>

      {/* ------------------------------------------------------ ürün arama */}
      <div className="relative mt-6">
        <Label htmlFor={`search-${section.key}`}>Ürün ekle</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-faint"
            aria-hidden
          />
          <Input
            id={`search-${section.key}`}
            value={query}
            onChange={(e) => runSearch(e.target.value)}
            placeholder="Ürün kodu veya adı yazın"
            className="ps-11"
            autoComplete="off"
          />
        </div>

        {results.length > 0 ? (
          <ul className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-[--radius-inner] border border-line bg-surface-2 p-1.5 shadow-card">
            {results.map((r) => {
              const image = mediaUrl(r.imageKey, "thumb");
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => add(r)}
                    className="flex w-full items-center gap-3 rounded-[8px] px-3 py-2 text-start transition-colors hover:bg-surface"
                  >
                    <span className="relative block aspect-[2/3] w-7 shrink-0 overflow-hidden rounded-[4px] bg-surface">
                      {image ? (
                        <Image src={image} alt="" fill sizes="28px" className="object-cover" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-fg">{r.name}</span>
                      <span className="tabular block text-xs text-faint">{r.productCode}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : searching && query.length >= 2 ? (
          <p className="mt-2 text-sm text-faint">Aranıyor…</p>
        ) : null}
      </div>

      {/* -------------------------------------------------------- seçililer */}
      <ul className="mt-6 space-y-2">
        {products.length === 0 ? (
          <li className="rounded-[--radius-inner] border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
            Ürün seçilmedi. Seçim yapılmazsa bu bölüm ana sayfada gösterilmez.
          </li>
        ) : (
          products.map((p, index) => {
            const image = mediaUrl(p.imageKey, "thumb");
            const beyondLimit = index >= limit;
            return (
              <li
                key={p.id}
                className={cn(
                  "flex items-center gap-3 rounded-[--radius-inner] border border-line px-3 py-2",
                  beyondLimit && "opacity-45",
                )}
              >
                <span className="tabular w-6 shrink-0 text-xs text-faint">{index + 1}</span>
                <span className="relative block aspect-[2/3] w-8 shrink-0 overflow-hidden rounded-[4px] bg-surface-2">
                  {image ? (
                    <Image src={image} alt="" fill sizes="32px" className="object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-fg">{p.name}</span>
                  <span className="tabular block text-xs text-faint">
                    {p.productCode}
                    {beyondLimit ? " · limit dışı" : ""}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col">
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
                    disabled={index === products.length - 1}
                    aria-label="Aşağı taşı"
                    className="text-faint transition-colors hover:text-fg disabled:opacity-30"
                  >
                    <ChevronDown className="size-4" aria-hidden />
                  </button>
                </span>
                <button
                  type="button"
                  onClick={() => setProducts((prev) => prev.filter((x) => x.id !== p.id))}
                  aria-label={`${p.name} listeden çıkar`}
                  className="size-8 shrink-0 rounded-[--radius-inner] text-faint transition-colors hover:bg-surface-2 hover:text-danger"
                >
                  <X className="mx-auto size-4" aria-hidden />
                </button>
              </li>
            );
          })
        )}
      </ul>

      <Button variant="solid" size="md" className="mt-6" onClick={save} disabled={pending}>
        {pending ? "Kaydediliyor…" : "Bölümü kaydet"}
      </Button>
    </section>
  );
}
