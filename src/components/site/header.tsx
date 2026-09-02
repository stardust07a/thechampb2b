"use client";

import { useState } from "react";
import { Menu, MessageCircle, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/section";
import { cn } from "@/lib/utils";
import { useScrolled } from "@/lib/browser-state";
import { CurrencySwitcher } from "./currency-switcher";
import { InquiryButton } from "./inquiry-button";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";
import { Wordmark } from "./wordmark";

/**
 * Sticky header — brief §4.1.
 * Scroll'da blur + alt çizgi. 600–900px arası bozulmaz: menü lg'de açılır,
 * altında hamburger drawer vardır (brief §17.10).
 */
export function Header({ whatsappHref }: { whatsappHref: string }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const scrolled = useScrolled(8);
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/products", label: t("products") },
    { href: "/what-we-do", label: t("whatWeDo") },
    { href: "/manufacturing", label: t("manufacturing") },
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
  ] as const;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled
          ? "border-b border-line bg-bg/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <Container className="flex h-16 items-center gap-4 md:h-18">
        <Link href="/" className="shrink-0" aria-label="THE CHAMP GLOBAL">
          <Wordmark className="h-5 w-auto md:h-6" />
        </Link>

        <nav className="ms-6 hidden items-center gap-1 lg:flex" aria-label={t("menu")}>
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-[--radius-inner] px-3 py-2 text-sm transition-colors duration-200",
                  active ? "text-fg" : "text-muted hover:text-fg",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex items-center gap-1 md:gap-2">
          <CurrencySwitcher className="hidden sm:inline-flex" />
          <LocaleSwitcher />
          <ThemeToggle />
          <InquiryButton />
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("whatsapp")}
            className={cn(
              "hidden size-10 items-center justify-center rounded-[--radius-inner]",
              "text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-fg sm:inline-flex",
            )}
          >
            <MessageCircle className="size-4" aria-hidden />
          </a>

          {/* Mobil / tablet menü */}
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("openMenu")}>
                <Menu aria-hidden />
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-bg/70 backdrop-blur-sm" />
              <Dialog.Content
                className={cn(
                  "fixed inset-y-0 end-0 z-50 flex w-[min(22rem,86vw)] flex-col",
                  "border-s border-line bg-surface-2 p-6",
                )}
              >
                <div className="flex items-center justify-between">
                  <Dialog.Title className="eyebrow">{t("menu")}</Dialog.Title>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="icon" aria-label={t("closeMenu")}>
                      <X aria-hidden />
                    </Button>
                  </Dialog.Close>
                </div>

                <nav className="mt-8 flex flex-col" aria-label={t("menu")}>
                  {links.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      // gezinince drawer kapansın
                      onClick={() => setOpen(false)}
                      className="hairline py-4 text-h3 text-fg transition-colors hover:text-muted"
                    >
                      {l.label}
                    </Link>
                  ))}
                </nav>

                <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                  <CurrencySwitcher />
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg"
                  >
                    <MessageCircle className="size-4" aria-hidden />
                    {t("whatsapp")}
                  </a>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </Container>
    </header>
  );
}
