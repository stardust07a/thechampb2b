"use client";

import { createContext, useCallback, useContext, useMemo } from "react";

import { notifyCookieChange, useCookie } from "@/lib/browser-state";
import type { Currency } from "@/lib/format";

/**
 * Ziyaretçi para birimi seçimi cookie'de saklanır (brief §7).
 *
 * Cookie istemcide okunur; sunucu `cookies()` çağırmadığı için sayfalar
 * statik/ISR olarak üretilebiliyor (brief §11). Fiyatların iki para biriminde
 * de değeri sunucudan gelir, hangisinin gösterileceğine tarayıcı karar verir.
 */
const COOKIE = "currency";

const CurrencyContext = createContext<{
  currency: Currency;
  setCurrency: (c: Currency) => void;
}>({ currency: "USD", setCurrency: () => {} });

export function CurrencyProvider({
  defaultCurrency = "USD",
  children,
}: {
  defaultCurrency?: Currency;
  children: React.ReactNode;
}) {
  const raw = useCookie(COOKIE, defaultCurrency);
  const currency: Currency = raw === "EUR" ? "EUR" : "USD";

  const setCurrency = useCallback((next: Currency) => {
    document.cookie = `${COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    notifyCookieChange();
  }, []);

  const value = useMemo(() => ({ currency, setCurrency }), [currency, setCurrency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export const useCurrency = () => useContext(CurrencyContext);
