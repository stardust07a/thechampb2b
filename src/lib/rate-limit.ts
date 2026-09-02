/**
 * Basit bellek içi rate limit (brief §8.2: IP başına 5 dakikada 3 gönderim).
 *
 * Tek sunucu örneği için yeterlidir. Vercel'de birden fazla lambda örneği
 * olabileceği için üst sınır pratikte biraz gevşer; kötüye kullanımı
 * yavaşlatmak amacıyla yeterli, kritik güvenlik katmanı değildir.
 * Kalıcı bir sınır gerekirse Upstash Redis'e taşınır.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 5 * 60 * 1000;
const MAX = 3;

export function checkRateLimit(key: string): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    // sızıntıyı önlemek için ara sıra temizle
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) if (now > b.resetAt) buckets.delete(k);
    }
    return { ok: true, retryAfterSec: 0 };
  }

  if (bucket.count >= MAX) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, retryAfterSec: 0 };
}
