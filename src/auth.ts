import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { checkLoginRateLimit } from "@/lib/rate-limit";

/**
 * Auth.js — sadece admin, tek rol (brief §9).
 * Girişte rate limit var; şifreler bcrypt ile saklanır.
 */

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  pages: { signIn: "/admin/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const limit = await checkLoginRateLimit(email);
        if (!limit.ok) return null;

        const user = await prisma.adminUser.findUnique({ where: { email } });
        // kullanıcı yoksa da bcrypt çalıştır: zamanlama farkı sızdırmasın
        const hash = user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi";
        const valid = await bcrypt.compare(password, hash);
        if (!user || !valid) return null;

        return { id: user.id, email: user.email, name: user.name ?? "Admin" };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      return session;
    },
    authorized({ auth }) {
      return Boolean(auth?.user);
    },
  },
});
