import "server-only";
import { Resend } from "resend";

import type { Locale } from "@/i18n/routing";

/**
 * Resend ile e-posta. RESEND_API_KEY yoksa gönderim sessizce atlanır ve
 * `skipped` döner — teklif kaydı yine de veritabanına yazılır, form çalışır.
 * (Anahtar brief §16'da bekleyen bilgilerden.)
 */

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const FROM = process.env.RESEND_FROM ?? "THE CHAMP GLOBAL <onboarding@resend.dev>";

export type InquiryEmailData = {
  id: string;
  name: string;
  company?: string | null;
  country?: string | null;
  email: string;
  phone?: string | null;
  interest?: string | null;
  estimatedQuantity?: string | null;
  message?: string | null;
  locale: Locale;
  items: {
    productCode: string;
    productName: string;
    color?: string | null;
    sizeRun?: string | null;
    quantity?: number | null;
  }[];
};

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function itemsTable(items: InquiryEmailData["items"]): string {
  if (items.length === 0) return "<p style=\"color:#6b6d73\">—</p>";
  const rows = items
    .map(
      (i) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e4e4e7;font-family:ui-monospace,monospace">${esc(i.productCode)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e4e4e7">${esc(i.productName)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e4e4e7">${esc(i.color ?? "—")}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e4e4e7">${esc(i.sizeRun ?? "—")}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e4e4e7;text-align:right">${i.quantity ?? "—"}</td>
      </tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">
    <thead><tr style="text-align:left;color:#6b6d73;font-size:12px;text-transform:uppercase;letter-spacing:.06em">
      <th style="padding:8px 12px">Code</th><th style="padding:8px 12px">Product</th>
      <th style="padding:8px 12px">Colour</th><th style="padding:8px 12px">Sizes</th>
      <th style="padding:8px 12px;text-align:right">Qty</th>
    </tr></thead><tbody>${rows}</tbody></table>`;
}

function row(label: string, value?: string | null): string {
  if (!value) return "";
  return `<tr><td style="padding:6px 0;color:#6b6d73;width:180px;vertical-align:top">${esc(label)}</td>
    <td style="padding:6px 0;color:#0a0a0b">${esc(value)}</td></tr>`;
}

/** Kurumsal adrese düşen bildirim (brief §8.1). */
export async function sendInquiryNotification(
  to: string,
  data: InquiryEmailData,
): Promise<{ sent: boolean; reason?: string }> {
  if (!resend) return { sent: false, reason: "RESEND_API_KEY yok" };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:720px;margin:0 auto;padding:24px">
    <p style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b6d73;margin:0 0 8px">New inquiry</p>
    <h1 style="font-size:22px;margin:0 0 24px;color:#0a0a0b">${esc(data.name)}${data.company ? ` — ${esc(data.company)}` : ""}</h1>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${row("Email", data.email)}
      ${row("Phone", data.phone)}
      ${row("Country", data.country)}
      ${row("Language", data.locale.toUpperCase())}
      ${row("Interest", data.interest)}
      ${row("Estimated quantity", data.estimatedQuantity)}
    </table>
    ${data.message ? `<h2 style="font-size:14px;margin:28px 0 8px;color:#6b6d73">Message</h2>
      <p style="white-space:pre-wrap;margin:0;font-size:14px;color:#0a0a0b">${esc(data.message)}</p>` : ""}
    <h2 style="font-size:14px;margin:28px 0 8px;color:#6b6d73">Inquiry list (${data.items.length})</h2>
    ${itemsTable(data.items)}
    ${siteUrl ? `<p style="margin:28px 0 0;font-size:13px"><a href="${siteUrl}/admin/inquiries/${data.id}" style="color:#0a0a0b">Open in admin panel →</a></p>` : ""}
  </div>`;

  try {
    await resend.emails.send({
      from: FROM,
      to,
      replyTo: data.email,
      subject: `Inquiry — ${data.name}${data.company ? ` (${data.company})` : ""}${data.items.length ? ` · ${data.items.length} styles` : ""}`,
      html,
    });
    return { sent: true };
  } catch (error) {
    return { sent: false, reason: error instanceof Error ? error.message : "bilinmeyen hata" };
  }
}

/** Gönderene seçili dilde otomatik teşekkür (brief §8.2). */
const THANKS: Record<Locale, { subject: string; title: string; body: string; sign: string }> = {
  en: {
    subject: "We received your inquiry — THE CHAMP GLOBAL",
    title: "Thank you for your inquiry",
    body: "We have received your request and will reply within one business day with pricing and lead times. A copy of the styles you selected is below.",
    sign: "THE CHAMP GLOBAL · Istanbul, Türkiye",
  },
  tr: {
    subject: "Talebiniz bize ulaştı — THE CHAMP GLOBAL",
    title: "Talebiniz için teşekkürler",
    body: "Talebiniz bize ulaştı. Bir iş günü içinde fiyat ve termin bilgisiyle dönüş yapacağız. Seçtiğiniz modellerin listesi aşağıdadır.",
    sign: "THE CHAMP GLOBAL · İstanbul, Türkiye",
  },
  de: {
    subject: "Ihre Anfrage ist eingegangen — THE CHAMP GLOBAL",
    title: "Vielen Dank für Ihre Anfrage",
    body: "Wir haben Ihre Anfrage erhalten und melden uns innerhalb eines Werktages mit Preisen und Lieferzeiten. Eine Übersicht der ausgewählten Modelle finden Sie unten.",
    sign: "THE CHAMP GLOBAL · Istanbul, Türkiye",
  },
  ar: {
    subject: "تم استلام طلبك — THE CHAMP GLOBAL",
    title: "شكراً لطلبك",
    body: "وصلنا طلبك وسنرد خلال يوم عمل واحد بالأسعار ومدد التسليم. تجد أدناه قائمة الموديلات التي اخترتها.",
    sign: "THE CHAMP GLOBAL · إسطنبول، تركيا",
  },
};

export async function sendInquiryConfirmation(
  data: InquiryEmailData,
): Promise<{ sent: boolean; reason?: string }> {
  if (!resend) return { sent: false, reason: "RESEND_API_KEY yok" };
  const copy = THANKS[data.locale] ?? THANKS.en;
  const rtl = data.locale === "ar";

  const html = `<div dir="${rtl ? "rtl" : "ltr"}" style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:640px;margin:0 auto;padding:24px;text-align:${rtl ? "right" : "left"}">
    <h1 style="font-size:20px;margin:0 0 16px;color:#0a0a0b">${esc(copy.title)}</h1>
    <p style="font-size:14px;line-height:1.6;color:#3f4046;margin:0 0 24px">${esc(copy.body)}</p>
    ${data.items.length ? itemsTable(data.items) : ""}
    <p style="margin:32px 0 0;font-size:12px;color:#6b6d73">${esc(copy.sign)}</p>
  </div>`;

  try {
    await resend.emails.send({ from: FROM, to: data.email, subject: copy.subject, html });
    return { sent: true };
  } catch (error) {
    return { sent: false, reason: error instanceof Error ? error.message : "bilinmeyen hata" };
  }
}
