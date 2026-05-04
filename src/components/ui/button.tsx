import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:stroke-[2.4]",
  {
    variants: {
      variant: {
        default:
          "bg-primary !text-white font-extrabold shadow-soft hover:bg-[#00B872] hover:shadow-pop [&_svg]:!text-white",
        destructive:
          "bg-destructive !text-white font-extrabold shadow-soft hover:bg-destructive/90 [&_svg]:!text-white",
        secondary:
          "bg-muted text-foreground font-bold hover:bg-muted/70",
        ghost: "text-foreground font-semibold hover:bg-muted/60",
        outline:
          "border border-border bg-card text-foreground font-semibold hover:bg-muted/50",
        link: "text-primary font-semibold underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 text-body-l",
        sm: "h-9 px-4 text-body-m",
        lg: "h-14 px-8 text-body-l",
        icon: "h-10 w-10 rounded-full",
        "icon-sm": "h-9 w-9 rounded-full",
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
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
