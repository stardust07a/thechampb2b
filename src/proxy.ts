import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";
import { auth } from "@/auth";

/**
 * İki iş yapar:
 *
 * 1. /admin — oturum yoksa /admin/login'e yönlendirir (brief §9).
 *    Panel çok dilli değildir, arayüzü Türkçedir; locale yönlendirmesinin
 *    dışında tutulur.
 * 2. Diğer her şey — next-intl. Accept-Language'e göre BİR KEZ yönlendirir ve
 *    tercihi cookie'ye yazar. Engelleyici dil modalı YOK (brief §10, §17.5).
 *
 * Next 16'da bu dosya `middleware` değil `proxy` adını taşır.
 */

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();

    const session = await auth();
    if (!session?.user) {
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // API, statik dosyalar ve medya dışındaki her şey
    "/((?!api|_next|_vercel|media|.*\\..*).*)",
  ],
};
