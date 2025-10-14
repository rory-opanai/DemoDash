import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-[14px] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/80",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";


