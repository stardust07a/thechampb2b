"use client";

import { useSyncExternalStore } from "react";

/**
 * Sunucunun bilemeyeceği tarayıcı durumlarını (tema, cookie, scroll) okumak için
 * yardımcılar.
 *
 * `useEffect` + `setState` yerine `useSyncExternalStore` kullanıyoruz: bağlama
 * anında fazladan render tetiklemez ve sunucu anlık görüntüsü açıkça verildiği
 * için hydration uyuşmazlığı olmaz.
 */

/** Bir DOM attribute'unu izler. */
export function useDocumentAttribute(
  name: string,
  serverValue: string,
): string {
  return useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: [name] });
      return () => observer.disconnect();
    },
    () => document.documentElement.getAttribute(name) ?? serverValue,
    () => serverValue,
  );
}

/** Sayfa belirli bir eşiğin altına kaydırıldı mı? */
export function useScrolled(threshold = 8): boolean {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("scroll", onChange, { passive: true });
      return () => window.removeEventListener("scroll", onChange);
    },
    () => window.scrollY > threshold,
    () => false,
  );
}

/**
 * Bir cookie'nin değerini okur.
 * Cookie yazımı `document.cookie` üzerinden yapıldığında olay yayılmadığı için
 * `notify` ile elle haber verilir.
 */
const cookieListeners = new Set<() => void>();

export function notifyCookieChange() {
  for (const listener of cookieListeners) listener();
}

export function useCookie(name: string, serverValue: string): string {
  return useSyncExternalStore(
    (onChange) => {
      cookieListeners.add(onChange);
      return () => {
        cookieListeners.delete(onChange);
      };
    },
    () => {
      const match = document.cookie.match(
        new RegExp(`(?:^|;\\s*)${name}=([^;]*)`),
      );
      return match ? decodeURIComponent(match[1]) : serverValue;
    },
    () => serverValue,
  );
}
