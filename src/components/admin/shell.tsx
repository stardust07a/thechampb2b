import {
  FileDown,
  FileSpreadsheet,
  ImageIcon,
  Inbox,
  LayoutDashboard,
  LayoutList,
  Package,
  Settings,
  Sparkles,
  Table2,
} from "lucide-react";
import Link from "next/link";

import { SignOutButton } from "./sign-out-button";
import { AdminNavLink } from "./admin-nav-link";

const NAV = [
  { href: "/admin", label: "Genel bakış", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Ürünler", icon: Package },
  { href: "/admin/bulk", label: "Toplu düzenleme", icon: Table2 },
  { href: "/admin/categories", label: "Kategoriler", icon: LayoutList },
  { href: "/admin/home", label: "Ana sayfa", icon: Sparkles },
  { href: "/admin/media", label: "Medya", icon: ImageIcon },
  { href: "/admin/inquiries", label: "Teklif talepleri", icon: Inbox },
  { href: "/admin/import", label: "Excel yükle", icon: FileSpreadsheet },
  { href: "/admin/catalog", label: "PDF katalog", icon: FileDown },
  { href: "/admin/settings", label: "Ayarlar", icon: Settings },
];

export function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { email?: string | null; name?: string | null };
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-bg-2 lg:flex">
        <div className="border-b border-line px-5 py-5">
          <Link href="/admin" className="block">
            <span className="chrome-text text-[15px] font-bold tracking-[-0.02em]">
              THE CHAMP
            </span>
            <span className="mt-0.5 block text-[11px] uppercase tracking-[0.16em] text-faint">
              Yönetim
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 p-3" aria-label="Panel menüsü">
          {NAV.map((item) => (
            <AdminNavLink key={item.href} href={item.href} exact={item.exact}>
              <item.icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </AdminNavLink>
          ))}
        </nav>

        <div className="border-t border-line p-4">
          <p className="truncate text-xs text-faint">{user.email}</p>
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobil menü */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-line bg-bg-2 px-3 py-2 lg:hidden">
          {NAV.map((item) => (
            <AdminNavLink key={item.href} href={item.href} exact={item.exact} compact>
              <item.icon className="size-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">{item.label}</span>
            </AdminNavLink>
          ))}
        </div>

        <main className="min-w-0 flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
