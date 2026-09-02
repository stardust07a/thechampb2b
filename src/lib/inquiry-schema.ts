import { z } from "zod";

/** Brief §8.2 — doğrulama zod ile, CAPTCHA yok, honeypot var. */

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

export const inquiryItemSchema = z.object({
  productId: z.string().optional().nullable(),
  productCode: z.string().min(1).max(64),
  productName: z.string().min(1).max(200),
  color: z.string().max(120).optional().nullable(),
  sizeRun: z.string().max(120).optional().nullable(),
  quantity: z.number().int().min(0).max(1_000_000).optional().nullable(),
});

export const inquirySchema = z.object({
  name: z.string().min(2, "required").max(120),
  company: z.string().max(160).optional().or(z.literal("")),
  country: z.string().max(80).optional().or(z.literal("")),
  email: z.email("invalidEmail").max(160),
  phone: z.string().max(40).optional().or(z.literal("")),
  interest: z.string().max(300).optional().or(z.literal("")),
  estimatedQuantity: z.string().max(60).optional().or(z.literal("")),
  message: z.string().max(4000).optional().or(z.literal("")),
  consent: z.literal(true, { message: "consentRequired" }),
  locale: z.enum(["en", "tr", "de", "ar"]),
  items: z.array(inquiryItemSchema).max(100).default([]),
  /** Bot tuzağı — dolu gelirse istek sessizce başarılı sayılır, kayıt açılmaz. */
  website: z.string().max(0).optional().or(z.literal("")),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

/**
 * Formun kendi şeması: `items` ve `locale` istemciden gelmez, gönderim anında
 * sepetten ve aktif dilden eklenir. Bu ayrım react-hook-form'un giriş/çıkış
 * tiplerinin `.default()` yüzünden ayrışmasını da önler.
 */
export const inquiryFormSchema = inquirySchema.omit({ items: true, locale: true });
export type InquiryFormInput = z.infer<typeof inquiryFormSchema>;
