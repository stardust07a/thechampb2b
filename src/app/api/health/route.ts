import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkEnv } from "@/lib/env-check";
import { rateLimitBackend } from "@/lib/rate-limit";

/**
 * Sağlık ucu — uptime izleme ve yayın sonrası doğrulama için.
 *
 * Anonim erişimde yalnızca "ayakta mı" bilgisini döner; ortam ayrıntıları
 * sızmasın diye yapılandırma raporu SADECE oturum açmış yöneticiye gösterilir.
 *
 * UptimeRobot / Better Stack gibi bir servisi buraya 5 dakikada bir
 * bakacak şekilde ayarlayın: 200 dışında bir yanıt uyarı üretsin.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  let database: "ok" | "down" = "down";
  let productCount: number | null = null;
  try {
    productCount = await prisma.product.count({ where: { status: "published" } });
    database = "ok";
  } catch {
    database = "down";
  }

  const healthy = database === "ok";
  const session = await auth();

  const body: Record<string, unknown> = {
    status: healthy ? "ok" : "degraded",
    database,
    publishedProducts: productCount,
    responseMs: Date.now() - startedAt,
    time: new Date().toISOString(),
  };

  // Yapılandırma ayrıntısı yalnızca yöneticiye
  if (session?.user) {
    const issues = checkEnv();
    body.config = {
      critical: issues.filter((i) => i.severity === "critical"),
      warnings: issues.filter((i) => i.severity === "warning"),
      rateLimitBackend,
      nodeEnv: process.env.NODE_ENV,
    };
  }

  return Response.json(body, {
    status: healthy ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
