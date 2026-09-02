"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import { clearLoginRateLimit } from "@/lib/rate-limit";

export async function signOutAction() {
  await signOut({ redirectTo: "/admin/login" });
}

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "/admin");

  if (!email || !password) return { error: "E-posta ve şifre gerekli." };

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-posta veya şifre hatalı." };
    }
    throw error;
  }

  await clearLoginRateLimit(email);
  redirect(from.startsWith("/admin") ? from : "/admin");
}
