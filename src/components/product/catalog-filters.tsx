"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type Facets = {
  categories: { slug: string; name: string; count: number }[];
  /** `value` filtreye gider (kanonik İngilizce), `label` ekranda görünür. */
  sections: { value: string; label: string; count: number }[];
  subcategories: { value: string; label: string; count: number }[];
  colors: { name: string; label: string; hex: string | null; count: number }[];
  sizes: { value: string; count: number }[];
};

/**
 * Katalog filtreleri — brief §4.2.
 *
 * Masaüstünde ekranın solunda yapışkan bir sütun; gruplar akordiyon ve
 * VARSAYILAN OLARAK KAPALI, sadece seçim yapılmış grup açık gelir. Böylece
 * ürünler ekranın üstünde başlar, filtreler sayfayı aşağı itmez.
 * Küçük ekranda aynı gruplar bir çekmecede açılır.
 *
 * Filtre durumu URL'e yazılır (paylaşılabilir), arama 250ms debounce'lu.
 */

const FILTER_KEYS = ["category", "section", "subcategory", "color", "size"] as const;

/** Seçili filtrenin ekranda gösterilecek çevrilmiş adı. */
function activeLabel(
  items: { value: string; label: string }[],
  value: string | null,
): string | null {
  if (!value) return null;
  return items.find((i) => i.value === value)?.label ?? value;
}

export function CatalogFilters({
  facets,
  total,
  lockedCategory,
  variant = "sidebar",
}: {
  facets: Facets;
  total: number;
  lockedCategory?: string;
  /** "sidebar" masaüstü sütunu, "bar" ise sadece arama + sırala + çekmece. */
  variant?: "sidebar" | "bar";
}) {
  const t = useTranslations("catalog");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const [q, setQ] = useState(params.get("q") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const push = useCallback(
    (next: URLSearchParams) => {
      next.delete("page"); // filtre değişince ilk sayfaya dön
      const qs = next.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router],
  );

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      push(next);
    },
    [params, push],
  );

  // arama: 250ms debounce (brief §4.2)
  useEffect(() => {
    if ((params.get("q") ?? "") === q) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setParam("q", q || null), 250);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [q, params, setParam]);

  const activeCount = FILTER_KEYS.filter(
    (k) => params.get(k) && !(k === "category" && lockedCategory),
  ).length;

  function clearAll() {
    const next = new URLSearchParams();
    const sort = params.get("sort");
    if (sort) next.set("sort", sort);
    setQ("");
    push(next);
  }

  const toggle = (key: string, value: string) =>
    setParam(key, params.get(key) === value ? null : value);

  const groups = (
    <div className="divide-y divide-line-soft">
      <FilterGroup
        label={t("section")}
        active={activeLabel(facets.sections, params.get("section"))}
      >
        {facets.sections.map((s) => (
          <Chip
            key={s.value}
            active={params.get("section") === s.value}
            onClick={() => toggle("section", s.value)}
          >
            {s.label}
          </Chip>
        ))}
      </FilterGroup>

      {!lockedCategory ? (
        <FilterGroup label={t("category")} active={params.get("category")}>
          {facets.categories.map((c) => (
            <Chip
              key={c.slug}
              active={params.get("category") === c.slug}
              onClick={() => toggle("category", c.slug)}
            >
              {c.name}
            </Chip>
          ))}
        </FilterGroup>
      ) : null}

      <FilterGroup
        label={t("subcategory")}
        active={activeLabel(facets.subcategories, params.get("subcategory"))}
      >
        {facets.subcategories.map((s) => (
          <Chip
            key={s.value}
            active={params.get("subcategory") === s.value}
            onClick={() => toggle("subcategory", s.value)}
          >
            {s.label}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup
        label={t("colour")}
        active={
          facets.colors.find((c) => c.name === params.get("color"))?.label ??
          params.get("color")
        }
      >
        {facets.colors.map((c) => (
          <Chip
            key={c.name}
            active={params.get("color") === c.name}
            onClick={() => toggle("color", c.name)}
          >
            <span
              aria-hidden
              className="size-3 rounded-full border border-line"
              style={{ background: c.hex ?? "var(--surface-2)" }}
            />
            {c.label}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup label={t("size")} active={params.get("size")}>
        {facets.sizes.map((s) => (
          <Chip
            key={s.value}
            active={params.get("size") === s.value}
            onClick={() => toggle("size", s.value)}
            className="tabular"
          >
            {s.value}
          </Chip>
        ))}
      </FilterGroup>
    </div>
  );

  /* --------------------------------------------------------- üst arama barı */
  if (variant === "bar") {
    return (
      <div className={cn("flex flex-wrap items-center gap-3", pending && "opacity-60")}>
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-faint"
            aria-hidden
          />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search")}
            aria-label={t("searchLabel")}
            className="ps-11"
          />
        </div>

        <Select
          value={params.get("sort") ?? "newest"}
          onChange={(e) => setParam("sort", e.target.value === "newest" ? null : e.target.value)}
          aria-label={t("sort")}
          className="w-auto min-w-44"
        >
          <option value="newest">{t("sortNewest")}</option>
          <option value="bestsellers">{t("sortBestSellers")}</option>
          <option value="price">{t("sortPriceAsc")}</option>
          <option value="alpha">{t("sortAlpha")}</option>
        </Select>

        {/* Küçük ekran: filtreler çekmecede */}
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <Button variant="outline" size="md" className="lg:hidden">
              <SlidersHorizontal aria-hidden />
              {t("filters")}
              {activeCount > 0 ? (
                <span className="tabular rounded-[--radius-pill] bg-solid px-1.5 text-[11px] text-on-solid">
                  {activeCount}
                </span>
              ) : null}
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-bg/70 backdrop-blur-sm" />
            <Dialog.Content className="fixed inset-y-0 end-0 z-50 flex w-[min(24rem,90vw)] flex-col border-s border-line bg-surface-2">
              <div className="flex items-center justify-between border-b border-line p-5">
                <Dialog.Title className="eyebrow">{t("filters")}</Dialog.Title>
                <Dialog.Close asChild>
                  <Button variant="ghost" size="icon" aria-label={t("close")}>
                    <X aria-hidden />
                  </Button>
                </Dialog.Close>
              </div>
              <div className="flex-1 overflow-y-auto px-5">{groups}</div>
              <div className="flex gap-3 border-t border-line p-5">
                <Button variant="ghost" size="md" onClick={clearAll} className="flex-1">
                  {t("clearFilters")}
                </Button>
                <Dialog.Close asChild>
                  <Button variant="solid" size="md" className="flex-1">
                    {t("applyFilters", { count: total })}
                  </Button>
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    );
  }

  /* ------------------------------------------------------------- sol sütun */
  return (
    <aside
      className={cn(
        "hidden lg:sticky lg:top-24 lg:block lg:self-start",
        pending && "opacity-60 transition-opacity",
      )}
      aria-label={t("filters")}
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="eyebrow">{t("filters")}</h2>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-muted underline underline-offset-4 transition-colors hover:text-fg"
          >
            {t("clearFilters")}
          </button>
        ) : null}
      </div>

      <div className="max-h-[calc(100svh-9rem)] overflow-y-auto pe-1">{groups}</div>
    </aside>
  );
}

/**
 * Akordiyon grup. `<details>` kullanıldığı için JavaScript olmadan da açılır
 * ve klavye ile erişilebilir. Seçili filtre varsa grup açık başlar.
 */
function FilterGroup({
  label,
  active,
  children,
}: {
  label: string;
  active?: string | null;
  children: React.ReactNode;
}) {
  return (
    <details className="group py-1" open={Boolean(active)}>
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-3 py-3.5",
          "text-sm text-muted transition-colors hover:text-fg [&::-webkit-details-marker]:hidden",
        )}
      >
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="text-fg">{label}</span>
          {active ? (
            <span className="truncate text-xs text-muted">{active}</span>
          ) : null}
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-faint transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="flex flex-wrap gap-2 pb-4">{children}</div>
    </details>
  );
}
