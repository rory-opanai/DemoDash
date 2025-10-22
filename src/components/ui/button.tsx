"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?:
    | "default"
    | "secondary"
    | "ghost"
    | "outline"
    | "destructive"
    | "link";
  size?: "sm" | "md" | "lg" | "icon";
  asChild?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const base =
      "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-medium transition-colors motion-safe-only focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/80 disabled:opacity-60 disabled:pointer-events-none";
    const variants: Record<string, string> = {
      default:
        "bg-black text-white hover:bg-black/90",
      secondary:
        "bg-neutral-100 hover:bg-neutral-200 text-neutral-900",
      ghost: "hover:bg-neutral-100",
      outline:
        "border border-neutral-300 bg-transparent hover:bg-neutral-50",
      destructive:
        "bg-red-600 text-white hover:bg-red-700",
      link: "text-foreground underline-offset-4 hover:underline bg-transparent"
    };
    const sizes: Record<string, string> = {
      sm: "h-9 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-11 px-5 text-[15px]",
      icon: "h-10 w-10 rounded-xl"
    };
    return (
      <Comp ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />
    );
  }
);
Button.displayName = "Button";

