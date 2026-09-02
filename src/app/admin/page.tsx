import Link from "next/link";
import {
  AlertTriangle,
  FileSpreadsheet,
  LayoutList,
  Package,
  Plus,
  Sparkles,
  Table2,
} from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/shell";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Panel ana ekranı — brief §9.
 * Eksik veri uyarıları tıklanabilir: filtrelenmiş ürün listesine gider.
 */
export default async function AdminHome() {
  const session = await auth();

  const [
    totalProducts,
    totalCategories,
    published,
    draft,
    archived,
    bestSeller,
    featured,
    isNew,
    missingPrice,
    missingImages,
    withWarnings,
    recentInquiries,
    newInquiries,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.product.count({ where: { status: "published" } }),
    prisma.product.count({ where: { status: "draft" } }),
    prisma.product.count({ where: { status: "archived" } }),
    prisma.product.count({ where: { isBestSeller: true } }),
    prisma.product.count({ where: { isFeatured: true } }),
    prisma.product.count({ where: { isNew: true } }),
    // ürün fiyatı da kategori fiyatı da boş olanlar
    prisma.product.count({
      where: {
        price1000: null,
        price500: null,
        price300: null,
        price100: null,
        category: { price1000: null, price500: null, price300: null, price100: null },
      },
    }),
    prisma.product.count({ where: { variants: { none: {} } } }),
    prisma.product.count({ where: { NOT: { importWarnings: { isEmpty: true } } } }),
    prisma.inquiry.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        company: true,
        country: true,
        status: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.inquiry.count({ where: { status: "new" } }),
  ]);

  const stats = [
    { label: "Toplam ürün", value: totalProducts, href: "/admin/products" },
    { label: "Kategori", value: totalCategories, href: "/admin/categories" },
    { label: "Yayında", value: published, href: "/admin/products?status=published" },
    { label: "Taslak", value: draft, href: "/admin/products?status=draft" },
    { label: "Arşiv", value: archived, href: "/admin/products?status=archived" },
    { label: "Best Seller", value: bestSeller, href: "/admin/home" },
    { label: "Featured", value: featured, href: "/admin/home" },
    { label: "New", value: isNew, href: "/admin/home" },
  ];

  const warnings = [
    {
      label: "Fiyatı olmayan ürün",
      value: missingPrice,
      href: "/admin/products?missing=price",
      hint: "Ne üründe ne kategoride fiyat var — sitede “Fiyat iste” görünüyor.",
    },
    {
      label: "Görseli olmayan ürün",
      value: missingImages,
      href: "/admin/products?missing=images",
      hint: "Varyantı olmayan ürünler. Görsel eklenene kadar taslakta tutun.",
    },
    {
      label: "İçe aktarma uyarısı olan ürün",
      value: withWarnings,
      href: "/admin/products?missing=warnings",
      hint: "Eşlenmemiş renk veya beden gibi kayıtlar. Kontrol edip düzeltin.",
    },
  ].filter((w) => w.value > 0);

  const quickActions = [
    { label: "Yeni ürün", href: "/admin/products/new", icon: Plus },
    { label: "Toplu fiyat güncelle", href: "/admin/bulk", icon: Table2 },
    { label: "Excel yükle", href: "/admin/import", icon: FileSpreadsheet },
    { label: "Ana sayfa ürünleri", href: "/admin/home", icon: Sparkles },
    { label: "Yeni kategori", href: "/admin/categories", icon: LayoutList },
  ];

  return (
    <AdminShell user={session?.user ?? {}}>
      <header className="mb-8">
        <h1 className="text-h2 font-bold">Genel bakış</h1>
        <p className="mt-2 text-sm text-muted">
          {published} ürün yayında, {totalCategories} kategori.
          {newInquiries > 0 ? ` ${newInquiries} yeni teklif talebi var.` : ""}
        </p>
      </header>

      <section aria-labelledby="quick" className="mb-10">
        <h2 id="quick" className="sr-only">
          Hızlı işlemler
        </h2>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="inline-flex items-center gap-2 rounded-[--radius-pill] border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-chrome-1 hover:text-fg"
            >
              <a.icon className="size-4" aria-hidden />
              {a.label}
            </Link>
          ))}
        </div>
      </section>

      {warnings.length > 0 ? (
        <section aria-labelledby="warnings" className="mb-10">
          <h2 id="warnings" className="eyebrow mb-4 flex items-center gap-2">
            <AlertTriangle className="size-3.5" aria-hidden />
            Eksik veri
          </h2>
          <ul className="grid gap-3 md:grid-cols-3">
            {warnings.map((w) => (
              <li key={w.href}>
                <Link
                  href={w.href}
                  className="block rounded-[--radius-card] border border-line bg-surface p-5 transition-colors hover:border-chrome-1"
                >
                  <p className="tabular text-h3 font-bold text-fg">{w.value}</p>
                  <p className="mt-1 text-sm text-fg">{w.label}</p>
                  <p className="mt-2 text-xs text-muted">{w.hint}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="stats" className="mb-10">
        <h2 id="stats" className="eyebrow mb-4">
          Katalog
        </h2>
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="rounded-[--radius-card] border border-line bg-surface p-5 transition-colors hover:border-chrome-1"
            >
              <dt className="text-xs text-muted">{s.label}</dt>
              <dd className="tabular mt-2 text-h3 font-bold text-fg">{s.value}</dd>
            </Link>
          ))}
        </dl>
      </section>

      <section aria-labelledby="inquiries">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="inquiries" className="eyebrow">
            Son teklif talepleri
          </h2>
          <Link href="/admin/inquiries" className="text-sm text-muted hover:text-fg">
            Tümü →
          </Link>
        </div>

        {recentInquiries.length === 0 ? (
          <p className="rounded-[--radius-card] border border-line bg-surface p-6 text-sm text-muted">
            Henüz teklif talebi yok. Form çalışıyor; ilk talep geldiğinde burada görünecek.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-[--radius-card] border border-line bg-surface">
            {recentInquiries.map((i) => (
              <li key={i.id} className="border-b border-line-soft last:border-0">
                <Link
                  href={`/admin/inquiries/${i.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 transition-colors hover:bg-surface-2"
                >
                  <StatusDot status={i.status} />
                  <span className="font-medium text-fg">{i.name}</span>
                  {i.company ? <span className="text-sm text-muted">{i.company}</span> : null}
                  {i.country ? <span className="text-sm text-faint">{i.country}</span> : null}
                  <span className="tabular ms-auto text-xs text-faint">
                    {i._count.items} ürün ·{" "}
                    {i.createdAt.toLocaleDateString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-4 flex items-center gap-2">
          <Package className="size-3.5" aria-hidden />
          Bekleyen bilgiler
        </h2>
        <ul className="space-y-2 text-sm text-muted">
          <li className="hairline pt-3">
            Fiyatlar bilinçli olarak boş yayına çıktı. Excel yükleyerek veya toplu
            düzenlemeden girdiğiniz anda ürün sayfalarında tablo görünmeye başlar.
          </li>
          <li className="hairline pt-3">
            Fabrika ve üretim görselleri eklenmedi; o bölümler siteye hiç basılmıyor.
            Ayarlar sayfasından yükleyince görünürler.
          </li>
          <li className="hairline pt-3">
            Logo dosyaları, resmî unvan, adres, vergi no ve sertifikalar bekleniyor.
          </li>
        </ul>
      </section>
    </AdminShell>
  );
}

export function StatusDot({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    new: { label: "Yeni", className: "bg-success" },
    in_progress: { label: "Görüşülüyor", className: "bg-chrome-2" },
    quoted: { label: "Teklif gönderildi", className: "bg-chrome-1" },
    closed: { label: "Tamamlandı", className: "bg-faint" },
  };
  const s = map[status] ?? map.new;
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted">
      <span aria-hidden className={cn("size-2 rounded-full", s.className)} />
      {s.label}
    </span>
  );
}
