import type { ReactNode } from "react";

/**
 * Kök layout sadece children'ı geçirir; gerçek <html>/<body>
 * [locale] layout'unda kurulur (lang ve dir locale'e bağlı).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
