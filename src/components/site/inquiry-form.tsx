"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { inquiryFormSchema, type InquiryFormInput } from "@/lib/inquiry-schema";
import { submitInquiry } from "@/app/actions/inquiry";
import { useInquiry } from "./inquiry-store";
import { COUNTRIES } from "@/lib/countries";
import { cn } from "@/lib/utils";

/**
 * Teklif formu — brief §8.2.
 * zod + react-hook-form, honeypot, CAPTCHA yok. Sepetteki satırlar otomatik
 * eklenir; sepet boşsa form yine tek başına çalışır (iletişim formu olarak).
 */
export function InquiryForm({
  className,
  compact = false,
  onSuccess,
}: {
  className?: string;
  compact?: boolean;
  /** Sepet sayfası, gönderim sonrası "sepet boş" ekranına düşmesin diye bilir. */
  onSuccess?: () => void;
}) {
  const t = useTranslations("inquiry.form");
  const locale = useLocale() as Locale;
  const { items, clear } = useInquiry();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<InquiryFormInput>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: { website: "" },
  });

  function onSubmit(values: InquiryFormInput) {
    startTransition(async () => {
      const result = await submitInquiry({
        ...values,
        locale,
        items: items.map((i) => ({
          productId: i.productId,
          productCode: i.productCode,
          productName: i.productName,
          color: i.color,
          sizeRun: i.sizeRun,
          quantity: i.quantity || null,
        })),
      });

      if (result.ok) {
        setDone(true);
        clear();
        onSuccess?.();
        return;
      }
      if (result.error === "rateLimited") {
        toast.error(t("errorTitle"), { description: t("rateLimited") });
        return;
      }
      if (result.error === "validation" && result.fields) {
        for (const [field, message] of Object.entries(result.fields)) {
          setError(field as keyof InquiryFormInput, { message });
        }
        return;
      }
      toast.error(t("errorTitle"), { description: t("errorBody") });
    });
  }

  if (done) return <InquirySuccess className={className} />;

  /** Alan hatalarının mesaj anahtarını çeviriye bağlar. */
  const msg = (key?: string) => {
    if (!key) return undefined;
    const known = ["required", "invalidEmail", "consentRequired"] as const;
    return (known as readonly string[]).includes(key) ? t(key as (typeof known)[number]) : key;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={cn("space-y-5", className)}>
      {/* honeypot — ekran okuyuculardan ve klavyeden gizli */}
      <div aria-hidden className="absolute h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">
            {t("name")} <span className="text-danger">*</span>
          </Label>
          <Input
            id="name"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          <FieldError>{msg(errors.name?.message)}</FieldError>
        </div>
        <div>
          <Label htmlFor="company">{t("company")}</Label>
          <Input id="company" autoComplete="organization" {...register("company")} />
        </div>
        <div>
          <Label htmlFor="email">
            {t("email")} <span className="text-danger">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            dir="ltr"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          <FieldError>{msg(errors.email?.message)}</FieldError>
        </div>
        <div>
          <Label htmlFor="phone">{t("phone")}</Label>
          <Input id="phone" type="tel" autoComplete="tel" dir="ltr" {...register("phone")} />
        </div>
        <div>
          <Label htmlFor="country">{t("country")}</Label>
          <Select id="country" defaultValue="" {...register("country")}>
            <option value="">{t("countryPlaceholder")}</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="estimatedQuantity">{t("estimatedQuantity")}</Label>
          <Input
            id="estimatedQuantity"
            inputMode="numeric"
            {...register("estimatedQuantity")}
          />
        </div>
      </div>

      {!compact ? (
        <div>
          <Label htmlFor="interest">{t("interest")}</Label>
          <Input id="interest" {...register("interest")} />
        </div>
      ) : null}

      <div>
        <Label htmlFor="message">{t("message")}</Label>
        <Textarea id="message" placeholder={t("messagePlaceholder")} {...register("message")} />
      </div>

      <div className="flex items-start gap-3">
        <input
          id="consent"
          type="checkbox"
          className="mt-1 size-4 shrink-0 rounded-[4px] border-line bg-surface-2 accent-[var(--chrome-2)]"
          aria-invalid={Boolean(errors.consent)}
          {...register("consent")}
        />
        <div>
          <label htmlFor="consent" className="text-sm text-muted">
            {t("consent")}{" "}
            <Link href="/privacy" className="text-fg underline underline-offset-4">
              {t("consentLink")}
            </Link>
          </label>
          <FieldError>{msg(errors.consent?.message)}</FieldError>
        </div>
      </div>

      <Button type="submit" variant="solid" size="lg" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}

/** Gönderim sonrası onay paneli — form ve sepet sayfası aynısını gösterir. */
export function InquirySuccess({ className }: { className?: string }) {
  const t = useTranslations("inquiry.form");
  return (
    <div
      role="status"
      className={cn(
        "rounded-[--radius-card] border border-line bg-surface p-8 text-center",
        className,
      )}
    >
      <CheckCircle2 className="mx-auto size-8 text-success" aria-hidden />
      <h3 className="mt-4 text-h3 text-fg">{t("successTitle")}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted">{t("successBody")}</p>
    </div>
  );
}
