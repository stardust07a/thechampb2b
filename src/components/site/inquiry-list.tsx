"use client";

import { useState } from "react";
import Image from "next/image";
import { Mail, MessageCircle, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IMAGE_PLACEHOLDER, mediaUrl } from "@/lib/media";
import { colorLabel } from "@/lib/taxonomy";
import type { AppLocale } from "@/lib/locales";
import { useInquiry } from "./inquiry-store";
import { InquiryForm, InquirySuccess } from "./inquiry-form";

/**
 * /inquiry — sepet tablosu + form (brief §8.1).
 * MOQ altındaysa uyarı verir ama engellemez.
 */
export function InquiryList({
  whatsappNumber,
  inquiryEmail,
  moq,
  siteUrl,
}: {
  whatsappNumber: string;
  inquiryEmail: string;
  moq: number;
  siteUrl: string;
}) {
  const t = useTranslations("inquiry");
  const locale = useLocale();
  const { items, totalQuantity, ready, update, remove, clear } = useInquiry();
  const [submitted, setSubmitted] = useState(false);

  // Gönderim başarılı olunca sepet temizlenir; boş ekran yerine formun
  // kendi onay ekranı gösterilmeli.
  if (submitted) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <InquirySuccess />
        <div className="text-center">
          <Button asChild variant="outline" size="md">
            <Link href="/products">{t("browse")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return <div className="h-40 animate-pulse rounded-[--radius-card] bg-surface" aria-hidden />;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[--radius-card] border border-line bg-surface px-6 py-16 text-center">
        <h2 className="text-h3 text-fg">{t("empty")}</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted">{t("emptyBody")}</p>
        <Button asChild variant="solid" size="md" className="mt-8">
          <Link href="/products">{t("browse")}</Link>
        </Button>
      </div>
    );
  }

  const totalsByStyle = new Map<string, number>();
  for (const item of items) {
    const key = `${item.productId}-${item.color ?? ""}`;
    totalsByStyle.set(key, (totalsByStyle.get(key) ?? 0) + (item.quantity || 0));
  }
  const belowMoq = [...totalsByStyle.values()].some((quantity) => quantity > 0 && quantity < moq);

  const whatsappMessage = [
    "Hello THE CHAMP GLOBAL,",
    "I would like a quotation for the following styles:",
    "",
    ...items.map((i) =>
      [
        `• ${i.productCode} — ${i.productName}`,
        i.color ? `  Colour: ${i.color}` : null,
        i.sizeRun ? `  Size: ${i.sizeRun}` : null,
        i.quantity > 0 ? `  Qty: ${i.quantity} pcs` : null,
        `  ${siteUrl}/${locale}/products/${i.categorySlug}/${i.slug}`,
      ]
        .filter(Boolean)
        .join("\n"),
    ),
    "",
    totalQuantity > 0 ? `Total: ${totalQuantity} pcs` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const whatsappHref = `https://wa.me/${whatsappNumber.replace(/[^\d]/g, "")}?text=${encodeURIComponent(whatsappMessage)}`;
  const emailHref = `mailto:${inquiryEmail}?subject=${encodeURIComponent(t("emailSubject"))}&body=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="grid min-w-0 gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
      <div className="min-w-0">
        <ul className="min-w-0 space-y-4">
          {items.map((item) => {
            const image = mediaUrl(item.imageKey, "thumb");
            return (
              <li
                key={`${item.productId}-${item.color ?? ""}-${item.sizeRun ?? ""}`}
                className="flex min-w-0 gap-4 rounded-[--radius-card] border border-line bg-surface p-4"
              >
                <div className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-[--radius-inner] bg-surface-2">
                  {image ? (
                    <Image
                      src={image}
                      alt=""
                      aria-hidden
                      fill
                      sizes="80px"
                      placeholder="blur"
                      blurDataURL={IMAGE_PLACEHOLDER}
                      className="object-cover"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="tabular text-[11px] text-faint">{item.productCode}</p>
                  <Link
                    href={`/products/${item.categorySlug}/${item.slug}`}
                    className="mt-1 block truncate text-sm font-medium text-fg transition-colors hover:text-muted"
                  >
                    {item.productName}
                  </Link>

                  <div className="mt-3 flex flex-wrap items-end gap-4">
                    {item.color ? (
                      <div>
                        <p className="eyebrow mb-1.5">{t("colour")}</p>
                        <span className="inline-flex items-center gap-2 text-sm text-muted">
                          <span
                            aria-hidden
                            className="size-3 rounded-full border border-line"
                            style={{ background: item.colorHex ?? "var(--surface-2)" }}
                          />
                          {colorLabel(item.color, locale as AppLocale)}
                        </span>
                      </div>
                    ) : null}

                    {item.sizeRun ? (
                      <div>
                        <p className="eyebrow mb-1.5">{t("sizeRun")}</p>
                        <span className="tabular text-sm text-muted">{item.sizeRun}</span>
                      </div>
                    ) : null}

                    <div className="w-24">
                      <label
                        htmlFor={`qty-${item.productId}-${item.color ?? ""}-${item.sizeRun ?? ""}`}
                        className="eyebrow mb-1.5 block"
                      >
                        {t("quantity")}
                      </label>
                      <Input
                        id={`qty-${item.productId}-${item.color ?? ""}-${item.sizeRun ?? ""}`}
                        inputMode="numeric"
                        className="tabular h-9"
                        value={item.quantity || ""}
                        placeholder={String(moq)}
                        onChange={(e) =>
                          update(item.productId, item.color, item.sizeRun, {
                            quantity: Number(e.target.value.replace(/[^\d]/g, "")) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    remove(item.productId, item.color, item.sizeRun);
                    toast(t("removed"), { description: item.productName });
                  }}
                  aria-label={`${t("remove")} — ${item.productName}`}
                  className="size-9 shrink-0 self-start rounded-[--radius-inner] text-faint transition-colors hover:bg-surface-2 hover:text-danger"
                >
                  <Trash2 className="mx-auto size-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm">
            <p className="text-fg">{t("totalItems", { count: items.length })}</p>
            {totalQuantity > 0 ? (
              <p className="tabular mt-1 text-muted">{t("totalQuantity", { count: totalQuantity })}</p>
            ) : null}
          </div>
          <Button variant="ghost" size="sm" onClick={clear}>
            {t("clear")}
          </Button>
        </div>

        {belowMoq ? (
          <p
            role="status"
            className="mt-4 rounded-[--radius-inner] border border-line bg-surface-2 p-4 text-sm text-muted"
          >
            {t("moqWarning", { moq })}
          </p>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button asChild variant="primary" size="lg">
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle aria-hidden />
              {t("sendWhatsapp")}
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href={emailHref}>
              <Mail aria-hidden />
              {t("sendEmail")}
            </a>
          </Button>
        </div>
      </div>

      <div className="min-w-0 rounded-[--radius-card] border border-line bg-surface p-6 md:p-8">
        <h2 className="mb-6 text-h3 text-fg">{t("sendForm")}</h2>
        <InquiryForm compact onSuccess={() => setSubmitted(true)} />
      </div>
    </div>
  );
}
