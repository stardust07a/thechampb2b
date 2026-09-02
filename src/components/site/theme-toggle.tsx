"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useDocumentAttribute } from "@/lib/browser-state";

type Theme = "dark" | "light";

/**
 * Tema geçişi — brief §3.1.
 * Mevcut tema `<html data-theme>` üzerinden okunur (ThemeScript ilk boyamadan
 * önce yazar), tercih localStorage'da saklanır. Varsayılan dark.
 */
export function ThemeToggle() {
  const t = useTranslations("nav");
  const attribute = useDocumentAttribute("data-theme", "dark");
  const theme: Theme = attribute === "light" ? "light" : "dark";

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    // Geçiş sırasında transition'ları kapat, aksi halde tüm sayfa "yanıp söner"
    document.documentElement.classList.add("theme-switching");
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* özel sekmede yazamayabiliriz — tema yine de değişsin */
    }
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document.documentElement.classList.remove("theme-switching"),
      ),
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={`${t("theme")}: ${theme === "dark" ? t("themeDark") : t("themeLight")}`}
      title={theme === "dark" ? t("themeLight") : t("themeDark")}
    >
      {theme === "dark" ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </Button>
  );
}
