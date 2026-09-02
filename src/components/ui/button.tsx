import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

/**
 * Buton dili — brief §3.3.
 * primary: pill + 1px krom gradyan kenar, şeffaf zemin
 * solid:   dark'ta beyaz zemin siyah metin, light'ta tersi
 */
const button = cva(
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap " +
    "transition-[background-color,border-color,color,transform] duration-250 " +
    "ease-[cubic-bezier(.22,1,.36,1)] disabled:pointer-events-none disabled:opacity-50 " +
    "[&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "chrome-border rounded-[--radius-pill] bg-transparent text-fg hover:bg-surface-2",
        solid:
          "rounded-[--radius-pill] bg-solid text-on-solid hover:opacity-90 border border-transparent",
        outline:
          "rounded-[--radius-pill] border border-line bg-transparent text-fg hover:border-chrome-1 hover:bg-surface",
        ghost: "rounded-[--radius-inner] text-muted hover:bg-surface-2 hover:text-fg",
        danger:
          "rounded-[--radius-pill] border border-transparent bg-danger/12 text-danger hover:bg-danger/20",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-7 text-[15px]",
        lg: "h-13 px-8 text-base",
        icon: "size-10 rounded-[--radius-inner] px-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof button> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(button({ variant, size }), className)} {...props} />;
}

export { button as buttonVariants };
