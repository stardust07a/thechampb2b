import type { ReactNode } from "react";
import Image from "next/image";

import { Container } from "@/components/ui/section";
import type { MediaSlotValue } from "@/lib/media-slots";
import { cn } from "@/lib/utils";

type EditorialHeroProps = {
  media: MediaSlotValue | null;
  eyebrow: string;
  title: ReactNode;
  body?: ReactNode;
  titleClassName?: string;
};

/**
 * Kurumsal sayfaların ortak hero yüzeyi.
 *
 * Masaüstünde başlık ve kısa giriş metni görsel üzerinde kalır. Mobilde uzun
 * giriş metni görselden ayrılır; böylece dar ekranda fotoğraf, başlık ve gövde
 * metni birbirinin üstüne binmez.
 */
export function EditorialHero({
  media,
  eyebrow,
  title,
  body,
  titleClassName,
}: EditorialHeroProps) {
  return (
    <section className="border-b border-line">
      <div
        className={cn(
          "editorial-hero relative isolate flex min-h-[30rem] items-end overflow-hidden",
          "md:min-h-[31rem] md:items-center",
          !media && "bg-bg-2",
        )}
      >
        {media ? (
          <>
            <Image
              src={media.url}
              alt=""
              aria-hidden
              fill
              preload
              quality={90}
              sizes="100vw"
              className="editorial-hero-image -z-20 object-cover object-center"
              unoptimized={media.url.startsWith("http")}
            />
            <div aria-hidden className="editorial-hero-scrim absolute inset-0 -z-10" />
          </>
        ) : null}

        <Container className="w-full py-10 md:py-20">
          <p className="eyebrow text-white/70">{eyebrow}</p>
          <h1
            className={cn(
              "mt-5 max-w-[19ch] text-[clamp(2rem,10vw,3.6rem)] font-bold leading-[1.02] tracking-[-0.04em] text-white",
              titleClassName,
            )}
          >
            {title}
          </h1>
          {body ? (
            <div className="mt-7 hidden max-w-3xl text-[17px] leading-relaxed text-white/68 md:block">
              {body}
            </div>
          ) : null}
        </Container>
      </div>

      {body ? (
        <Container className="bg-bg py-8 text-[16px] leading-relaxed text-muted md:hidden">
          {body}
        </Container>
      ) : null}
    </section>
  );
}
