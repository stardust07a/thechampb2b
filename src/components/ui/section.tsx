import { cn } from "@/lib/utils";

/** Sayfa genişliği tek yerden yönetilir. */
export function Container({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[1400px] px-5 md:px-8", className)} {...props} />;
}

export function Section({
  className,
  bleed,
  ...props
}: React.ComponentProps<"section"> & { bleed?: boolean }) {
  return (
    <section
      className={cn("py-16 md:py-24", bleed && "bg-bg-2", className)}
      {...props}
    />
  );
}

/** Bölüm başlığı: eyebrow + krom gradyanlı başlık + açıklama. */
export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-10 flex flex-wrap items-end justify-between gap-6", className)}>
      <div className="max-w-2xl">
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <h2 className="chrome-text text-h2 md:text-[2.5rem]">{title}</h2>
        {description ? <p className="mt-4 text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
