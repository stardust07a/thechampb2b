"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { bulkUpdate, updateProductField } from "@/app/admin/actions/products";
import { cn } from "@/lib/utils";

export type BulkRow = {
  id: string;
  productCode: string;
  name: string;
  categoryName: string;
  status: string;
  price100: string;
  price300: string;
  price500: string;
  price1000: string;
  gsm: string;
  moq: string;
  leadTimeDays: string;
};

const EDITABLE = ["price100", "price300", "price500", "price1000", "gsm", "moq", "leadTimeDays"] as const;
type EditableField = (typeof EDITABLE)[number];

const HEADERS: { key: EditableField; label: string }[] = [
  { key: "price100", label: "100+" },
  { key: "price300", label: "300+" },
  { key: "price500", label: "500+" },
  { key: "price1000", label: "1000+" },
  { key: "gsm", label: "Gramaj" },
  { key: "moq", label: "MOQ" },
  { key: "leadTimeDays", label: "Termin" },
];

/**
 * Toplu düzenleme — brief §9.
 * İki mod bir arada: (a) tablo üzerinde hücre hücre düzenleme (Excel hissi),
 * (b) seçilenlerin hepsine aynı değeri yazma. (b) kaydetmeden önce kaç ürünün
 * etkileneceğini gösterir ve onay ister.
 */
export function BulkEditor({
  rows,
  categories,
}: {
  rows: BulkRow[];
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [patch, setPatch] = useState<Record<string, string>>({});
  const [local, setLocal] = useState<Record<string, Partial<BulkRow>>>({});

  const allSelected = rows.length > 0 && selected.size === rows.length;

  const filledFields = useMemo(
    () => Object.entries(patch).filter(([, v]) => v.trim() !== ""),
    [patch],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }

  /** Hücre odaktan çıkınca kaydet — değer değişmediyse istek atma. */
  function commitCell(row: BulkRow, field: EditableField, value: string) {
    const original = local[row.id]?.[field] ?? row[field];
    if (value === original) return;
    setLocal((prev) => ({ ...prev, [row.id]: { ...prev[row.id], [field]: value } }));

    startTransition(async () => {
      const result = await updateProductField(row.id, field, value);
      if (!result.ok) {
        toast.error(result.message, { description: row.productCode });
        // başarısızsa görünen değeri geri al
        setLocal((prev) => ({ ...prev, [row.id]: { ...prev[row.id], [field]: original } }));
        return;
      }
      toast.success(`${row.productCode} güncellendi`);
    });
  }

  function applyBulk() {
    startTransition(async () => {
      const result = await bulkUpdate({
        ids: [...selected],
        ...Object.fromEntries(filledFields),
      });
      if (result.ok) {
        toast.success(result.message);
        setConfirming(false);
        setPatch({});
        setSelected(new Set());
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  const cellValue = (row: BulkRow, field: EditableField) =>
    local[row.id]?.[field] ?? row[field];

  return (
    <div className={cn("space-y-6", pending && "opacity-70 transition-opacity")}>
      {/* --------------------------------------------- seçilenlere aynı değer */}
      <section className="rounded-[--radius-card] border border-line bg-surface p-6">
        <h2 className="eyebrow mb-1">Seçilenlere aynı değeri yaz</h2>
        <p className="mb-5 text-xs text-muted">
          Sadece doldurduğunuz alanlar yazılır; boş bıraktıklarınız değişmeden kalır.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HEADERS.map((h) => (
            <div key={h.key}>
              <Label htmlFor={`bulk-${h.key}`}>{h.label}</Label>
              <Input
                id={`bulk-${h.key}`}
                value={patch[h.key] ?? ""}
                onChange={(e) => setPatch((p) => ({ ...p, [h.key]: e.target.value }))}
                placeholder="değiştirme"
                className="tabular"
              />
            </div>
          ))}
          <div>
            <Label htmlFor="bulk-categoryId">Kategori</Label>
            <Select
              id="bulk-categoryId"
              value={patch.categoryId ?? ""}
              onChange={(e) => setPatch((p) => ({ ...p, categoryId: e.target.value }))}
            >
              <option value="">değiştirme</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="bulk-status">Durum</Label>
            <Select
              id="bulk-status"
              value={patch.status ?? ""}
              onChange={(e) => setPatch((p) => ({ ...p, status: e.target.value }))}
            >
              <option value="">değiştirme</option>
              <option value="published">Yayında</option>
              <option value="draft">Taslak</option>
              <option value="archived">Arşiv</option>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="bulk-fabricTr">Kumaş (TR)</Label>
            <Input
              id="bulk-fabricTr"
              value={patch.fabricTr ?? ""}
              onChange={(e) => setPatch((p) => ({ ...p, fabricTr: e.target.value }))}
              placeholder="değiştirme"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="bulk-fabricEn">Kumaş (EN)</Label>
            <Input
              id="bulk-fabricEn"
              value={patch.fabricEn ?? ""}
              onChange={(e) => setPatch((p) => ({ ...p, fabricEn: e.target.value }))}
              placeholder="değiştirme"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button
            type="button"
            variant="solid"
            size="md"
            disabled={selected.size === 0 || filledFields.length === 0 || pending}
            onClick={() => setConfirming(true)}
          >
            Uygula
          </Button>
          <p className="text-sm text-muted">
            {selected.size} ürün seçili · {filledFields.length} alan doldurulmuş
          </p>
        </div>
      </section>

      {/* --------------------------------------------------------- onay ekranı */}
      {confirming ? (
        <div
          role="alertdialog"
          aria-labelledby="bulk-confirm-title"
          className="rounded-[--radius-card] border border-chrome-1 bg-surface-2 p-6"
        >
          <h3
            id="bulk-confirm-title"
            className="flex items-center gap-2.5 text-h3 font-bold text-fg"
          >
            <AlertTriangle className="size-5 text-chrome-2" aria-hidden />
            {selected.size} ürün güncellenecek
          </h3>
          <p className="mt-3 text-sm text-muted">Yazılacak değerler:</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {filledFields.map(([key, value]) => (
              <li key={key} className="flex gap-4">
                <span className="w-32 shrink-0 text-muted">{key}</span>
                <span className="tabular text-fg">{value}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">
            Bu işlem geri alınamaz. Devam etmeden önce seçimi kontrol edin.
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="solid" size="md" onClick={applyBulk} disabled={pending}>
              {pending ? "Uygulanıyor…" : "Onayla ve uygula"}
            </Button>
            <Button variant="ghost" size="md" onClick={() => setConfirming(false)}>
              Vazgeç
            </Button>
          </div>
        </div>
      ) : null}

      {/* --------------------------------------------------- hücre hücre tablo */}
      <div className="overflow-x-auto rounded-[--radius-card] border border-line">
        <table className="w-full min-w-[64rem] text-sm">
          <thead className="bg-surface-2">
            <tr className="text-xs uppercase tracking-[0.06em] text-muted">
              <th scope="col" className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Tümünü seç"
                  className="size-4 rounded-[4px] border-line bg-surface accent-[var(--chrome-2)]"
                />
              </th>
              <th scope="col" className="px-3 py-3 text-start font-medium">Ürün</th>
              <th scope="col" className="px-3 py-3 text-start font-medium">Kategori</th>
              {HEADERS.map((h) => (
                <th key={h.key} scope="col" className="px-2 py-3 text-end font-medium">
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-surface">
            {rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "border-t border-line-soft",
                  selected.has(row.id) && "bg-surface-2",
                )}
              >
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggle(row.id)}
                    aria-label={`${row.productCode} seç`}
                    className="size-4 rounded-[4px] border-line bg-surface accent-[var(--chrome-2)]"
                  />
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/admin/products/${row.id}`}
                    className="block max-w-[20rem] truncate text-fg hover:text-muted"
                  >
                    {row.name}
                  </Link>
                  <span className="tabular text-xs text-faint">{row.productCode}</span>
                </td>
                <td className="px-3 py-2 text-muted">{row.categoryName}</td>
                {HEADERS.map((h) => (
                  <td key={h.key} className="px-1 py-1">
                    <input
                      defaultValue={cellValue(row, h.key)}
                      onBlur={(e) => commitCell(row, h.key, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") {
                          e.currentTarget.value = cellValue(row, h.key);
                          e.currentTarget.blur();
                        }
                      }}
                      aria-label={`${row.productCode} ${h.label}`}
                      className={cn(
                        "tabular h-8 w-full rounded-[6px] border border-transparent bg-transparent",
                        "px-2 text-end text-sm text-fg transition-colors",
                        "hover:border-line focus:border-chrome-1 focus:bg-surface-2 focus:outline-none",
                      )}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
