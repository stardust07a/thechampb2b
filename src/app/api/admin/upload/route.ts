import { auth } from "@/auth";
import { uploadFile } from "@/lib/upload";

/**
 * Panel dosya yükleme ucu.
 *
 * NEDEN SERVER ACTION DEĞİL: Server Action gövdesi varsayılan olarak 1 MB ile
 * sınırlı; 20-60 MB'lık dikey videolar bu sınıra takılıyordu. Route handler'da
 * böyle bir sınır yok.
 *
 * Vercel'de serverless istek gövdesi 4.5 MB ile sınırlıdır — orada büyük
 * dosyalar tarayıcıdan doğrudan Blob'a yüklenir (`/api/admin/blob-token`),
 * bu uç yalnızca yerel geliştirmede ve kendi sunucunuzda kullanılır.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ ok: false, message: "Yetkisiz" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ ok: false, message: "Dosya okunamadı." }, { status: 400 });
  }

  const slotKey = String(formData.get("slotKey") ?? "").trim();
  const file = formData.get("file");

  if (!slotKey) {
    return Response.json({ ok: false, message: "Yuva belirtilmedi." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return Response.json({ ok: false, message: "Dosya seçilmedi." }, { status: 400 });
  }

  const result = await uploadFile(file, slotKey);
  if (!result.ok) {
    return Response.json({ ok: false, message: result.message }, { status: 400 });
  }

  return Response.json({ ok: true, url: result.url, kind: result.kind });
}
