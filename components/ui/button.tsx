import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:brightness-110 hover:shadow-md hover:-translate-y-px",
        destructive: "bg-red-600 text-white shadow-sm hover:brightness-110 hover:shadow-md hover:-translate-y-px",
        outline: "border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] shadow-sm hover:bg-[var(--app-surface-raised)]",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        soft: "bg-primary/10 text-primary shadow-none hover:bg-primary/15 border border-primary/15",
        ghost: "text-[var(--app-text)] shadow-none hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-accent)]",
        link: "text-primary underline-offset-4 hover:underline shadow-none",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-9 px-4 text-[13px]",
        lg: "h-11 px-8",
        icon: "h-9 w-9",
        "icon-lg": "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
