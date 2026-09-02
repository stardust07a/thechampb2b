import { cn } from "@/lib/utils";

/**
 * Tipografik wordmark.
 * Logo dosyaları (SVG) henüz gelmedi (brief §16) — geldiğinde bu bileşenin
 * içi <Image> ile değiştirilir, kullanıldığı yerlerin hiçbiri değişmez.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      // Latin wordmark: Arapçada da soldan sağa okunur
      dir="ltr"
      className={cn(
        "inline-flex items-baseline gap-[0.35em] font-bold tracking-[-0.02em]",
        "text-[0.95rem] leading-none md:text-[1.05rem]",
        className,
      )}
    >
      <span className="chrome-text">THE CHAMP</span>
      <span className="wordmark-global text-[0.62em] font-medium uppercase tracking-[0.18em] text-faint">
        Global
      </span>
    </span>
  );
}
