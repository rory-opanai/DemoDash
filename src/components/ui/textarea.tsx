import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex w-full min-h-[140px] rounded-xl border border-neutral-200 bg-white p-4 text-[14px] leading-6 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/80",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";


