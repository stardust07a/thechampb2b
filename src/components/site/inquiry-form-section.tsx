import Image from "next/image";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { Container, Section } from "@/components/ui/section";
import { getSettings, whatsappLink } from "@/lib/settings";
import { getSlot, slotAlt } from "@/lib/media-slots";
import { InquiryForm } from "./inquiry-form";

/** Ana sayfa ve /contact'ta paylaşılan iletişim + teklif bloğu (brief §4.1/12). */
export async function InquiryFormSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "home" });
  const tContact = await getTranslations({ locale, namespace: "contact" });
  const settings = await getSettings();
  const side = await getSlot("page:contact:side");

  const channels = [
    {
      icon: Mail,
      label: tContact("email"),
      value: settings.inquiryEmail,
      href: `mailto:${settings.inquiryEmail}`,
      ltr: true,
    },
    {
      icon: Phone,
      label: tContact("phone"),
      value: settings.phone,
      href: `tel:${settings.phone.replace(/\s/g, "")}`,
      ltr: true,
    },
    {
      icon: MessageCircle,
      label: tContact("whatsapp"),
      value: settings.phone,
      href: whatsappLink(settings.whatsappNumber, "Hello THE CHAMP GLOBAL,"),
      ltr: true,
    },
    { icon: MapPin, label: tContact("address"), value: settings.address, href: null, ltr: false },
  ];

  return (
    <Section id="contact">
      <Container className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <h2 className="chrome-text text-h2">{t("contactTitle")}</h2>
          <p className="mt-4 max-w-md text-muted">{t("contactBody")}</p>

          <ul className="mt-10 space-y-6">
            {channels.map((c) => (
              <li key={c.label} className="hairline flex items-start gap-4 pt-5">
                <c.icon className="mt-0.5 size-4 shrink-0 text-faint" aria-hidden />
                <div>
                  <p className="eyebrow">{c.label}</p>
                  {c.href ? (
                    <a
                      href={c.href}
                      target={c.href.startsWith("http") ? "_blank" : undefined}
                      rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      dir={c.ltr ? "ltr" : undefined}
                      className="mt-1 inline-block text-fg transition-colors hover:text-muted"
                    >
                      {c.value}
                    </a>
                  ) : (
                    <p className="mt-1 text-fg">{c.value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {side ? (
            <div className="relative mt-10 aspect-[4/3] overflow-hidden rounded-[--radius-card] border border-line">
              <Image
                src={side.url}
                alt={slotAlt(side, locale)}
                fill
                sizes="(min-width:1024px) 40vw, 100vw"
                className="object-cover"
                unoptimized={side.url.startsWith("http")}
              />
            </div>
          ) : null}
        </div>

        <div className="rounded-[--radius-card] border border-line bg-surface p-6 md:p-8">
          <InquiryForm />
        </div>
      </Container>
    </Section>
  );
}
