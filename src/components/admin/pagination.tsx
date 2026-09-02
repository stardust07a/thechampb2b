"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  perPage,
  total,
}: {
  page: number;
  perPage: number;
  total: number;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;

  const href = (p: number) => {
    const next = new URLSearchParams(params.toString());
    if (p <= 1) next.delete("page");
    else next.set("page", String(p));
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const box =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-[--radius-inner] border border-line px-3 text-sm transition-colors";

  // ilk, son ve mevcut sayfanin cevresi
  const visible = [...new Set([1, pages, page - 1, page, page + 1])]
    .filter((p) => p >= 1 && p <= pages)
    .sort((a, b) => a - b);

  return (
    <nav className="mt-6 flex flex-wrap items-center gap-1.5" aria-label="Sayfalama">
      <Link
        href={href(page - 1)}
        aria-disabled={page <= 1}
        className={cn(box, page <= 1 ? "pointer-events-none opacity-40" : "hover:border-chrome-1")}
      >
        <ChevronLeft className="size-4" aria-hidden />
        <span className="sr-only">Önceki</span>
      </Link>

      {visible.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - visible[i - 1] > 1 ? (
            <span className="px-1 text-faint" aria-hidden>
              …
            </span>
          ) : null}
          <Link
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              box,
              "tabular",
              p === page
                ? "border-transparent bg-solid text-on-solid"
                : "text-muted hover:border-chrome-1 hover:text-fg",
            )}
          >
            {p}
          </Link>
        </span>
      ))}

      <Link
        href={href(page + 1)}
        aria-disabled={page >= pages}
        className={cn(
          box,
          page >= pages ? "pointer-events-none opacity-40" : "hover:border-chrome-1",
        )}
      >
        <ChevronRight className="size-4" aria-hidden />
        <span className="sr-only">Sonraki</span>
      </Link>
    </nav>
  );
}
