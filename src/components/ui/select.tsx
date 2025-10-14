import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn("h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-black/80", className)}
      {...props}
    />
  );
});
Select.displayName = 'Select';


