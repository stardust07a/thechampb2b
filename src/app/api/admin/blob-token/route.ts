import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

import { auth } from "@/auth";

/**
 * Tarayıcıdan doğrudan Vercel Blob'a yükleme için istemci jetonu üretir.
 *
 * Vercel'de serverless istek gövdesi 4.5 MB ile sınırlıdır; 20-60 MB'lık
 * videolar sunucudan geçemez. Bu akışta dosya tarayıcıdan doğrudan Blob'a
 * gider, sunucu yalnızca kısa ömürlü bir jeton imzalar.
 *
 * Jeton sadece oturum açmış yöneticiye verilir.
 */

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/avif",
          "video/mp4",
          "video/webm",
          "video/quicktime",
        ],
        maximumSizeInBytes: 200 * 1024 * 1024,
        addRandomSuffix: true,
      }),
      // Yükleme bittiğinde Blob bu ucu çağırır. Kaydı istemci tarafındaki
      // `recordSlot` yazdığı için burada ek iş yok.
      onUploadCompleted: async () => {},
    });

    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Yükleme başlatılamadı" },
      { status: 400 },
    );
  }
}
