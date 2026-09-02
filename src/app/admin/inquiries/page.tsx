import Link from "next/link";
import { Download } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/shell";
import { Pagination } from "@/components/admin/pagination";
import { InquiryStatusFilter } from "@/components/admin/inquiry-status-filter";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PER_PAGE = 40;

export const STATUS_LABELS: Record<string, string> = {
  new: "Yeni",
  in_progress: "Görüşülüyor",
  quoted: "Teklif gönderildi",
  closed: "Tamamlandı",
};

export const STATUS_CLASSES: Record<string, string> = {
  new: "bg-success/12 text-success",
  in_progress: "bg-chrome-2/12 text-chrome-2",
  quoted: "bg-chrome-1/16 text-chrome-2",
  closed: "bg-surface-2 text-faint",
};

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const where = status ? { status } : {};

  const [inquiries, total, counts] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        name: true,
        company: true,
        country: true,
        email: true,
        status: true,
        createdAt: true,
        locale: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.inquiry.count({ where }),
    prisma.inquiry.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  return (
    <AdminShell user={session?.user ?? {}}>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h2 font-bold">Teklif talepleri</h1>
          <p className="tabular mt-1.5 text-sm text-muted">{total} kayıt</p>
        </div>
        <a
          href={`/api/admin/inquiries.csv${status ? `?status=${status}` : ""}`}
          className="inline-flex items-center gap-2 rounded-[--radius-pill] border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-chrome-1 hover:text-fg"
        >
          <Download className="size-4" aria-hidden />
          CSV indir
        </a>
      </header>

      <InquiryStatusFilter
        counts={Object.fromEntries(counts.map((c) => [c.status, c._count._all]))}
      />

      <div className="mt-6 overflow-x-auto rounded-[--radius-card] border border-line">
        <table className="w-full min-w-[46rem] text-sm">
          <thead className="bg-surface-2">
            <tr className="text-xs uppercase tracking-[0.06em] text-muted">
              <th scope="col" className="px-4 py-3 text-start font-medium">Firma / kişi</th>
              <th scope="col" className="px-4 py-3 text-start font-medium">Ülke</th>
              <th scope="col" className="px-4 py-3 text-start font-medium">E-posta</th>
              <th scope="col" className="px-4 py-3 text-end font-medium">Ürün</th>
              <th scope="col" className="px-4 py-3 text-start font-medium">Durum</th>
              <th scope="col" className="px-4 py-3 text-end font-medium">Tarih</th>
            </tr>
          </thead>
          <tbody className="bg-surface">
            {inquiries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted">
                  Kayıt yok.
                </td>
              </tr>
            ) : (
              inquiries.map((i) => (
                <tr key={i.id} className="border-t border-line-soft hover:bg-surface-2">
                  <td className="px-4 py-3">
                    <Link href={`/admin/inquiries/${i.id}`} className="block">
                      <span className="block text-fg">{i.company || i.name}</span>
                      {i.company ? (
                        <span className="block text-xs text-faint">{i.name}</span>
                      ) : null}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{i.country ?? "—"}</td>
                  <td className="px-4 py-3 text-muted" dir="ltr">
                    {i.email}
                  </td>
                  <td className="tabular px-4 py-3 text-end text-muted">{i._count.items}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-[--radius-pill] px-2.5 py-1 text-xs",
                        STATUS_CLASSES[i.status] ?? STATUS_CLASSES.new,
                      )}
                    >
                      {STATUS_LABELS[i.status] ?? i.status}
                    </span>
                  </td>
                  <td className="tabular px-4 py-3 text-end text-faint">
                    {i.createdAt.toLocaleDateString("tr-TR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} perPage={PER_PAGE} total={total} />
    </AdminShell>
  );
}
