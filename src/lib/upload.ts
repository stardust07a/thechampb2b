import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

/**
 * Dosya yükleme.
 *
 * BLOB_READ_WRITE_TOKEN varsa Vercel Blob'a, yoksa `public/media/uploads`
 * altına yazar. Vercel'de `public/` yazılabilir değildir; bu yüzden yayında
 * token ZORUNLUDUR. Yerelde token olmadan da çalışır.
 *
 * Dönen değer doğrudan `<img src>` / `<video src>` olarak kullanılabilecek
 * bir adrestir (yerelde `/media/uploads/...`, yayında tam Blob URL'i).
 */

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_VIDEO_BYTES = 60 * 1024 * 1024; // 60 MB

export type UploadKind = "image" | "video";

export type UploadResult =
  | { ok: true; url: string; kind: UploadKind }
  | { ok: false; message: string };

function extensionFor(type: string, name: string): string {
  const fromName = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };
  return map[type] ?? "bin";
}

export async function uploadFile(file: File, slotKey: string): Promise<UploadResult> {
  if (!file || file.size === 0) return { ok: false, message: "Dosya seçilmedi." };

  const isImage = IMAGE_TYPES.has(file.type);
  const isVideo = VIDEO_TYPES.has(file.type);
  if (!isImage && !isVideo) {
    return {
      ok: false,
      message: "Sadece JPG, PNG, WebP, AVIF görsel veya MP4, WebM, MOV video yükleyin.",
    };
  }

  const kind: UploadKind = isVideo ? "video" : "image";
  const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) {
    return {
      ok: false,
      message: `Dosya çok büyük (${Math.round(file.size / 1024 / 1024)} MB). Sınır ${limit / 1024 / 1024} MB.`,
    };
  }

  // Yuva anahtarından güvenli bir dosya adı; içerik özeti önbellek kırar
  const buffer = Buffer.from(await file.arrayBuffer());
  const digest = createHash("sha256").update(buffer).digest("hex").slice(0, 10);
  const safeSlot = slotKey.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const filename = `${safeSlot}-${digest}.${extensionFor(file.type, file.name)}`;

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    try {
      const { put } = await import("@vercel/blob");
      const blob = await put(`media/uploads/${filename}`, buffer, {
        access: "public",
        token,
        contentType: file.type,
        addRandomSuffix: false,
      });
      return { ok: true, url: blob.url, kind };
    } catch (error) {
      console.error("[upload] Blob hatası:", error);
      return { ok: false, message: "Yükleme başarısız (Blob)." };
    }
  }

  try {
    const dir = resolve(process.cwd(), "public/media/uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(resolve(dir, filename), buffer);
    return { ok: true, url: `/media/uploads/${filename}`, kind };
  } catch (error) {
    console.error("[upload] disk hatası:", error);
    return { ok: false, message: "Yükleme başarısız (disk)." };
  }
}

/** Yerelde üretilen benzersiz ad — testler için. */
export const newUploadId = () => randomUUID();
