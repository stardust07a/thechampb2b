"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Chip } from "@/components/ui/chip";

const OPTIONS = [
  { value: "", label: "Tümü" },
  { value: "new", label: "Yeni" },
  { value: "in_progress", label: "Görüşülüyor" },
  { value: "quoted", label: "Teklif gönderildi" },
  { value: "closed", label: "Tamamlandı" },
];

export function InquiryStatusFilter({ counts }: { counts: Record<string, number> }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const current = params.get("status") ?? "";

  function select(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("status", value);
    else next.delete("status");
    next.delete("page");
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname));
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className={`flex flex-wrap gap-2 ${pending ? "opacity-60" : ""}`}>
      {OPTIONS.map((o) => (
        <Chip key={o.value} active={current === o.value} onClick={() => select(o.value)}>
          {o.label}
          <span className="tabular text-[11px] opacity-60">
            {o.value === "" ? total : (counts[o.value] ?? 0)}
          </span>
        </Chip>
      ))}
    </div>
  );
}
