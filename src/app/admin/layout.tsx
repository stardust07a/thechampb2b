import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Toaster } from "sonner";

import "../globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Yönetim Paneli — THE CHAMP", template: "%s | THE CHAMP Panel" },
  robots: { index: false, follow: false },
};

/**
 * Panel kendi <html>'ini kurar: arayüz dili TÜRKÇE, her zaman koyu tema,
 * site ile aynı token katmanı (brief §9).
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" dir="ltr" data-theme="dark" className={`${outfit.variable} h-full`}>
      <body className="min-h-full bg-bg text-fg">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                "!bg-[var(--surface-2)] !border-[var(--border)] !text-[var(--text)] !rounded-[var(--radius-sm)]",
              description: "!text-[var(--text-muted)]",
            },
          }}
        />
      </body>
    </html>
  );
}
