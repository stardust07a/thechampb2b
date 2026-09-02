"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * Teklif sepeti — üyelik yok, localStorage'da tutulur (brief §8.1).
 *
 * localStorage bir dış depo olduğu için `useSyncExternalStore` ile okunuyor:
 * bağlanma anında fazladan render olmuyor, sunucu anlık görüntüsü boş liste
 * olduğu için hydration uyuşmazlığı çıkmıyor. Sekmeler arası `storage` olayı
 * da dinlendiğinden ikinci sekmede yapılan değişiklik anında yansır.
 *
 * Aynı ürün + renk + beden tek satırdır; adet güncellenir. Böylece alıcı
 * aynı modelden S, M ve L bedenlerini ayrı adetlerle listeye ekleyebilir.
 */

export type InquiryItem = {
  productId: string;
  productCode: string;
  productName: string;
  slug: string;
  categorySlug: string;
  color: string | null;
  colorHex: string | null;
  sizeRun: string | null;
  imageKey: string | null;
  quantity: number;
};

const KEY = "thechamp.inquiry.v1";
const EMPTY: InquiryItem[] = [];

/* --------------------------------------------------------------- dış depo */

const listeners = new Set<() => void>();
/** Aynı içerik için aynı referansı döndürmek zorundayız, yoksa sonsuz döngü olur. */
let cache: InquiryItem[] = EMPTY;
let cacheRaw: string | null = null;

function read(): InquiryItem[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY; // özel sekme veya erişim kapalı
  }
  if (raw === cacheRaw) return cache;
  cacheRaw = raw;
  if (!raw) {
    cache = EMPTY;
    return cache;
  }
  try {
    const parsed = JSON.parse(raw);
    cache = Array.isArray(parsed) ? (parsed as InquiryItem[]) : EMPTY;
  } catch {
    cache = EMPTY; // bozuk veri — sepeti boş kabul et
  }
  return cache;
}

function write(items: InquiryItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* kota dolu olabilir; sepet oturum içinde çalışmaya devam eder */
  }
  for (const listener of listeners) listener();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // başka bir sekmede değişirse burada da güncellensin
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function sameLine(
  item: InquiryItem,
  productId: string,
  color: string | null,
  sizeRun?: string | null,
) {
  return (
    item.productId === productId &&
    (item.color ?? null) === (color ?? null) &&
    (item.sizeRun ?? null) === (sizeRun ?? null)
  );
}

/* --------------------------------------------------------------- sağlayıcı */

/**
 * Depo modül seviyesinde olduğu için sağlayıcı state tutmuyor; layout'ta
 * tek bir kez sarmalamak yeterli ve API aynı kalıyor.
 */
export function InquiryProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useInquiry() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);

  // Sunucuda ve ilk boyamada boş liste döner; `ready` ile iskelet gösterilir.
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const add = useCallback(
    (item: Omit<InquiryItem, "quantity"> & { quantity?: number }) => {
      const current = read();
      const index = current.findIndex((x) =>
        sameLine(x, item.productId, item.color ?? null, item.sizeRun ?? null),
      );
      if (index >= 0) {
        const next = [...current];
        next[index] = {
          ...next[index],
          quantity: next[index].quantity + (item.quantity ?? 0),
        };
        write(next);
        return;
      }
      write([...current, { ...item, quantity: item.quantity ?? 0 }]);
    },
    [],
  );

  const update = useCallback(
    (
      productId: string,
      color: string | null,
      sizeRun: string | null,
      patch: Partial<InquiryItem>,
    ) => {
      write(
        read().map((x) =>
          sameLine(x, productId, color, sizeRun) ? { ...x, ...patch } : x,
        ),
      );
    },
    [],
  );

  const remove = useCallback((productId: string, color: string | null, sizeRun: string | null) => {
    write(read().filter((x) => !sameLine(x, productId, color, sizeRun)));
  }, []);

  const clear = useCallback(() => write([]), []);

  return useMemo(
    () => ({
      items,
      count: items.length,
      totalQuantity: items.reduce((a, x) => a + (x.quantity || 0), 0),
      ready,
      add,
      update,
      remove,
      clear,
      has: (productId: string, color: string | null, sizeRun?: string | null) =>
        items.some((x) => sameLine(x, productId, color, sizeRun)),
    }),
    [items, ready, add, update, remove, clear],
  );
}
