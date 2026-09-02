"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "./products";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Yetkisiz");
}

/** Site genelinde önbelleği tazele — yuvalar her sayfada okunuyor. */
function revalidateAll() {
  revalidatePath("/[locale]", "layout");
  revalidatePath("/admin/media");
  revalidatePath("/admin/categories");
}

/**
 * Yüklenmiş bir dosyanın adresini yuvaya yazar.
 *
 * Dosyanın kendisi buradan GEÇMEZ: Server Action gövdesi 1 MB ile sınırlı ve
 * Vercel'de istek gövdesi 4.5 MB. Dosya ya `/api/admin/upload` route'una ya da
 * (Blob yapılandırıldıysa) tarayıcıdan doğrudan Blob'a gider; sonrasında
 * sadece adres bu eyleme gelir.
 */
export async function recordSlot(input: {
  slotKey: string;
  url: string;
  kind: "image" | "video";
  sortOrder?: number;
}): Promise<ActionResult> {
  await requireAdmin();

  const slotKey = input.slotKey.trim();
  if (!slotKey) return { ok: false, message: "Yuva belirtilmedi." };
  if (!input.url) return { ok: false, message: "Dosya adresi yok." };

  const kind = input.kind === "video" ? "video" : "image";
  const sortOrder = Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 0;

  await prisma.mediaAsset.upsert({
    where: { key: slotKey },
    update: { url: input.url, kind, sortOrder },
    create: { key: slotKey, url: input.url, kind, sortOrder },
  });

  // Kategori kapağı ayrıca Category.coverImage alanında da tutulur
  if (slotKey.startsWith("category:")) {
    const slug = slotKey.slice("category:".length);
    await prisma.category
      .update({ where: { slug }, data: { coverImage: input.url } })
      .catch(() => null);
  }

  revalidateAll();
  return { ok: true, message: "Yüklendi." };
}

/** Yuvadaki içeriği kaldırır — dosya diskte kalır, sadece bağ kopar. */
export async function clearSlot(slotKey: string): Promise<ActionResult> {
  await requireAdmin();

  await prisma.mediaAsset.deleteMany({ where: { key: slotKey } });

  if (slotKey.startsWith("category:")) {
    const slug = slotKey.slice("category:".length);
    await prisma.category
      .update({ where: { slug }, data: { coverImage: null } })
      .catch(() => null);
  }

  revalidateAll();
  return { ok: true, message: "Kaldırıldı." };
}

/** Video sırasını günceller. */
export async function reorderVideos(keys: string[]): Promise<ActionResult> {
  await requireAdmin();
  await prisma.$transaction(
    keys.map((key, index) =>
      prisma.mediaAsset.updateMany({ where: { key }, data: { sortOrder: index } }),
    ),
  );
  revalidateAll();
  return { ok: true, message: "Sıralama kaydedildi." };
}

/**
 * Bir yuvaya, katalogdaki mevcut bir ürün görselini atar.
 *
 * Fabrika fotoğrafları gelene kadar sayfaların boş kalmaması için kullanılır;
 * bu görseller firmanın kendi çekimleridir, telif sorunu yoktur.
 */
export async function setSlotFromMediaKey(
  slotKey: string,
  mediaKey: string,
): Promise<ActionResult> {
  await requireAdmin();

  const base = (process.env.NEXT_PUBLIC_MEDIA_BASE ?? "/media").replace(/\/$/, "");
  const url = `${base}/full/${mediaKey}`;

  await prisma.mediaAsset.upsert({
    where: { key: slotKey },
    update: { url, kind: "image" },
    create: { key: slotKey, url, kind: "image" },
  });

  if (slotKey.startsWith("category:")) {
    const slug = slotKey.slice("category:".length);
    await prisma.category
      .update({ where: { slug }, data: { coverImage: url } })
      .catch(() => null);
  }

  revalidateAll();
  return { ok: true, message: "Görsel atandı." };
}
