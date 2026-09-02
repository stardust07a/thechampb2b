"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { clearSlot, recordSlot } from "@/app/admin/actions/media";
import { cn } from "@/lib/utils";

export type SlotState = {
  key: string;
  url: string | null;
  kind: "image" | "video";
};

/** Vercel Blob yapılandırıldıysa dosya tarayıcıdan doğrudan Blob'a gider. */
const BLOB_ENABLED = process.env.NEXT_PUBLIC_BLOB_ENABLED === "1";

const MAX_IMAGE_MB = 8;
const MAX_VIDEO_MB = 60;

/**
 * Tek bir medya yuvası: önizleme + yükle + kaldır.
 *
 * Dosya bir Server Action üzerinden GÖNDERİLMEZ — gövde sınırı 1 MB olduğu
 * için videolar takılıyordu. İki yol var:
 *  · Blob açıksa tarayıcıdan doğrudan Vercel Blob'a (sınır yok),
 *  · değilse `/api/admin/upload` route handler'ına (yerelde sınır yok).
 * Yükleme bitince yalnızca adres `recordSlot` ile kaydedilir.
 *
 * Yuva boşsa sitede o bölüm hiç render edilmez; kart bunu açıkça söyler.
 */
export function MediaSlot({
  slot,
  label,
  hint,
  aspect = "wide",
  accept = "image/*",
  compact = false,
}: {
  slot: SlotState;
  label: string;
  hint?: string;
  aspect?: "wide" | "portrait" | "square";
  accept?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const aspectClass =
    aspect === "portrait" ? "aspect-[3/4]" : aspect === "square" ? "aspect-square" : "aspect-[16/9]";

  async function send(file: File) {
    const isVideo = file.type.startsWith("video/");
    const limitMb = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
    if (file.size > limitMb * 1024 * 1024) {
      toast.error(
        `${label}: dosya ${Math.round(file.size / 1024 / 1024)} MB — sınır ${limitMb} MB.`,
      );
      return;
    }

    setBusy(true);
    setProgress(0);
    try {
      let url: string;

      if (BLOB_ENABLED) {
        const { upload } = await import("@vercel/blob/client");
        const blob = await upload(`media/uploads/${slot.key}-${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/admin/blob-token",
          onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
        });
        url = blob.url;
      } else {
        const data = new FormData();
        data.set("slotKey", slot.key);
        data.set("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: data });
        const json = (await res.json()) as
          | { ok: true; url: string }
          | { ok: false; message: string };
        if (!json.ok) throw new Error(json.message);
        url = json.url;
      }

      setProgress(null);
      startTransition(async () => {
        const result = await recordSlot({
          slotKey: slot.key,
          url,
          kind: isVideo ? "video" : "image",
        });
        if (result.ok) toast.success(`${label}: ${result.message}`);
        else toast.error(result.message);
        router.refresh();
      });
    } catch (error) {
      toast.error(
        `${label}: ${error instanceof Error ? error.message : "yükleme başarısız"}`,
      );
      setProgress(null);
    } finally {
      setBusy(false);
    }
  }

  function remove() {
    startTransition(async () => {
      const result = await clearSlot(slot.key);
      if (result.ok) toast.success(`${label}: ${result.message}`);
      else toast.error(result.message);
      router.refresh();
    });
  }

  const working = busy || pending;

  return (
    <div
      className={cn(
        "rounded-[--radius-card] border border-line bg-surface p-4",
        working && "opacity-70",
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg">{label}</p>
          {hint && !compact ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
        </div>
        {slot.url ? (
          <button
            type="button"
            onClick={remove}
            disabled={working}
            aria-label={`${label} — kaldır`}
            className="size-8 shrink-0 rounded-[--radius-inner] text-faint transition-colors hover:bg-surface-2 hover:text-danger"
          >
            <Trash2 className="mx-auto size-4" aria-hidden />
          </button>
        ) : null}
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void send(file);
        }}
        className={cn(
          "relative block cursor-pointer overflow-hidden rounded-[--radius-inner] border border-dashed",
          "transition-colors",
          aspectClass,
          dragging ? "border-chrome-2 bg-surface-2" : "border-line hover:border-chrome-1",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void send(file);
            e.target.value = "";
          }}
        />

        {slot.url ? (
          slot.kind === "video" ? (
            <video
              src={slot.url}
              muted
              loop
              playsInline
              autoPlay
              className="size-full object-cover"
            />
          ) : (
            <Image
              src={slot.url}
              alt=""
              aria-hidden
              fill
              sizes="320px"
              className="object-cover"
              unoptimized={slot.url.startsWith("http")}
            />
          )
        ) : (
          <span className="absolute inset-0 grid place-items-center px-4 text-center">
            <span className="text-xs text-muted">
              <Upload className="mx-auto mb-2 size-4" aria-hidden />
              Dosya sürükleyin veya tıklayın
              <span className="mt-1 block text-faint">
                Boşken bu bölüm sitede görünmez
              </span>
            </span>
          </span>
        )}

        {progress !== null ? (
          <span
            className="absolute inset-x-0 bottom-0 h-1 bg-surface-2"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span
              className="block h-full bg-chrome-2 transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </span>
        ) : null}
      </label>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-3 w-full"
        disabled={working}
        onClick={() => inputRef.current?.click()}
      >
        {progress !== null
          ? `Yükleniyor %${progress}`
          : working
            ? "Yükleniyor…"
            : slot.url
              ? "Değiştir"
              : "Yükle"}
      </Button>
    </div>
  );
}
