"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type HomeSectionLink = {
  id: string;
  label: string;
};

/**
 * Ana sayfanın tamamını izleyen sabit bölüm pusulası.
 *
 * Scroll dinleyicisi yalnızca bir animation frame'de bir kez ölçüm yapar;
 * böylece uzun ana sayfada video ve kaydırma performansını etkilemez.
 */
export function HomeSectionNav({
  label,
  sections,
}: {
  label: string;
  sections: HomeSectionLink[];
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const frameRef = useRef<number | null>(null);

  const updateActiveSection = useCallback(() => {
    frameRef.current = null;
    const marker = window.innerHeight * 0.38;
    const contentStart = document.getElementById("home-content");
    let next: string | null = null;

    setVisible(contentStart ? contentStart.getBoundingClientRect().top <= 96 : false);

    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (!element) continue;
      if (element.getBoundingClientRect().top <= marker) next = section.id;
      else break;
    }

    setActiveId((current) => (current === next ? current : next));
  }, [sections]);

  useEffect(() => {
    const requestUpdate = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(updateActiveSection);
    };

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [updateActiveSection]);

  return (
    <nav
      aria-label={label}
      className={cn(
        "group/rail fixed end-1.5 top-1/2 z-30 hidden w-11 -translate-y-1/2 overflow-hidden",
        "transition-[width,opacity,visibility] duration-300 ease-[cubic-bezier(.22,1,.36,1)]",
        "hover:w-48 focus-within:w-48 xl:block 2xl:end-3",
        visible ? "visible opacity-100" : "invisible pointer-events-none opacity-0",
      )}
    >
      <ol
        className={cn(
          "rounded-[--radius-card] border border-transparent bg-transparent p-1.5",
          "transition-[background-color,border-color,box-shadow] duration-300",
          "group-hover/rail:border-line group-hover/rail:bg-bg/88 group-hover/rail:shadow-card",
          "group-focus-within/rail:border-line group-focus-within/rail:bg-bg/88 group-focus-within/rail:shadow-card",
          "backdrop-blur-xl",
        )}
      >
        {sections.map((section, index) => {
          const active = activeId === section.id;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "group/item flex min-h-9 items-center justify-end gap-3 rounded-[--radius-inner] px-2 py-2",
                  "text-[11px] font-medium transition-colors duration-200",
                  active
                    ? "text-fg group-hover/rail:bg-surface-2 group-focus-within/rail:bg-surface-2"
                    : "text-faint hover:bg-surface hover:text-fg",
                )}
              >
                <span
                  className={cn(
                    "min-w-0 flex-1 overflow-hidden whitespace-nowrap leading-tight opacity-0",
                    "transition-opacity duration-200 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100",
                  )}
                >
                  {section.label}
                </span>
                <span
                  className={cn(
                    "tabular w-0 overflow-hidden text-[9px] text-faint opacity-0",
                    "transition-[width,opacity] duration-200 group-hover/rail:w-4 group-hover/rail:opacity-100",
                    "group-focus-within/rail:w-4 group-focus-within/rail:opacity-100",
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "h-px shrink-0 rounded-full transition-[width,background-color] duration-300",
                    active
                      ? "w-7 bg-fg"
                      : "w-3 bg-faint group-hover/item:w-5 group-hover/item:bg-muted",
                  )}
                />
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
