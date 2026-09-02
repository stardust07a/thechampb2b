"use client";

import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/admin/actions/auth";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="mt-2 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
      >
        <LogOut className="size-4" aria-hidden />
        Çıkış yap
      </button>
    </form>
  );
}
