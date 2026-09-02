import "server-only";

/**
 * Hız sınırı.
 *
 * Vercel'de her istek ayrı bir lambda örneğine düşebilir; bellekte tutulan
 * sayaç örnekler arasında paylaşılmaz ve sınır pratikte örnek sayısı kadar
 * gevşer. Bu yüzden Upstash Redis yapılandırılmışsa PAYLAŞILAN sayaç
 * kullanılır; yoksa bellek içi sayaca düşülür (yerel geliştirme ve tek
 * sunuculu kurulum için yeterli).
 *
 * Yapılandırma (Vercel → Storage → Upstash Redis, ya da upstash.com):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

export type RateLimitResult = { ok: boolean; retryAfterSec: number };

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const rateLimitBackend: "redis" | "memory" = REDIS_URL && REDIS_TOKEN ? "redis" : "memory";

/* ------------------------------------------------------------ bellek içi */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function memoryLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    // sızıntıyı önlemek için ara sıra temizle
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) if (now > b.resetAt) buckets.delete(k);
    }
    return { ok: true, retryAfterSec: 0 };
  }

  if (bucket.count >= max) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

/* ----------------------------------------------------------------- redis */

/**
 * Upstash REST API üzerinden atomik sayaç: INCR + ilk artışta EXPIRE.
 * Pipeline tek istekte gider, ek bağımlılık gerekmez.
 */
async function redisLimit(key: string, max: number, windowMs: number): Promise<RateLimitResult> {
  const windowSec = Math.ceil(windowMs / 1000);
  const redisKey = `rl:${key}`;

  const response = await fetch(`${REDIS_URL}/pipeline`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${REDIS_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", redisKey],
      ["TTL", redisKey],
    ]),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Upstash ${response.status}`);

  const [incr, ttl] = (await response.json()) as { result: number }[];
  const count = incr.result;
  let remaining = ttl.result;

  // İlk artışta anahtarın ömrü yok; pencereyi burada kuruyoruz.
  if (remaining < 0) {
    await fetch(`${REDIS_URL}/expire/${encodeURIComponent(redisKey)}/${windowSec}`, {
      headers: { authorization: `Bearer ${REDIS_TOKEN}` },
      cache: "no-store",
    });
    remaining = windowSec;
  }

  if (count > max) return { ok: false, retryAfterSec: remaining };
  return { ok: true, retryAfterSec: 0 };
}

/* ------------------------------------------------------------------ ortak */

async function limit(key: string, max: number, windowMs: number): Promise<RateLimitResult> {
  if (rateLimitBackend === "redis") {
    try {
      return await redisLimit(key, max, windowMs);
    } catch (error) {
      // Redis erişilemezse isteği reddetmek yerine bellek içi sayaca düş:
      // form tamamen çalışmaz hale gelmesin.
      console.warn("[rate-limit] Redis erişilemedi, belleğe düşüldü:", error);
    }
  }
  return memoryLimit(key, max, windowMs);
}

/** Teklif formu — brief §8.2: IP başına 5 dakikada 3 gönderim. */
export function checkRateLimit(key: string): Promise<RateLimitResult> {
  return limit(key, 3, 5 * 60 * 1000);
}

/** Panel girişi — 15 dakikada 5 deneme. */
export function checkLoginRateLimit(email: string): Promise<RateLimitResult> {
  return limit(`login:${email.toLowerCase()}`, 5, 15 * 60 * 1000);
}

/** Başarılı girişten sonra sayaç sıfırlanır. */
export async function clearLoginRateLimit(email: string): Promise<void> {
  const key = `login:${email.toLowerCase()}`;
  buckets.delete(key);
  if (rateLimitBackend === "redis") {
    await fetch(`${REDIS_URL}/del/${encodeURIComponent(`rl:${key}`)}`, {
      headers: { authorization: `Bearer ${REDIS_TOKEN}` },
      cache: "no-store",
    }).catch(() => null);
  }
}
