"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AdminProductFilters({
  categories,
}: {
  categories: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (!value) next.delete(key);
      else next.set(key, value);
      next.delete("page");
      const qs = next.toString();
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname));
    },
    [params, pathname, router],
  );

  useEffect(() => {
    if ((params.get("q") ?? "") === q) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setParam("q", q), 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q, params, setParam]);

  const missing = params.get("missing");

  return (
    <div className={pending ? "opacity-60 transition-opacity" : undefined}>
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-faint"
            aria-hidden
          />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kod, model kodu veya ad ara"
            aria-label="Ürün ara"
            className="ps-11"
          />
        </div>

        <Select
          value={params.get("status") ?? ""}
          onChange={(e) => setParam("status", e.target.value)}
          aria-label="Durum"
          className="w-auto min-w-36"
        >
          <option value="">Tüm durumlar</option>
          <option value="published">Yayında</option>
          <option value="draft">Taslak</option>
          <option value="archived">Arşiv</option>
        </Select>

        <Select
          value={params.get("category") ?? ""}
          onChange={(e) => setParam("category", e.target.value)}
          aria-label="Kategori"
          className="w-auto min-w-44"
        >
          <option value="">Tüm kategoriler</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {missing ? (
        <div className="mt-3 flex items-center gap-3 text-sm text-muted">
          <span>
            Filtre:{" "}
            {missing === "price"
              ? "fiyatı olmayanlar"
              : missing === "images"
                ? "görseli olmayanlar"
                : "içe aktarma uyarısı olanlar"}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setParam("missing", "")}>
            Kaldır
          </Button>
        </div>
      ) : null}
    </div>
  );
}
