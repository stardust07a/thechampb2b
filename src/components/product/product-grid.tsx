import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Katalog grid'i — image-first, sıkı ritim. */
export function ProductGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 items-stretch gap-x-4 gap-y-8",
        "md:grid-cols-3 md:gap-x-5 xl:grid-cols-4 2xl:grid-cols-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Ana sayfadaki yatay kayan şerit (Best Sellers vb.). */
export function ProductRail({ children }: { children: ReactNode }) {
  return (
    <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 md:-mx-8 md:px-8">
      {children}
    </div>
  );
}

export function RailItem({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-[62vw] shrink-0 snap-start sm:w-[40vw] md:w-[30vw] lg:w-[22vw] xl:w-[18vw]">
      {children}
    </div>
  );
}
