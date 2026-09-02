"use client";

import { cn } from "@/lib/utils";

/**
 * Filtre chip'i — brief §3.3: pasifken şeffaf + kenar, aktifken beyaz zemin
 * siyah metin (dark'ta). Buton içine buton koymamak için her zaman tekil <button>.
 */
export function Chip({
  active,
  className,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-[--radius-pill] border px-4 text-sm",
        "transition-colors duration-200 ease-[cubic-bezier(.22,1,.36,1)]",
        active
          ? "border-transparent bg-solid text-on-solid"
          : "border-line bg-transparent text-muted hover:border-chrome-1 hover:text-fg",
        className,
      )}
      {...props}
    />
  );
}
