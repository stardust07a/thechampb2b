"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/input";
import { updateInquiry } from "@/app/admin/actions/catalog";

/** Teklif talebi durumu ve not (brief §9). */
export function InquiryEditor({
  id,
  status: initialStatus,
  adminNote: initialNote,
}: {
  id: string;
  status: string;
  adminNote: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus);
  const [note, setNote] = useState(initialNote);

  const dirty = status !== initialStatus || note !== initialNote;

  function save() {
    startTransition(async () => {
      const result = await updateInquiry(id, { status, adminNote: note });
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <aside className="h-fit space-y-5 rounded-[--radius-card] border border-line bg-surface p-6 lg:sticky lg:top-6">
      <h2 className="eyebrow">Durum ve not</h2>

      <div>
        <Label htmlFor="status">Durum</Label>
        <Select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="new">Yeni</option>
          <option value="in_progress">Görüşülüyor</option>
          <option value="quoted">Teklif gönderildi</option>
          <option value="closed">Tamamlandı</option>
        </Select>
      </div>

      <div>
        <Label htmlFor="adminNote">İç not</Label>
        <Textarea
          id="adminNote"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Görüşme notları, verilen fiyat, takip tarihi…"
          className="min-h-40"
        />
        <p className="mt-2 text-xs text-faint">Bu not sadece panelde görünür.</p>
      </div>

      <Button variant="solid" size="md" onClick={save} disabled={!dirty || pending}>
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </Button>
    </aside>
  );
}
