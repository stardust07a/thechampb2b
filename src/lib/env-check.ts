import "server-only";

/**
 * Üretim ortamı sağlık kontrolü.
 *
 * Yanlış yapılandırılmış bir yayın sessizce bozuk çalışır: sitemap yanlış
 * alan adı basar, görseller 404 olur, oturum çerezi imzasız kalır. Bunları
 * fark etmenin en kötü yolu ziyaretçinin fark etmesidir.
 *
 * Bu modül sorunları toplar; `/api/health` raporlar, kritik olanlar
 * uygulama başlarken loglanır.
 */

export type EnvIssue = {
  key: string;
  severity: "critical" | "warning";
  message: string;
};

const isProd = process.env.NODE_ENV === "production";

export function checkEnv(): EnvIssue[] {
  const issues: EnvIssue[] = [];
  const need = (key: string, severity: EnvIssue["severity"], message: string) => {
    if (!process.env[key]) issues.push({ key, severity, message });
  };

  need("DATABASE_URL", "critical", "Veritabanı adresi yok; site veri çekemez.");
  need("AUTH_SECRET", "critical", "Oturum imzalama anahtarı yok; panel girişi güvensiz.");
  need("NEXT_PUBLIC_SITE_URL", "critical", "Site adresi yok; sitemap ve canonical yanlış olur.");

  const secret = process.env.AUTH_SECRET ?? "";
  if (secret && secret.length < 32) {
    issues.push({
      key: "AUTH_SECRET",
      severity: "critical",
      message: "Anahtar 32 karakterden kısa. `openssl rand -base64 32` ile üretin.",
    });
  }
  if (isProd && secret.startsWith("dev-only")) {
    issues.push({
      key: "AUTH_SECRET",
      severity: "critical",
      message: "Geliştirme anahtarı yayında kullanılıyor. Mutlaka değiştirin.",
    });
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  if (isProd && site && !site.startsWith("https://")) {
    issues.push({
      key: "NEXT_PUBLIC_SITE_URL",
      severity: "critical",
      message: "Yayında HTTPS adresi olmalı.",
    });
  }
  if (site.endsWith("/")) {
    issues.push({
      key: "NEXT_PUBLIC_SITE_URL",
      severity: "warning",
      message: "Adres sonunda / olmamalı; çift eğik çizgili URL üretir.",
    });
  }

  const db = process.env.DATABASE_URL ?? "";
  if (isProd && db && !/sslmode=require|sslmode=verify/.test(db)) {
    issues.push({
      key: "DATABASE_URL",
      severity: "critical",
      message: "Yayında `sslmode=require` olmalı; bağlantı şifresiz kalıyor.",
    });
  }
  if (isProd && db && !db.includes("-pooler")) {
    issues.push({
      key: "DATABASE_URL",
      severity: "warning",
      message: "Neon'un havuzlu (pooled) adresini kullanın; serverless bağlantı tüketir.",
    });
  }

  if (isProd && !process.env.BLOB_READ_WRITE_TOKEN) {
    issues.push({
      key: "BLOB_READ_WRITE_TOKEN",
      severity: "critical",
      message: "Blob token yok; panelden dosya yüklenemez (Vercel'de public/ yazılamaz).",
    });
  }
  if (isProd && process.env.NEXT_PUBLIC_BLOB_ENABLED !== "1") {
    issues.push({
      key: "NEXT_PUBLIC_BLOB_ENABLED",
      severity: "warning",
      message: 'Yayında "1" olmalı; büyük dosyalar 4.5 MB gövde sınırına takılır.',
    });
  }

  const media = process.env.NEXT_PUBLIC_MEDIA_BASE ?? "";
  if (isProd && (!media || media.startsWith("/"))) {
    issues.push({
      key: "NEXT_PUBLIC_MEDIA_BASE",
      severity: "critical",
      message: "Yayında Blob adresi olmalı; yerel /media yolu 404 döner.",
    });
  }

  if (isProd && (process.env.ADMIN_PASSWORD || process.env.ADMIN_EMAIL)) {
    issues.push({
      key: "ADMIN_PASSWORD",
      severity: "warning",
      message: "İlk kurulumdan sonra bu değişkenleri ortamdan silin.",
    });
  }

  if (!process.env.RESEND_API_KEY) {
    issues.push({
      key: "RESEND_API_KEY",
      severity: "warning",
      message: "E-posta bildirimi gönderilmez; teklifler yalnızca panele düşer.",
    });
  }

  if (isProd && !process.env.UPSTASH_REDIS_REST_URL) {
    issues.push({
      key: "UPSTASH_REDIS_REST_URL",
      severity: "warning",
      message: "Hız sınırı bellekte; çok örnekli ortamda örnek başına ayrı sayar.",
    });
  }

  return issues;
}

/** Uygulama açılırken kritik sorunları görünür kıl. */
export function logEnvIssues(): void {
  const issues = checkEnv();
  const critical = issues.filter((i) => i.severity === "critical");
  if (critical.length === 0) return;
  console.error(
    "\n[ortam] KRİTİK yapılandırma sorunu:\n" +
      critical.map((i) => `  · ${i.key}: ${i.message}`).join("\n") +
      "\n",
  );
}
