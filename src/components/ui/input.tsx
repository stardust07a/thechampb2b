import { cn } from "@/lib/utils";

/** Input — brief §3.3: --surface-2 zemin, focus'ta görünür halka. */
export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[--radius-inner] border border-line bg-surface-2 px-4 text-base md:text-[15px]",
        "text-fg placeholder:text-faint transition-colors duration-200",
        "hover:border-chrome-1/60",
        "aria-[invalid=true]:border-danger",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-[--radius-inner] border border-line bg-surface-2 px-4 py-3",
        "text-base text-fg placeholder:text-faint transition-colors duration-200 resize-y md:text-[15px]",
        "hover:border-chrome-1/60 aria-[invalid=true]:border-danger",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-[--radius-inner] border border-line bg-surface-2 px-4 text-base md:text-[15px]",
        "text-fg transition-colors duration-200 hover:border-chrome-1/60",
        "aria-[invalid=true]:border-danger",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("mb-2 block text-sm font-medium text-muted", className)}
      {...props}
    />
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-sm text-danger">
      {children}
    </p>
  );
}
