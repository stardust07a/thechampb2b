"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export type ReelVideo = { key: string; url: string; alt: string };

/**
 * Dikey (9:16) üretim videoları — yatay kayan şerit.
 *
 * Videolar sessiz, döngülü ve `playsInline` başlar; otomatik oynatma ancak
 * sessizken izin verilir. Ses açma düğmesi tek videoyu sesli yapar ve
 * diğerlerini susturur, aynı anda iki ses çalmasın diye.
 *
 * `preload="none"` + `IntersectionObserver` yerine tarayıcının kendi tembel
 * davranışına bırakıldı: şerit yatay kaydığı için ekran dışındaki videolar
 * zaten indirilmez.
 */
export function VideoReel({ videos }: { videos: ReelVideo[] }) {
  const t = useTranslations("common");
  const scrollerRef = useRef<HTMLUListElement>(null);
  const refs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [unmuted, setUnmuted] = useState<string | null>(null);

  if (videos.length === 0) return null;

  function toggleSound(key: string) {
    const next = unmuted === key ? null : key;
    for (const [k, el] of refs.current) {
      el.muted = k !== next;
      if (k === next) void el.play().catch(() => {});
    }
    setUnmuted(next);
  }

  function scroll(direction: -1 | 1) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const rtl = document.documentElement.dir === "rtl";
    scroller.scrollBy({
      left: scroller.clientWidth * 0.72 * direction * (rtl ? -1 : 1),
      behavior: "smooth",
    });
  }

  return (
    <div className="relative">
      <ul
        ref={scrollerRef}
        className={cn(
          "no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-1 md:gap-5 md:px-10 lg:px-14",
          videos.length <= 2 && "justify-center",
        )}
      >
        {videos.map((video, index) => {
          const active = unmuted === video.key;
          return (
            <li
              key={video.key}
              className="w-[72vw] max-w-[22rem] shrink-0 snap-center sm:w-[43vw] md:w-[31vw] lg:w-[23vw] xl:w-[20vw] 2xl:w-[18vw]"
            >
              <div className="group relative aspect-[9/16] overflow-hidden rounded-[--radius-card] border border-line bg-surface shadow-soft">
                <video
                  ref={(el) => {
                    if (el) refs.current.set(video.key, el);
                    else refs.current.delete(video.key);
                  }}
                  src={video.url}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="metadata"
                  aria-label={video.alt || undefined}
                  onLoadedMetadata={(event) => {
                    event.currentTarget.parentElement?.style.setProperty(
                      "--video-duration",
                      `${event.currentTarget.duration}s`,
                    );
                  }}
                  className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"
                />

                <div aria-hidden className="absolute inset-x-4 top-4 z-10 h-px overflow-hidden bg-white/35">
                  <span className="video-reel-progress block h-full bg-white" />
                </div>

                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/65 to-transparent"
                />

                <span className="tabular absolute start-4 bottom-4 text-xs font-medium tracking-[0.16em] text-white/80">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <button
                  type="button"
                  onClick={() => toggleSound(video.key)}
                  aria-pressed={active}
                  aria-label={active ? t("muteVideo") : t("unmuteVideo")}
                  className={cn(
                    "absolute end-3 bottom-3 grid size-10 place-items-center rounded-full",
                    "border border-white/25 bg-black/45 text-white backdrop-blur-md",
                    "transition-colors hover:border-white/50 hover:bg-black/65",
                  )}
                >
                  {active ? (
                    <Volume2 className="size-4" aria-hidden />
                  ) : (
                    <VolumeX className="size-4" aria-hidden />
                  )}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {videos.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label={t("previousVideos")}
            className="absolute start-3 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-bg/90 text-fg shadow-soft backdrop-blur-md transition-transform hover:scale-105 md:start-6"
          >
            <ChevronLeft className="size-5 rtl:-scale-x-100" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label={t("nextVideos")}
            className="absolute end-3 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-bg/90 text-fg shadow-soft backdrop-blur-md transition-transform hover:scale-105 md:end-6"
          >
            <ChevronRight className="size-5 rtl:-scale-x-100" aria-hidden />
          </button>
        </>
      ) : null}
    </div>
  );
}
