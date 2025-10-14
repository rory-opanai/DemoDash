import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function RightPane({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-neutral-200 bg-white p-5 md:p-6", className)} {...props} />;
}


