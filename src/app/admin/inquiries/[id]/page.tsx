import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Mail, Phone } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/shell";
import { InquiryEditor } from "@/components/admin/inquiry-editor";
import { mediaUrl } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: {
              slug: true,
              category: { select: { slug: true } },
              variants: { take: 1, orderBy: { sortOrder: "asc" }, select: { images: true } },
            },
          },
        },
      },
    },
  });

  if (!inquiry) notFound();

  const totalQuantity = inquiry.items.reduce((a, i) => a + (i.quantity ?? 0), 0);

  const facts = [
    { label: "Firma", value: inquiry.company },
    { label: "Ülke", value: inquiry.country },
    { label: "Telefon", value: inquiry.phone, dir: "ltr" as const },
    { label: "İlgi alanı", value: inquiry.interest },
    { label: "Tahmini adet", value: inquiry.estimatedQuantity },
    { label: "Dil", value: inquiry.locale.toUpperCase() },
    {
      label: "Tarih",
      value: inquiry.createdAt.toLocaleString("tr-TR", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    },
  ].filter((f) => f.value);

  return (
    <AdminShell user={session?.user ?? {}}>
      <header className="mb-6">
        <Link
          href="/admin/inquiries"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Teklif talepleri
        </Link>
        <h1 className="mt-3 text-h2 font-bold">{inquiry.company || inquiry.name}</h1>
        {inquiry.company ? <p className="mt-1 text-muted">{inquiry.name}</p> : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-[--radius-card] border border-line bg-surface p-6">
            <h2 className="eyebrow mb-4">İletişim</h2>
            <div className="flex flex-wrap gap-3">
              <a
                href={`mailto:${inquiry.email}`}
                className="inline-flex items-center gap-2 rounded-[--radius-pill] border border-line px-4 py-2 text-sm text-fg transition-colors hover:border-chrome-1"
                dir="ltr"
              >
                <Mail className="size-4" aria-hidden />
                {inquiry.email}
              </a>
              {inquiry.phone ? (
                <a
                  href={`tel:${inquiry.phone.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-2 rounded-[--radius-pill] border border-line px-4 py-2 text-sm text-fg transition-colors hover:border-chrome-1"
                  dir="ltr"
                >
                  <Phone className="size-4" aria-hidden />
                  {inquiry.phone}
                </a>
              ) : null}
            </div>

            {facts.length > 0 ? (
              <dl className="mt-6 text-sm">
                {facts.map((f) => (
                  <div key={f.label} className="hairline flex gap-6 py-3">
                    <dt className="w-32 shrink-0 text-muted">{f.label}</dt>
                    <dd className="text-fg" dir={f.dir}>
                      {f.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {inquiry.message ? (
              <div className="mt-6">
                <h3 className="eyebrow mb-3">Mesaj</h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">
                  {inquiry.message}
                </p>
              </div>
            ) : null}
          </section>

          <section className="rounded-[--radius-card] border border-line bg-surface p-6">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className="eyebrow">Talep edilen ürünler ({inquiry.items.length})</h2>
              {totalQuantity > 0 ? (
                <p className="tabular text-sm text-muted">Toplam {totalQuantity} adet</p>
              ) : null}
            </div>

            {inquiry.items.length === 0 ? (
              <p className="text-sm text-muted">
                Ürün seçilmeden gönderilmiş — genel iletişim talebi.
              </p>
            ) : (
              <ul className="space-y-3">
                {inquiry.items.map((item) => {
                  const image = mediaUrl(item.product?.variants[0]?.images[0], "thumb");
                  return (
                    <li key={item.id} className="flex items-center gap-4">
                      <span className="relative block aspect-[2/3] w-10 shrink-0 overflow-hidden rounded-[6px] bg-surface-2">
                        {image ? (
                          <Image src={image} alt="" fill sizes="40px" className="object-cover" />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-fg">{item.productName}</span>
                        <span className="tabular block text-xs text-faint">
                          {item.productCode}
                          {item.color ? ` · ${item.color}` : ""}
                          {item.sizeRun ? ` · ${item.sizeRun}` : ""}
                        </span>
                      </span>
                      <span className="tabular shrink-0 text-sm text-muted">
                        {item.quantity ? `${item.quantity} adet` : "—"}
                      </span>
                      {item.product ? (
                        <Link
                          href={`/tr/products/${item.product.category.slug}/${item.product.slug}`}
                          target="_blank"
                          className="shrink-0 text-faint transition-colors hover:text-fg"
                          aria-label="Ürünü sitede aç"
                        >
                          <ExternalLink className="size-4" aria-hidden />
                        </Link>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <InquiryEditor
          id={inquiry.id}
          status={inquiry.status}
          adminNote={inquiry.adminNote ?? ""}
        />
      </div>
    </AdminShell>
  );
}
