import { cn } from "@/lib/utils";

/**
 * Kart — brief §3.3: --surface zemin, 1px kenar, gölge yok,
 * hover'da kenar --chrome-1'e yaklaşır. Köşeler eşmerkezli (dış 16 → iç 10).
 */
export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-[--radius-card] border border-line bg-surface",
        "transition-colors duration-300 ease-[cubic-bezier(.22,1,.36,1)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-5", className)} {...props} />;
}
