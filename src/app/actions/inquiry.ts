"use server";

import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { checkRateLimit } from "@/lib/rate-limit";
import { inquirySchema } from "@/lib/inquiry-schema";
import { sendInquiryConfirmation, sendInquiryNotification } from "@/lib/email";
import type { Locale } from "@/i18n/routing";

export type InquiryResult =
  | { ok: true; id: string }
  | { ok: false; error: "validation" | "rateLimited" | "server"; fields?: Record<string, string> };

/**
 * Teklif gönderimi — brief §8.
 * Kayıt + kurumsal bildirim + gönderene teşekkür. E-posta gönderilemese bile
 * (RESEND_API_KEY yoksa) kayıt açılır ve kullanıcı başarı ekranı görür;
 * panelden talep yine görünür.
 */
export async function submitInquiry(raw: unknown): Promise<InquiryResult> {
  const parsed = inquirySchema.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fields[key]) fields[key] = issue.message;
    }
    return { ok: false, error: "validation", fields };
  }

  const data = parsed.data;

  // Honeypot doluysa bot: başarı gibi davran ama hiçbir şey kaydetme.
  if (data.website) return { ok: true, id: "ignored" };

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    "unknown";

  const limit = checkRateLimit(`inquiry:${ip}`);
  if (!limit.ok) return { ok: false, error: "rateLimited" };

  try {
    const inquiry = await prisma.inquiry.create({
      data: {
        name: data.name,
        company: data.company || null,
        country: data.country || null,
        email: data.email,
        phone: data.phone || null,
        interest: data.interest || null,
        estimatedQuantity: data.estimatedQuantity || null,
        message: data.message || null,
        locale: data.locale,
        items: {
          create: data.items.map((i) => ({
            productId: i.productId || null,
            productCode: i.productCode,
            productName: i.productName,
            color: i.color || null,
            sizeRun: i.sizeRun || null,
            quantity: i.quantity ?? null,
          })),
        },
      },
      select: { id: true },
    });

    const settings = await getSettings();
    const emailData = {
      id: inquiry.id,
      name: data.name,
      company: data.company,
      country: data.country,
      email: data.email,
      phone: data.phone,
      interest: data.interest,
      estimatedQuantity: data.estimatedQuantity,
      message: data.message,
      locale: data.locale as Locale,
      items: data.items,
    };

    // Gönderim başarısız olsa bile kullanıcı akışı bloke olmaz.
    const [notify, confirm] = await Promise.all([
      sendInquiryNotification(settings.inquiryEmail, emailData),
      sendInquiryConfirmation(emailData),
    ]);
    if (!notify.sent) console.warn("[inquiry] bildirim gönderilemedi:", notify.reason);
    if (!confirm.sent) console.warn("[inquiry] teşekkür gönderilemedi:", confirm.reason);

    return { ok: true, id: inquiry.id };
  } catch (error) {
    console.error("[inquiry] kayıt hatası:", error);
    return { ok: false, error: "server" };
  }
}
