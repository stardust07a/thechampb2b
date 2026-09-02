"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { saveSettings } from "@/app/admin/actions/catalog";
import type { ActionResult } from "@/app/admin/actions/products";
import type { SiteSettings } from "@/lib/settings";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="solid" size="md" disabled={pending}>
      {pending ? "Kaydediliyor…" : "Ayarları kaydet"}
    </Button>
  );
}

function Field({
  name,
  label,
  defaultValue,
  hint,
  ...rest
}: Omit<React.ComponentProps<"input">, "defaultValue" | "name"> & {
  name: string;
  label: string;
  /** Ayar girilmemişse null gelir; input boş açılır. */
  defaultValue?: string | number | null;
  hint?: string;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue ?? ""} {...rest} />
      {hint ? <p className="mt-1.5 text-xs text-faint">{hint}</p> : null}
    </div>
  );
}

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    async (prev, formData) => {
      const result = await saveSettings(prev, formData);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      return result;
    },
    null,
  );

  return (
    <form action={action} className="space-y-6">
      <section className="rounded-[--radius-card] border border-line bg-surface p-6">
        <h2 className="eyebrow mb-5">İletişim</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="inquiryEmail"
            label="Kurumsal e-posta"
            type="email"
            dir="ltr"
            defaultValue={settings.inquiryEmail}
            hint="Teklif talepleri bu adrese düşer ve sitede görünür."
          />
          <Field name="phone" label="Telefon" dir="ltr" defaultValue={settings.phone} />
          <Field
            name="whatsappNumber"
            label="WhatsApp numarası"
            dir="ltr"
            defaultValue={settings.whatsappNumber}
            hint="Uluslararası biçim: +905532130404"
          />
          <Field name="telegram" label="Telegram" dir="ltr" defaultValue={settings.telegram} />
          <Field name="address" label="Adres" defaultValue={settings.address} />
        </div>
      </section>

      <section className="rounded-[--radius-card] border border-line bg-surface p-6">
        <h2 className="eyebrow mb-5">Ticari şartlar</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            name="moqPieces"
            label="Minimum sipariş (adet)"
            inputMode="numeric"
            className="tabular"
            defaultValue={settings.moqPieces}
          />
          <Field
            name="logoPrintFrom"
            label="Logo baskı başlangıcı"
            inputMode="numeric"
            className="tabular"
            defaultValue={settings.logoPrintFrom}
          />
          <Field
            name="customDesignFrom"
            label="Özel tasarım başlangıcı"
            inputMode="numeric"
            className="tabular"
            defaultValue={settings.customDesignFrom}
          />
          <Field
            name="labelChangeFrom"
            label="Etiket değişimi başlangıcı"
            inputMode="numeric"
            className="tabular"
            defaultValue={settings.labelChangeFrom}
          />
          <Field
            name="sampleLeadTimeDays"
            label="Numune termini"
            defaultValue={settings.sampleLeadTimeDays}
            placeholder="7-10 gün"
          />
          <Field
            name="bulkLeadTimeDays"
            label="Toplu üretim termini"
            defaultValue={settings.bulkLeadTimeDays}
            placeholder="30-45 gün"
          />
        </div>
      </section>

      <section className="rounded-[--radius-card] border border-line bg-surface p-6">
        <h2 className="eyebrow mb-5">Fiyat ve para birimi</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            name="eurRate"
            label="EUR kuru (1 USD = ? EUR)"
            inputMode="decimal"
            className="tabular"
            defaultValue={settings.eurRate}
            hint="EUR fiyatları USD üzerinden bu kurla hesaplanır."
          />
          <div>
            <Label htmlFor="defaultCurrency">Varsayılan para birimi</Label>
            <Select
              id="defaultCurrency"
              name="defaultCurrency"
              defaultValue={settings.defaultCurrency}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </Select>
          </div>
        </div>
      </section>

      <section className="rounded-[--radius-card] border border-line bg-surface p-6">
        <h2 className="eyebrow mb-5">Şirket bilgileri</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            name="foundedYear"
            label="Kuruluş yılı"
            inputMode="numeric"
            className="tabular"
            defaultValue={settings.foundedYear}
          />
          <Field
            name="monthlyCapacity"
            label="Aylık kapasite (adet)"
            inputMode="numeric"
            className="tabular"
            defaultValue={settings.monthlyCapacity}
            hint="Boşsa sitede “Talep üzerine” yazar."
          />
          <Field
            name="exportCountries"
            label="İhracat ülkesi sayısı"
            inputMode="numeric"
            className="tabular"
            defaultValue={settings.exportCountries}
            hint="Boşsa sitede “Talep üzerine” yazar."
          />
        </div>
        <div className="mt-4">
          <Field
            name="certificates"
            label="Sertifikalar"
            defaultValue={settings.certificates.join(", ")}
            placeholder="OEKO-TEX, BSCI, ISO 9001"
            hint="Virgülle ayırın. Boşsa üretim sayfasında bu bölüm hiç görünmez."
          />
        </div>
      </section>

      <section className="rounded-[--radius-card] border border-line bg-surface p-6">
        <h2 className="eyebrow mb-5">Sosyal medya</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            name="social.instagram"
            label="Instagram"
            dir="ltr"
            defaultValue={settings.social.instagram}
            placeholder="https://instagram.com/…"
          />
          <Field
            name="social.linkedin"
            label="LinkedIn"
            dir="ltr"
            defaultValue={settings.social.linkedin}
            placeholder="https://linkedin.com/company/…"
          />
          <Field
            name="social.facebook"
            label="Facebook"
            dir="ltr"
            defaultValue={settings.social.facebook}
            placeholder="https://facebook.com/…"
          />
        </div>
        <p className="mt-3 text-xs text-faint">
          Boş bırakılan hesap footer&apos;da gösterilmez.
        </p>
      </section>

      <div className="sticky bottom-0 -mx-5 flex items-center gap-3 border-t border-line bg-bg/90 px-5 py-4 backdrop-blur-xl md:-mx-8 md:px-8">
        <Submit />
        {state?.ok === false ? (
          <span className="text-sm text-danger">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
