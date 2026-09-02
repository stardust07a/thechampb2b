"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  applyImport,
  previewImport,
  type ImportPreview,
} from "@/app/admin/actions/import";
import { cn } from "@/lib/utils";

/**
 * Excel yükleme sihirbazı — brief §6.3.
 * Dosya seç → önizleme (kaç yeni, kaç güncellenecek, hangi satır hatalı)
 * → onay → uygula. Hatalı satırlar CSV olarak indirilebilir.
 */
export function ImportWizard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [pending, startTransition] = useTransition();
  const [applied, setApplied] = useState<Record<string, number> | null>(null);

  function onFile(formData: FormData) {
    setApplied(null);
    startTransition(async () => {
      const result = await previewImport(formData);
      if (!result.ok) {
        toast.error(result.message);
        setPreview(null);
        return;
      }
      setPreview(result);
      if (result.issues.length > 0) {
        toast.warning(`${result.issues.length} satırda sorun var — raporu inceleyin.`);
      }
    });
  }

  function apply() {
    if (!preview) return;
    startTransition(async () => {
      const result = await applyImport(preview.payload);
      if (result.ok) {
        toast.success(result.message);
        setApplied(result.counts);
        setPreview(null);
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function downloadIssues() {
    if (!preview || preview.issues.length === 0) return;
    const header = "Sayfa;Satır;Sütun;Sorun";
    const rows = preview.issues.map(
      (i) => `"${i.sheet}";${i.row};"${i.column}";"${i.message.replace(/"/g, '""')}"`,
    );
    const csv = "﻿" + [header, ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "excel-hata-raporu.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalWillUpdate = preview
    ? preview.categoryPrices.willUpdate +
      preview.categoryProduction.willUpdate +
      preview.products.willUpdate +
      preview.settings.willUpdate
    : 0;

  return (
    <div className={cn("space-y-6", pending && "opacity-70 transition-opacity")}>
      <form
        action={onFile}
        className="rounded-[--radius-card] border border-line bg-surface p-6"
      >
        <h2 className="eyebrow mb-4">1 — Dosya seç</h2>
        <div className="flex flex-wrap items-center gap-4">
          <input
            ref={inputRef}
            type="file"
            name="file"
            accept=".xlsx,.xlsm"
            required
            className={cn(
              "block w-full max-w-md text-sm text-muted",
              "file:me-4 file:rounded-[--radius-pill] file:border-0 file:bg-surface-2",
              "file:px-4 file:py-2.5 file:text-sm file:text-fg hover:file:bg-line",
            )}
          />
          <Button type="submit" variant="primary" size="md" disabled={pending}>
            <FileSpreadsheet aria-hidden />
            {pending ? "Okunuyor…" : "Önizle"}
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted">
          Beklenen sayfalar: <span className="text-fg">Kategori Fiyat</span>,{" "}
          <span className="text-fg">Kategori Üretim</span>,{" "}
          <span className="text-fg">Ürün İstisnaları</span>,{" "}
          <span className="text-fg">Ayarlar</span>. Hangisi varsa o işlenir; boş bırakılan
          hücreler mevcut değeri değiştirmez.
        </p>
      </form>

      {applied ? (
        <div className="rounded-[--radius-card] border border-success/40 bg-surface p-6">
          <h2 className="flex items-center gap-2.5 text-h3 font-bold text-fg">
            <CheckCircle2 className="size-5 text-success" aria-hidden />
            Yükleme tamamlandı
          </h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-4">
            {Object.entries(applied).map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs text-muted">{key}</dt>
                <dd className="tabular text-h3 font-bold text-fg">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {preview ? (
        <>
          <section className="rounded-[--radius-card] border border-line bg-surface p-6">
            <h2 className="eyebrow mb-4">2 — Önizleme</h2>
            <p className="mb-5 text-sm text-muted">
              Bulunan sayfalar: {preview.sheetsFound.join(", ") || "—"}
            </p>

            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Kategori fiyatı", data: preview.categoryPrices.willUpdate },
                { label: "Kategori üretim", data: preview.categoryProduction.willUpdate },
                { label: "Ürün istisnası", data: preview.products.willUpdate },
                { label: "Ayar", data: preview.settings.willUpdate },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-[--radius-inner] border border-line bg-bg-2 p-4"
                >
                  <dt className="text-xs text-muted">{s.label}</dt>
                  <dd className="tabular mt-1.5 text-h3 font-bold text-fg">{s.data}</dd>
                </div>
              ))}
            </dl>

            {preview.categoryPrices.unknownSlugs.length > 0 ||
            preview.categoryProduction.unknownSlugs.length > 0 ||
            preview.products.unknownCodes.length > 0 ? (
              <div className="mt-6 rounded-[--radius-inner] border border-line bg-bg-2 p-4">
                <p className="flex items-center gap-2 text-sm text-fg">
                  <AlertTriangle className="size-4 text-chrome-2" aria-hidden />
                  Eşleşmeyen kayıtlar atlanacak
                </p>
                {preview.categoryPrices.unknownSlugs.length > 0 ? (
                  <p className="mt-2 text-xs text-muted">
                    Bilinmeyen kategori (fiyat):{" "}
                    {preview.categoryPrices.unknownSlugs.join(", ")}
                  </p>
                ) : null}
                {preview.categoryProduction.unknownSlugs.length > 0 ? (
                  <p className="mt-2 text-xs text-muted">
                    Bilinmeyen kategori (üretim):{" "}
                    {preview.categoryProduction.unknownSlugs.join(", ")}
                  </p>
                ) : null}
                {preview.products.unknownCodes.length > 0 ? (
                  <p className="mt-2 text-xs text-muted">
                    Bilinmeyen ürün kodu: {preview.products.unknownCodes.join(", ")}
                  </p>
                ) : null}
              </div>
            ) : null}

            {preview.issues.length > 0 ? (
              <div className="mt-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-sm text-danger">
                    <AlertTriangle className="size-4" aria-hidden />
                    {preview.issues.length} hatalı hücre
                  </p>
                  <Button variant="ghost" size="sm" onClick={downloadIssues}>
                    <Download aria-hidden />
                    Hata raporunu indir
                  </Button>
                </div>
                <div className="max-h-64 overflow-auto rounded-[--radius-inner] border border-line">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-surface-2">
                      <tr className="text-xs uppercase tracking-[0.06em] text-muted">
                        <th scope="col" className="px-3 py-2 text-start font-medium">Sayfa</th>
                        <th scope="col" className="px-3 py-2 text-start font-medium">Satır</th>
                        <th scope="col" className="px-3 py-2 text-start font-medium">Sütun</th>
                        <th scope="col" className="px-3 py-2 text-start font-medium">Sorun</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.issues.slice(0, 200).map((issue, i) => (
                        <tr key={i} className="border-t border-line-soft">
                          <td className="px-3 py-2 text-muted">{issue.sheet}</td>
                          <td className="tabular px-3 py-2 text-muted">{issue.row}</td>
                          <td className="px-3 py-2 text-muted">{issue.column}</td>
                          <td className="px-3 py-2 text-danger">{issue.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-xs text-faint">
                  Hatalı hücreler boş kabul edilir; o alan değişmeden kalır.
                </p>
              </div>
            ) : null}
          </section>

          <section className="rounded-[--radius-card] border border-chrome-1 bg-surface-2 p-6">
            <h2 className="text-h3 font-bold text-fg">
              3 — Onay: {totalWillUpdate} kayıt güncellenecek
            </h2>
            <p className="mt-3 text-sm text-muted">
              İşlem tek bir transaction içinde yapılır; bir hata olursa hiçbir kayıt
              değişmez. Boş bırakılan hücreler mevcut değerleri silmez.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="solid"
                size="md"
                onClick={apply}
                disabled={pending || totalWillUpdate === 0}
              >
                {pending ? "Uygulanıyor…" : "Onayla ve uygula"}
              </Button>
              <Button variant="ghost" size="md" onClick={() => setPreview(null)}>
                Vazgeç
              </Button>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
