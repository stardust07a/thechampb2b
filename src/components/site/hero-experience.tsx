"use client";

import Image from "next/image";
import { ArrowDown, ArrowRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type HeroStage = {
  label: string;
  body: string;
};

type HeroExperienceProps = {
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  exploreLabel: string;
  quoteLabel: string;
  skipLabel: string;
  progressLabel: string;
  videoLabel: string;
  stages: HeroStage[];
};

const VIDEO_DURATION = 7.04;
const STAGE_STOPS = [0.08, 0.3, 0.5, 0.7, 0.9];
const STAGE_THRESHOLDS = [0.22, 0.4, 0.64, 0.8];
const RAIL_TICKS = 21;

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function stageFromProgress(progress: number) {
  const next = STAGE_THRESHOLDS.findIndex((threshold) => progress < threshold);
  return next === -1 ? STAGE_THRESHOLDS.length : next;
}

export function HeroExperience({
  eyebrow,
  titleLine1,
  titleLine2,
  subtitle,
  exploreLabel,
  quoteLabel,
  skipLabel,
  progressLabel,
  videoLabel,
  stages,
}: HeroExperienceProps) {
  const shellRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const durationRef = useRef(VIDEO_DURATION);
  const [activeStage, setActiveStage] = useState(0);
  const [activeTick, setActiveTick] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  /** Video yüklenemez veya çözülemezse yedek görsele düşeriz. */
  const [videoFailed, setVideoFailed] = useState(false);

  const measureProgress = useCallback(() => {
    const shell = shellRef.current;
    if (!shell) return 0;

    const top = window.scrollY + shell.getBoundingClientRect().top;
    const travel = Math.max(1, shell.offsetHeight - window.innerHeight);
    return clamp((window.scrollY - top) / travel);
  }, []);

  const renderProgress = useCallback(() => {
    if (reducedMotion) return;

    const progress = measureProgress();
    const video = videoRef.current;
    if (video?.readyState) {
      const targetTime = progress * durationRef.current;
      if (Math.abs(video.currentTime - targetTime) > 0.025) {
        video.currentTime = targetTime;
      }
    }

    const nextStage = stageFromProgress(progress);
    const nextTick = Math.round(progress * (RAIL_TICKS - 1));
    setActiveStage((current) => (current === nextStage ? current : nextStage));
    setActiveTick((current) => (current === nextTick ? current : nextTick));
  }, [measureProgress, reducedMotion]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    const frame = requestAnimationFrame(updateMotion);
    media.addEventListener("change", updateMotion);
    return () => {
      cancelAnimationFrame(frame);
      media.removeEventListener("change", updateMotion);
    };
  }, []);

  useEffect(() => {
    // İlk ölçüm bir sonraki kareye alınıyor: efekt içinde doğrudan setState
    // çağırmak zincirleme render tetikliyor (react-hooks/set-state-in-effect).
    // Davranış aynı — ilk boyamadan hemen sonra ilerleme yazılır.
    const frame = requestAnimationFrame(renderProgress);
    window.addEventListener("scroll", renderProgress, { passive: true });
    window.addEventListener("resize", renderProgress);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", renderProgress);
      window.removeEventListener("resize", renderProgress);
    };
  }, [renderProgress]);

  const syncVideoMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    if (Number.isFinite(video.duration)) durationRef.current = video.duration;
    video.currentTime = measureProgress() * durationRef.current;
  };

  const scrollToStage = (stageIndex: number) => {
    const shell = shellRef.current;
    if (!shell) return;
    const top = window.scrollY + shell.getBoundingClientRect().top;
    const travel = Math.max(1, shell.offsetHeight - window.innerHeight);
    window.scrollTo({
      top: top + travel * STAGE_STOPS[stageIndex],
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };

  const skipIntro = () => {
    document.getElementById("home-content")?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  /**
   * Hareket azaltma açıkken (Windows'ta "Animasyon efektleri" kapalı olduğunda
   * da tetiklenir) kaydırmaya bağlı sahne ilerlemesi çalışmaz. Bu durumda
   * ziyaretçiyi 01. sahnede bırakmak yerine doğrudan SON sahneyi gösteriyoruz:
   * marka başlığı ve iki CTA görünür kalsın. Video yerine sabit kare basılır.
   */
  const staticHero = reducedMotion || videoFailed;
  const stageIndex = staticHero ? stages.length - 1 : activeStage;
  const currentStage = stages[stageIndex] ?? stages[0];
  const isFinalStage = stageIndex === stages.length - 1;

  return (
    <section
      ref={shellRef}
      className="cinema-hero-shell relative bg-cinema-bg"
      aria-labelledby="home-hero-title"
    >
      <div className="cinema-hero-sticky isolate overflow-hidden border-b border-white/10 bg-cinema-bg text-cinema-text">
        <video
          ref={videoRef}
          className="cinema-hero-video absolute inset-0 -z-30 size-full object-cover object-center"
          muted
          playsInline
          preload="metadata"
          poster="/media/hero/home-journey-start.jpg"
          aria-label={videoLabel}
          onLoadedMetadata={syncVideoMetadata}
          onError={() => setVideoFailed(true)}
          style={staticHero ? { display: "none" } : undefined}
        >
          <source
            src="/media/hero/home-journey-mobile.mp4"
            type="video/mp4"
            media="(max-width: 767px)"
          />
          <source src="/media/hero/home-journey.webm" type="video/webm" />
          <source src="/media/hero/home-journey.mp4" type="video/mp4" />
        </video>

        <div
          className="cinema-video-fallback absolute inset-0 -z-30"
          style={staticHero ? { display: "block" } : undefined}
        >
          <Image
            src="/media/hero/home-journey-final.jpg"
            alt=""
            aria-hidden
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
        <div aria-hidden className="cinema-hero-scrim absolute inset-0 -z-20" />
        <div aria-hidden className="cinema-hero-vignette absolute inset-0 -z-10" />

        <Container className="flex h-full items-center py-10 md:py-14">
          <h1 id="home-hero-title" className="sr-only">
            {titleLine1} {titleLine2}
          </h1>

          {!isFinalStage ? (
            <div
              key={activeStage}
              className="hero-stage-copy max-w-[36rem] pe-12 md:pe-20"
              aria-live="polite"
            >
              <p className="tabular text-xs font-medium tracking-[0.18em] text-white/55">
                {String(activeStage + 1).padStart(2, "0")} / {String(stages.length).padStart(2, "0")}
              </p>
              <h2 className="mt-4 text-[clamp(2.25rem,6vw,5.25rem)] font-bold uppercase leading-[0.92] tracking-[-0.045em] text-cinema-text">
                {currentStage?.label}
              </h2>
              <p className="mt-4 max-w-[30rem] border-s border-white/35 ps-4 text-[clamp(1rem,2vw,1.2rem)] leading-relaxed text-cinema-muted md:ps-5">
                {currentStage?.body}
              </p>
            </div>
          ) : (
            <div key="final" className="hero-final-copy max-w-[42rem] pe-10 md:pe-16">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-cinema-muted">
                {eyebrow}
              </p>

              <div
                aria-hidden
                className="hero-final-title mt-5 max-w-[11ch] text-[clamp(2.35rem,7.2vw,6.5rem)] font-bold text-cinema-text"
              >
                <span className="block whitespace-nowrap">{titleLine1}</span>
                <span className="block whitespace-nowrap text-white/58">{titleLine2}</span>
              </div>

              <div className="mt-7 border-s border-white/35 ps-4 md:mt-9 md:ps-5" aria-live="polite">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cinema-text">
                  {currentStage?.label}
                </p>
                <p className="mt-2 max-w-[34rem] text-[clamp(.95rem,1.8vw,1.1rem)] leading-relaxed text-cinema-muted">
                  {currentStage?.body}
                </p>
              </div>

              <p className="mt-5 hidden max-w-xl text-sm leading-relaxed text-white/58 sm:block md:text-base">
                {subtitle}
              </p>

              <div className="mt-7 flex flex-wrap gap-3 md:mt-9">
                <Button asChild variant="solid" size="lg" className="!bg-white !text-black hover:!bg-white/90">
                  <Link href="/products">
                    {exploreLabel}
                    <ArrowRight className="rtl:-scale-x-100" aria-hidden />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="!border-white/35 !text-white hover:!border-white/60 hover:!bg-white/10"
                >
                  <Link href="/inquiry">{quoteLabel}</Link>
                </Button>
              </div>
            </div>
          )}
        </Container>

        <nav
          aria-label={progressLabel}
          hidden={staticHero}
          className="absolute end-5 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-[7px] md:flex lg:end-8"
        >
          {Array.from({ length: RAIL_TICKS }, (_, index) => {
            const stageIndex = STAGE_STOPS.findIndex(
              (stop) => Math.round(stop * (RAIL_TICKS - 1)) === index,
            );
            const isStage = stageIndex !== -1;
            return (
              <button
                key={index}
                type="button"
                onClick={() => (isStage ? scrollToStage(stageIndex) : undefined)}
                disabled={!isStage}
                aria-label={isStage ? stages[stageIndex]?.label : undefined}
                aria-current={isStage && stageIndex === activeStage ? "step" : undefined}
                className={cn(
                  "group flex h-2 w-12 items-center justify-end disabled:pointer-events-none",
                  isStage && "cursor-pointer",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "block h-px rounded-full transition-[width,background-color] duration-300",
                    index === activeTick
                      ? "w-9 bg-white"
                      : index < activeTick
                        ? "w-5 bg-white/45"
                        : "w-2 bg-white/25",
                    isStage && index !== activeTick && "w-6 group-hover:w-9 group-hover:bg-white/75",
                  )}
                />
              </button>
            );
          })}

          <button
            type="button"
            onClick={skipIntro}
            className="mt-3 flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-black/25 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-white/80 backdrop-blur-md transition-colors hover:border-white/50 hover:text-white"
          >
            {skipLabel}
            <ArrowDown className="size-3.5" aria-hidden />
          </button>
        </nav>

        <button
          type="button"
          onClick={skipIntro}
          hidden={staticHero}
          className="absolute bottom-4 end-4 flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-black/40 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.1em] text-white/85 backdrop-blur-md md:hidden"
        >
          {skipLabel}
          <ArrowDown className="size-3.5" aria-hidden />
        </button>
      </div>
    </section>
  );
}
