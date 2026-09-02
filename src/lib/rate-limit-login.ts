/** Giriş denemesi sınırı (brief §9: rate limit'li giriş). 15 dakikada 5 deneme. */

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX = 5;

export function checkLoginRateLimit(email: string): boolean {
  const key = email.toLowerCase();
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX) return false;
  entry.count += 1;
  return true;
}

/** Başarılı girişten sonra sayaç sıfırlanır. */
export function clearLoginRateLimit(email: string): void {
  attempts.delete(email.toLowerCase());
}
