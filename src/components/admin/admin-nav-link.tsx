"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AdminNavLink({
  href,
  exact,
  compact,
  children,
}: {
  href: string;
  exact?: boolean;
  compact?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-[--radius-inner] text-sm transition-colors duration-200",
        compact ? "shrink-0 px-3 py-2" : "px-3 py-2.5",
        active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface hover:text-fg",
      )}
    >
      {children}
    </Link>
  );
}
