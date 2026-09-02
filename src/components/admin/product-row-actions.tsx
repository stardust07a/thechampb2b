"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Copy, MoreHorizontal, Trash2 } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { toast } from "sonner";

import { deleteProduct, duplicateProduct, setProductStatus } from "@/app/admin/actions/products";

export function ProductRowActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      router.refresh();
    });
  }

  const item =
    "flex cursor-pointer items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm outline-none " +
    "text-muted data-[highlighted]:bg-surface data-[highlighted]:text-fg";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        disabled={pending}
        aria-label="İşlemler"
        className="inline-grid size-8 place-items-center rounded-[--radius-inner] text-muted transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <MoreHorizontal className="size-4" aria-hidden />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-48 rounded-[--radius-inner] border border-line bg-surface-2 p-1.5 shadow-card"
        >
          {status !== "published" ? (
            <DropdownMenu.Item
              className={item}
              onSelect={() => run(() => setProductStatus(id, "published"))}
            >
              Yayına al
            </DropdownMenu.Item>
          ) : null}
          {status !== "draft" ? (
            <DropdownMenu.Item
              className={item}
              onSelect={() => run(() => setProductStatus(id, "draft"))}
            >
              Taslağa al
            </DropdownMenu.Item>
          ) : null}
          {status !== "archived" ? (
            <DropdownMenu.Item
              className={item}
              onSelect={() => run(() => setProductStatus(id, "archived"))}
            >
              Arşivle
            </DropdownMenu.Item>
          ) : null}

          <DropdownMenu.Separator className="my-1.5 h-px bg-line" />

          <DropdownMenu.Item
            className={item}
            onSelect={() =>
              startTransition(async () => {
                const result = await duplicateProduct(id);
                if (result.ok && result.id) {
                  toast.success(result.message);
                  router.push(`/admin/products/${result.id}`);
                } else {
                  toast.error(result.message);
                }
              })
            }
          >
            <Copy className="size-4" aria-hidden />
            Kopyala
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className={`${item} !text-danger`}
            onSelect={() => {
              // Geri alınamaz: onay iste (brief §9)
              if (!confirm("Bu ürün kalıcı olarak silinecek. Emin misiniz?")) return;
              run(() => deleteProduct(id));
            }}
          >
            <Trash2 className="size-4" aria-hidden />
            Sil
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
