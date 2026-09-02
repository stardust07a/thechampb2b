import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Giriş" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/admin");

  const { from } = await searchParams;

  return (
    <div className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="chrome-text text-h3 font-bold tracking-[-0.02em]">THE CHAMP</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-faint">
            Yönetim Paneli
          </p>
        </div>

        <div className="rounded-[--radius-card] border border-line bg-surface p-7">
          <LoginForm from={from ?? "/admin"} />
        </div>

        <p className="mt-6 text-center text-xs text-faint">
          Bu alan yetkisiz erişime kapalıdır.
        </p>
      </div>
    </div>
  );
}
