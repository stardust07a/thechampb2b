import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Teklif taleplerinin CSV dışa aktarımı (brief §9).
 * Oturum zorunlu — bu uç panel dışından erişilemez.
 */

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  // Formül enjeksiyonunu engelle: =,+,-,@ ile başlayan hücreleri kaçır
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Yetkisiz", { status: 401 });
  }

  const status = new URL(request.url).searchParams.get("status") ?? undefined;

  const inquiries = await prisma.inquiry.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const headers = [
    "Tarih",
    "Durum",
    "Ad Soyad",
    "Firma",
    "Ülke",
    "E-posta",
    "Telefon",
    "Dil",
    "İlgi alanı",
    "Tahmini adet",
    "Mesaj",
    "Ürün sayısı",
    "Toplam adet",
    "Ürünler",
    "İç not",
  ];

  const rows = inquiries.map((i) => [
    i.createdAt.toISOString(),
    i.status,
    i.name,
    i.company,
    i.country,
    i.email,
    i.phone,
    i.locale,
    i.interest,
    i.estimatedQuantity,
    i.message,
    i.items.length,
    i.items.reduce((a, x) => a + (x.quantity ?? 0), 0),
    i.items
      .map((x) =>
        [x.productCode, x.color, x.sizeRun, x.quantity ? `${x.quantity} adet` : null]
          .filter(Boolean)
          .join(" / "),
      )
      .join(" | "),
    i.adminNote,
  ]);

  // Excel'in UTF-8 tanıması için BOM
  const csv =
    "﻿" +
    [headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n");

  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="teklif-talepleri-${date}.csv"`,
      "cache-control": "no-store",
    },
  });
}
